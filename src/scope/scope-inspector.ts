import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, dirname, basename } from "path";
import { StateManager } from "./state-manager";

/**
 * Scope inspection utilities for debugging and monitoring
 */
export class ScopeInspector {
  private readonly stateManager: StateManager;
  private readonly baseDir: string;

  constructor(baseDir: string = ".alchemy") {
    this.baseDir = baseDir;
    this.stateManager = new StateManager({ baseDir });
  }

  /**
   * List all active scopes
   */
  async listScopes(): Promise<ScopeSummary[]> {
    if (!existsSync(this.baseDir)) {
      return [];
    }

    const scopes: ScopeSummary[] = [];

    // Recursively find all state.json files
    const findStateFiles = (dir: string, currentPath: string[] = []): void => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = join(dir, entry.name);
            const newPath = [...currentPath, entry.name];

            // Check if this directory has a state.json file
            const stateFile = join(fullPath, 'state.json');
            if (existsSync(stateFile)) {
              try {
                const state = JSON.parse(readFileSync(stateFile, 'utf8'));
                const scopePath = newPath.join('/');

                scopes.push({
                  path: scopePath,
                  type: this.inferScopeType(newPath),
                  createdAt: new Date(state.createdAt || 0),
                  updatedAt: new Date(state.updatedAt || 0),
                  resourceCount: Object.keys(state.resources || {}).length,
                  nestedScopes: state.nestedScopes || [],
                  locked: this.isScopeLocked(scopePath),
                });
              } catch (error) {
                console.warn(`Failed to parse state file: ${stateFile}`, error);
              }
            }

            // Recurse into subdirectories
            findStateFiles(fullPath, newPath);
          }
        }
      } catch (error) {
        console.warn(`Failed to read directory: ${dir}`, error);
      }
    };

    findStateFiles(this.baseDir);
    return scopes.sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Inspect a specific scope
   */
  async inspectScope(scopePath: string): Promise<ScopeDetails | null> {
    try {
      const state = await this.stateManager.loadState(scopePath);
      if (!state) {
        return null;
      }

      const resources = await this.stateManager.getResources(scopePath);
      const nestedScopes = await this.stateManager.getNestedScopes(scopePath);
      const backups = await this.stateManager.getBackupVersions(scopePath);
      const locked = await this.stateManager.isLocked(scopePath);

      // Get directory info
      const scopeDir = join(this.baseDir, scopePath);
      const dirSize = this.getDirectorySize(scopeDir);

      return {
        path: scopePath,
        type: this.inferScopeType(scopePath.split('/')),
        version: state.version,
        createdAt: new Date(state.createdAt),
        updatedAt: new Date(state.updatedAt),
        resources: Object.entries(resources).map(([id, resource]) => ({
          id,
          type: resource.type,
          createdAt: new Date(resource.createdAt),
          updatedAt: new Date(resource.updatedAt),
          metadata: resource.metadata,
        })),
        nestedScopes,
        backups,
        locked,
        stateSize: dirSize,
      };
    } catch (error) {
      console.error(`Failed to inspect scope ${scopePath}:`, error);
      return null;
    }
  }

  /**
   * Get raw state file contents
   */
  async getStateContents(scopePath: string): Promise<string | null> {
    try {
      const state = await this.stateManager.loadState(scopePath);
      return state ? JSON.stringify(state, null, 2) : null;
    } catch (error) {
      console.error(`Failed to get state contents for ${scopePath}:`, error);
      return null;
    }
  }

  /**
   * Validate scope state integrity
   */
  async validateScope(scopePath: string): Promise<ScopeValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if state file exists
      const state = await this.stateManager.loadState(scopePath);
      if (!state) {
        errors.push('State file not found');
        return { valid: false, errors, warnings };
      }

      // Validate required fields
      if (!state.version) {
        errors.push('Missing version field');
      }
      if (!state.scopePath) {
        errors.push('Missing scopePath field');
      }
      if (typeof state.createdAt !== 'number') {
        errors.push('Invalid createdAt timestamp');
      }
      if (typeof state.updatedAt !== 'number') {
        errors.push('Invalid updatedAt timestamp');
      }

      // Check for stale locks
      if (await this.stateManager.isLocked(scopePath)) {
        warnings.push('Scope is currently locked');
      }

      // Validate resources
      if (state.resources) {
        for (const [id, resource] of Object.entries(state.resources)) {
          if (!resource.id || !resource.type) {
            errors.push(`Resource ${id} missing required fields`);
          }
          if (typeof resource.createdAt !== 'number') {
            warnings.push(`Resource ${id} has invalid createdAt timestamp`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Failed to validate scope: ${error}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Get scope statistics
   */
  async getStatistics(): Promise<ScopeStatistics> {
    const scopes = await this.listScopes();

    const stats: ScopeStatistics = {
      totalScopes: scopes.length,
      scopesByType: {},
      totalResources: 0,
      lockedScopes: 0,
      oldestScope: null,
      newestScope: null,
    };

    for (const scope of scopes) {
      // Count by type
      stats.scopesByType[scope.type] = (stats.scopesByType[scope.type] || 0) + 1;

      // Aggregate resources
      stats.totalResources += scope.resourceCount;

      // Track locks
      if (scope.locked) {
        stats.lockedScopes++;
      }

      // Track oldest/newest
      if (!stats.oldestScope || scope.createdAt < stats.oldestScope.createdAt) {
        stats.oldestScope = scope;
      }
      if (!stats.newestScope || scope.createdAt > stats.newestScope.createdAt) {
        stats.newestScope = scope;
      }
    }

    return stats;
  }

  private inferScopeType(pathParts: string[]): ScopeType {
    const depth = pathParts.length;

    if (depth === 1) return 'application';
    if (depth === 2) {
      // Check if second part looks like a stage (prod, dev, etc.)
      const second = pathParts[1];
      if (second === 'prod' || second === 'dev' || second === 'staging' ||
          second.match(/^(pr|branch|feature)-/) || second.match(/^\d+$/)) {
        return 'stage';
      }
      return 'nested';
    }
    if (pathParts.includes('test') || pathParts.some(p => p.startsWith('test-'))) {
      return 'test';
    }
    if (depth >= 3 && pathParts[pathParts.length - 1].includes('-')) {
      return 'resource';
    }

    return 'nested';
  }

  private isScopeLocked(scopePath: string): boolean {
    return this.stateManager.isLocked(scopePath);
  }

  private getDirectorySize(dirPath: string): number {
    let totalSize = 0;

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isFile()) {
          try {
            const stats = statSync(fullPath);
            totalSize += stats.size;
          } catch {
            // Skip files we can't stat
          }
        } else if (entry.isDirectory()) {
          totalSize += this.getDirectorySize(fullPath);
        }
      }
    } catch {
      // Return 0 if we can't read directory
    }

    return totalSize;
  }
}

/**
 * Scope type enumeration
 */
export type ScopeType = 'application' | 'stage' | 'nested' | 'resource' | 'test';

/**
 * Scope summary for listing
 */
export interface ScopeSummary {
  path: string;
  type: ScopeType;
  createdAt: Date;
  updatedAt: Date;
  resourceCount: number;
  nestedScopes: string[];
  locked: boolean;
}

/**
 * Detailed scope information
 */
export interface ScopeDetails {
  path: string;
  type: ScopeType;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  resources: Array<{
    id: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
  }>;
  nestedScopes: string[];
  backups: string[];
  locked: boolean;
  stateSize: number;
}

/**
 * Scope validation result
 */
export interface ScopeValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Scope statistics
 */
export interface ScopeStatistics {
  totalScopes: number;
  scopesByType: Record<ScopeType, number>;
  totalResources: number;
  lockedScopes: number;
  oldestScope: ScopeSummary | null;
  newestScope: ScopeSummary | null;
}

/**
 * CLI-style output functions
 */
export class ScopeCLI {
  private readonly inspector: ScopeInspector;

  constructor(baseDir: string = ".alchemy") {
    this.inspector = new ScopeInspector(baseDir);
  }

  /**
   * List all scopes (like `alchemy scope list`)
   */
  async listScopes(format: 'table' | 'json' = 'table'): Promise<void> {
    const scopes = await this.inspector.listScopes();

    if (format === 'json') {
      console.log(JSON.stringify(scopes, null, 2));
      return;
    }

    if (scopes.length === 0) {
      console.log('No scopes found.');
      return;
    }

    console.log('Active Scopes:');
    console.log('─'.repeat(80));
    console.log('Path'.padEnd(40), 'Type'.padStart(10), 'Resources'.padStart(10), 'Locked'.padStart(8), 'Updated');
    console.log('─'.repeat(80));

    for (const scope of scopes) {
      const locked = scope.locked ? '🔒' : '  ';
      const updated = scope.updatedAt.toISOString().split('T')[0];
      console.log(
        scope.path.padEnd(40),
        scope.type.padStart(10),
        scope.resourceCount.toString().padStart(10),
        locked.padStart(8),
        updated
      );
    }
  }

  /**
   * Inspect a specific scope (like `alchemy scope inspect <stage>`)
   */
  async inspectScope(scopePath: string, format: 'text' | 'json' = 'text'): Promise<void> {
    const details = await this.inspector.inspectScope(scopePath);

    if (!details) {
      console.error(`Scope not found: ${scopePath}`);
      process.exit(1);
    }

    if (format === 'json') {
      console.log(JSON.stringify(details, null, 2));
      return;
    }

    console.log(`Scope: ${details.path}`);
    console.log(`Type: ${details.type}`);
    console.log(`Version: ${details.version}`);
    console.log(`Created: ${details.createdAt.toISOString()}`);
    console.log(`Updated: ${details.updatedAt.toISOString()}`);
    console.log(`Locked: ${details.locked ? 'Yes' : 'No'}`);
    console.log(`State Size: ${this.formatBytes(details.stateSize)}`);
    console.log();

    if (details.resources.length > 0) {
      console.log('Resources:');
      for (const resource of details.resources) {
        console.log(`  - ${resource.id} (${resource.type})`);
        console.log(`    Created: ${resource.createdAt.toISOString()}`);
        if (resource.metadata) {
          console.log(`    Metadata: ${JSON.stringify(resource.metadata, null, 2)}`);
        }
      }
    } else {
      console.log('Resources: None');
    }

    if (details.nestedScopes.length > 0) {
      console.log();
      console.log('Nested Scopes:');
      for (const nested of details.nestedScopes) {
        console.log(`  - ${nested}`);
      }
    }

    if (details.backups.length > 0) {
      console.log();
      console.log(`Backups: ${details.backups.length} available`);
      console.log(`Latest: ${details.backups[0]}`);
    }
  }

  /**
   * Show state file contents (like `alchemy scope state <stage>`)
   */
  async showState(scopePath: string): Promise<void> {
    const contents = await this.inspector.getStateContents(scopePath);

    if (!contents) {
      console.error(`State file not found: ${scopePath}`);
      process.exit(1);
    }

    console.log(contents);
  }

  /**
   * Show statistics
   */
  async showStatistics(): Promise<void> {
    const stats = await this.inspector.getStatistics();

    console.log('Scope Statistics:');
    console.log(`Total Scopes: ${stats.totalScopes}`);
    console.log(`Total Resources: ${stats.totalResources}`);
    console.log(`Locked Scopes: ${stats.lockedScopes}`);
    console.log();

    console.log('Scopes by Type:');
    for (const [type, count] of Object.entries(stats.scopesByType)) {
      console.log(`  ${type}: ${count}`);
    }

    if (stats.oldestScope) {
      console.log();
      console.log(`Oldest Scope: ${stats.oldestScope.path} (${stats.oldestScope.createdAt.toISOString().split('T')[0]})`);
    }

    if (stats.newestScope) {
      console.log(`Newest Scope: ${stats.newestScope.path} (${stats.newestScope.createdAt.toISOString().split('T')[0]})`);
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
