import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { promises as fs } from "fs";
import {
  DistributedLock,
  FileDistributedLock,
  CloudDistributedLock,
  CompositeDistributedLock
} from "./distributed-lock";


/**
 * Resource state representation
 */
export interface ResourceState {
  id: string;
  type: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

/**
 * Scope state file contents
 */
export interface ScopeState {
  version: string;
  scopePath: string;
  createdAt: number;
  updatedAt: number;
  resources: Record<string, ResourceState>;
  nestedScopes: string[];
}

/**
 * State backend types
 */
export type StateBackendType = 'file' | 'r2' | 's3' | 'composite';

/**
 * State manager configuration
 */
export interface StateManagerConfig {
  /**
   * Base directory for state files (default: ".alchemy")
   */
  baseDir?: string;

  /**
   * Enable distributed locking
   */
  enableLocking?: boolean;

  /**
   * Lock timeout in milliseconds (default: 30000)
   */
  lockTimeout?: number;

  /**
   * Version for state files
   */
  version?: string;

  /**
   * State backend type
   */
  backend?: StateBackendType;

  /**
   * R2 bucket for cloud storage (required for 'r2' or 'composite' backend)
   */
  r2Bucket?: any; // R2Bucket type

  /**
   * S3 configuration (required for 's3' backend)
   */
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };

  /**
   * State file versioning with timestamps
   */
  enableVersioning?: boolean;

  /**
   * Maximum number of backup versions to keep
   */
  maxBackupVersions?: number;
}

/**
 * File-based state locking implementation
 */
export class FileStateLock implements StateLock {
  private readonly lockFiles = new Map<string, string>();
  private readonly baseDir: string;

  constructor(baseDir: string = ".alchemy") {
    this.baseDir = baseDir;
  }

  async acquire(scopePath: string, timeout: number = 30000): Promise<boolean> {
    const lockFile = this.getLockFilePath(scopePath);
    const startTime = Date.now();

    // Ensure lock directory exists
    const lockDir = dirname(lockFile);
    if (!existsSync(lockDir)) {
      mkdirSync(lockDir, { recursive: true });
    }

    while (Date.now() - startTime < timeout) {
      try {
        // Try to create lock file exclusively
        writeFileSync(lockFile, `${process.pid}:${Date.now()}`, { flag: 'wx' });
        this.lockFiles.set(scopePath, lockFile);
        return true;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock file exists, wait and retry
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
    }

    return false; // Timeout
  }

  async release(scopePath: string): Promise<void> {
    const lockFile = this.lockFiles.get(scopePath);
    if (lockFile && existsSync(lockFile)) {
      try {
        unlinkSync(lockFile);
      } catch (error) {
        console.warn(`Failed to release lock for ${scopePath}:`, error);
      }
    }
    this.lockFiles.delete(scopePath);
  }

  async isLocked(scopePath: string): Promise<boolean> {
    const lockFile = this.getLockFilePath(scopePath);
    return existsSync(lockFile);
  }

  private getLockFilePath(scopePath: string): string {
    return join(this.baseDir, scopePath, ".lock");
  }
}

/**
 * State manager for hierarchical scope state management
 */
export class StateManager {
  public readonly baseDir: string;
  private readonly lockManager: DistributedLock;
  private readonly enableLocking: boolean;
  private readonly version: string;
  private readonly enableVersioning: boolean;
  private readonly maxBackupVersions: number;

  constructor(config: StateManagerConfig = {}) {
    this.baseDir = config.baseDir || ".alchemy";
    this.enableLocking = config.enableLocking ?? true;
    this.version = config.version || "1.0";
    this.enableVersioning = config.enableVersioning ?? false;
    this.maxBackupVersions = config.maxBackupVersions ?? 10;

    // Initialize distributed lock based on backend type
    this.lockManager = this.createDistributedLock(config);
  }

  private createDistributedLock(config: StateManagerConfig): DistributedLock {
    const backend = config.backend || 'file';

    switch (backend) {
      case 'file':
        return new FileDistributedLock(this.baseDir);

      case 'r2':
        if (!config.r2Bucket) {
          throw new Error("R2 bucket is required for 'r2' backend");
        }
        return new CloudDistributedLock(config.r2Bucket, 'locks');

      case 's3':
        throw new Error("S3 backend not yet implemented");

      case 'composite':
        if (!config.r2Bucket) {
          throw new Error("R2 bucket is required for 'composite' backend");
        }
        const cloudLock = new CloudDistributedLock(config.r2Bucket, 'locks');
        const fileLock = new FileDistributedLock(this.baseDir);
        return new CompositeDistributedLock(cloudLock, fileLock);

      default:
        throw new Error(`Unknown backend type: ${backend}`);
    }
  }

  /**
   * Get the full path for a scope's state file
   */
  private getStateFilePath(scopePath: string): string {
    return join(this.baseDir, scopePath, "state.json");
  }

  /**
   * Ensure directory exists for a scope path
   */
  private ensureScopeDirectory(scopePath: string): void {
    const dir = join(this.baseDir, scopePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Load state for a scope
   */
  async loadState(scopePath: string): Promise<ScopeState | null> {
    const stateFile = this.getStateFilePath(scopePath);

    if (!existsSync(stateFile)) {
      return null;
    }

    try {
      const data = readFileSync(stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Failed to load state for scope ${scopePath}:`, error);
      return null;
    }
  }

  /**
   * Save state for a scope
   */
  async saveState(scopePath: string, state: ScopeState): Promise<void> {
    if (this.enableLocking) {
      const locked = await this.lockManager.acquire(scopePath, 30000);
      if (!locked) {
        throw new Error(`Failed to acquire lock for scope ${scopePath}`);
      }
    }

    try {
      this.ensureScopeDirectory(scopePath);
      const stateFile = this.getStateFilePath(scopePath);

      state.updatedAt = Date.now();
      state.version = this.version;

      const data = JSON.stringify(state, null, 2);

      // Create backup if versioning is enabled
      if (this.enableVersioning && existsSync(stateFile)) {
        await this.createBackup(scopePath);
      }

      writeFileSync(stateFile, data, 'utf8');
    } finally {
      if (this.enableLocking) {
        await this.lockManager.release(scopePath);
      }
    }
  }

  /**
   * Initialize a new scope state
   */
  createInitialState(scopePath: string): ScopeState {
    return {
      version: "1.0",
      scopePath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resources: {},
      nestedScopes: []
    };
  }

  /**
   * Add a resource to scope state
   */
  async addResource(scopePath: string, resourceId: string, resource: Omit<ResourceState, 'updatedAt'>): Promise<void> {
    const state = await this.loadState(scopePath) || this.createInitialState(scopePath);

    state.resources[resourceId] = {
      ...resource,
      updatedAt: Date.now()
    };

    await this.saveState(scopePath, state);
  }

  /**
   * Remove a resource from scope state
   */
  async removeResource(scopePath: string, resourceId: string): Promise<void> {
    const state = await this.loadState(scopePath);
    if (!state) return;

    delete state.resources[resourceId];
    await this.saveState(scopePath, state);
  }

  /**
   * Get all resources in a scope
   */
  async getResources(scopePath: string): Promise<Record<string, ResourceState>> {
    const state = await this.loadState(scopePath);
    return state?.resources || {};
  }

  /**
   * Add a nested scope reference
   */
  async addNestedScope(parentScopePath: string, nestedScopeName: string): Promise<void> {
    const state = await this.loadState(parentScopePath) || this.createInitialState(parentScopePath);

    if (!state.nestedScopes.includes(nestedScopeName)) {
      state.nestedScopes.push(nestedScopeName);
      await this.saveState(parentScopePath, state);
    }
  }

  /**
   * Remove a nested scope reference
   */
  async removeNestedScope(parentScopePath: string, nestedScopeName: string): Promise<void> {
    const state = await this.loadState(parentScopePath);
    if (!state) return;

    state.nestedScopes = state.nestedScopes.filter(name => name !== nestedScopeName);
    await this.saveState(parentScopePath, state);
  }

  /**
   * Get all nested scopes
   */
  async getNestedScopes(scopePath: string): Promise<string[]> {
    const state = await this.loadState(scopePath);
    return state?.nestedScopes || [];
  }

  /**
   * Delete scope state (for cleanup)
   */
  async deleteState(scopePath: string): Promise<void> {
    const stateFile = this.getStateFilePath(scopePath);

    if (existsSync(stateFile)) {
      unlinkSync(stateFile);
    }

    // Clean up empty directories
    const scopeDir = join(this.baseDir, scopePath);
    try {
      await fs.rmdir(scopeDir);
    } catch (error) {
      // Directory not empty or doesn't exist, ignore
    }
  }

  /**
   * Check if scope is currently locked
   */
  async isLocked(scopePath: string): Promise<boolean> {
    return this.lockManager.isLocked(scopePath);
  }

  /**
   * Create a backup of the current state file
   */
  private async createBackup(scopePath: string): Promise<void> {
    const stateFile = this.getStateFilePath(scopePath);
    const backupDir = join(this.baseDir, scopePath, 'backups');

    // Ensure backup directory exists
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `state-${timestamp}.json`);

    try {
      // Copy current state to backup
      const currentData = readFileSync(stateFile, 'utf8');
      writeFileSync(backupFile, currentData, 'utf8');

      // Clean up old backups if we have too many
      await this.cleanupOldBackups(backupDir);
    } catch (error) {
      console.warn(`Failed to create backup for ${scopePath}:`, error);
    }
  }

  /**
   * Clean up old backup files, keeping only the most recent ones
   */
  private async cleanupOldBackups(backupDir: string): Promise<void> {
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('state-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: join(backupDir, file),
          stats: null as any
        }));

      // Get stats for all backup files
      for (const file of backupFiles) {
        try {
          file.stats = await fs.stat(file.path);
        } catch {
          // Skip files we can't stat
        }
      }

      // Sort by modification time (newest first)
      backupFiles.sort((a, b) => {
        if (!a.stats || !b.stats) return 0;
        return b.stats.mtime.getTime() - a.stats.mtime.getTime();
      });

      // Remove old backups beyond the limit
      if (backupFiles.length > this.maxBackupVersions) {
        const toDelete = backupFiles.slice(this.maxBackupVersions);
        for (const file of toDelete) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.warn(`Failed to delete old backup ${file.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to cleanup backups in ${backupDir}:`, error);
    }
  }

  /**
   * Get backup versions for a scope
   */
  async getBackupVersions(scopePath: string): Promise<string[]> {
    const backupDir = join(this.baseDir, scopePath, 'backups');

    if (!existsSync(backupDir)) {
      return [];
    }

    try {
      const files = await fs.readdir(backupDir);
      return files
        .filter(file => file.startsWith('state-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Newest first
    } catch {
      return [];
    }
  }

  /**
   * Restore from a backup version
   */
  async restoreFromBackup(scopePath: string, backupFilename: string): Promise<boolean> {
    const backupFile = join(this.baseDir, scopePath, 'backups', backupFilename);
    const stateFile = this.getStateFilePath(scopePath);

    if (!existsSync(backupFile)) {
      return false;
    }

    try {
      const backupData = readFileSync(backupFile, 'utf8');
      writeFileSync(stateFile, backupData, 'utf8');
      return true;
    } catch (error) {
      console.warn(`Failed to restore from backup ${backupFilename}:`, error);
      return false;
    }
  }

  /**
   * Force release lock (for emergency situations)
   */
  async forceReleaseLock(scopePath: string): Promise<void> {
    await this.lockManager.forceRelease(scopePath);
  }
}
