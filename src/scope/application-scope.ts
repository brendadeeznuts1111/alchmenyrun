import { StateManager, ResourceState } from "./state-manager";
import { Scope, BaseScopeOptions, ScopeMetadata, FinalizationReport } from "./interfaces";

/**
 * Application scope configuration
 */
export interface ApplicationScopeConfig extends BaseScopeOptions {
  /**
   * Application name (used for state directory)
   */
  name: string;

  /**
   * Stage name (default: process.env.USER)
   */
  stage?: string;

  /**
   * Profile for security isolation
   */
  profile?: string;

  /**
   * Destroy strategy: "sequential" or "parallel"
   */
  destroyStrategy?: "sequential" | "parallel";

  /**
   * Phase for deployment operations
   */
  phase?: "up" | "destroy" | "read";
}

/**
 * Stage scope options
 */
export interface StageScopeOptions extends BaseScopeOptions {
  /** Stage name (e.g., 'prod', 'dev', 'staging') */
  stage: string;
}

/**
 * Nested scope options
 */
export interface NestedScopeOptions extends BaseScopeOptions {
  /** Nested scope name */
  name: string;
}

/**
 * Test scope options
 */
export interface TestScopeOptions extends BaseScopeOptions {
  /** Test identifier */
  testId: string;
  /** Branch prefix for test isolation */
  branchPrefix?: string;
  /** Auto-cleanup on test completion */
  autoCleanup?: boolean;
}

/**
 * Application scope - root container for hierarchical resource management
 *
 * CODEOWNERS TEST: This file should trigger @alice.smith and @infra_dev2 for review
 */
export class ApplicationScope implements Scope {
  public readonly id: string;
  public readonly name: string;
  public readonly stage: string;
  public readonly profile: string;
  public readonly scopePath: string;
  public readonly destroyStrategy: "sequential" | "parallel";
  public readonly path: string;
  public readonly parent: Scope | null = null;
  public readonly children = new Map<string, Scope>();
  public readonly createdAt: number;
  public readonly type = 'application' as const;

  private readonly stateManager: StateManager;
  private readonly nestedScopes = new Set<string>();
  private readonly currentResourceIds = new Set<string>();
  private initialized = false;

  /**
   * Initialize the application scope
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load or create initial state
    let state = await this.stateManager.loadState(this.scopePath);
    if (!state) {
      state = this.stateManager.createInitialState(this.scopePath);
      await this.stateManager.saveState(this.scopePath, state);
    }

    // Restore nested scopes from state
    const nestedScopes = await this.stateManager.getNestedScopes(this.scopePath);
    nestedScopes.forEach(scope => this.nestedScopes.add(scope));

    this.initialized = true;
  }

  constructor(config: ApplicationScopeConfig) {
    this.name = config.name;
    this.stage = config.stage || process.env.USER || "default";
    this.profile = config.profile || "default";
    this.scopePath = `${this.name}/${this.stage}`;
    this.path = this.scopePath;
    this.destroyStrategy = config.destroyStrategy || "sequential";
    this.createdAt = Date.now();
    this.id = `app-${this.name}-${this.stage}`;

    this.stateManager = new StateManager({
      baseDir: config.stateDir,
      enableLocking: config.enableLocking ?? true
    });
  }

  /**
   * Add a child scope
   */
  addChild(child: Scope): void {
    this.children.set(child.name, child);
  }

  /**
   * Remove a child scope
   */
  removeChild(name: string): void {
    this.children.delete(name);
  }

  /**
   * Get a child scope by name
   */
  getChild(name: string): Scope | undefined {
    return this.children.get(name);
  }

  /**
   * Check if a child scope exists
   */
  hasChild(name: string): boolean {
    return this.children.has(name);
  }

  /**
   * Get all descendant scopes
   */
  getDescendants(): Scope[] {
    const descendants: Scope[] = [];
    for (const child of this.children.values()) {
      descendants.push(child);
      descendants.push(...child.getDescendants());
    }
    return descendants;
  }

  /**
   * Get scope metadata
   */
  getMetadata(): ScopeMetadata {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      type: this.type,
      createdAt: this.createdAt,
      childrenCount: this.children.size,
      resourceCount: this.currentResourceIds.size,
      statePath: this.stateManager.baseDir,
    };
  }

  /**
   * Register a nested scope
   */
  async registerNestedScope(scopeName: string): Promise<void> {
    await this.initialize();

    if (!this.nestedScopes.has(scopeName)) {
      this.nestedScopes.add(scopeName);
      await this.stateManager.addNestedScope(this.scopePath, scopeName);
    }
  }

  /**
   * Unregister a nested scope
   */
  async unregisterNestedScope(scopeName: string): Promise<void> {
    await this.initialize();

    if (this.nestedScopes.has(scopeName)) {
      this.nestedScopes.delete(scopeName);
      await this.stateManager.removeNestedScope(this.scopePath, scopeName);
    }
  }

  /**
   * Get all nested scopes
   */
  async getNestedScopes(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.nestedScopes);
  }

  /**
   * Get all resources in this scope (not including nested scopes)
   */
  async getResources(): Promise<Record<string, ResourceState>> {
    await this.initialize();
    return await this.stateManager.getResources(this.scopePath);
  }

  /**
   * Add a resource to this scope
   */
  async addResource(resourceId: string, resource: Omit<ResourceState, 'updatedAt'>): Promise<void> {
    await this.initialize();
    await this.stateManager.addResource(this.scopePath, resourceId, resource);
  }

  /**
   * Remove a resource from this scope
   */
  async removeResource(resourceId: string): Promise<void> {
    await this.initialize();
    await this.stateManager.removeResource(this.scopePath, resourceId);
  }

  /**
   * Finalize the application scope with error recovery
   */
  async finalize(options: {
    retryAttempts?: number;
    strategy?: 'conservative' | 'aggressive';
    dryRun?: boolean;
  } = {}): Promise<FinalizationReport> {
    const startTime = Date.now();
    const created: string[] = [];
    const updated: string[] = [];
    const destroyed: string[] = [];
    const errors: Error[] = [];

    const { retryAttempts = 3, strategy = 'conservative', dryRun = false } = options;

    try {
      await this.initialize();

      // Process nested scopes first (bottom-up cleanup)
      const nestedScopeNames = await this.getNestedScopes();

      if (this.destroyStrategy === 'parallel') {
        // Process nested scopes in parallel
        const nestedPromises = nestedScopeNames.map(async (scopeName) => {
          try {
            const nestedScopePath = `${this.scopePath}/${scopeName}`;
            await this.finalizeNestedScope(nestedScopePath, { retryAttempts, strategy, dryRun });
            return scopeName;
          } catch (error) {
            errors.push(error as Error);
            return null;
          }
        });

        const results = await Promise.all(nestedPromises);
        results.forEach(result => {
          if (result) destroyed.push(result);
        });
      } else {
        // Process nested scopes sequentially
        for (const scopeName of nestedScopeNames) {
          try {
            const nestedScopePath = `${this.scopePath}/${scopeName}`;
            await this.finalizeNestedScope(nestedScopePath, { retryAttempts, strategy, dryRun });
            destroyed.push(scopeName);
          } catch (error) {
            errors.push(error as Error);
            if (strategy === 'conservative') {
              // In conservative mode, stop on first error
              break;
            }
          }
        }
      }

      // Process resources in this scope
      const resources = await this.getResources();
      const resourceIds = Object.keys(resources);

      if (this.destroyStrategy === 'parallel') {
        // Delete resources in parallel
        const deletePromises = resourceIds.map(async (resourceId) => {
          const success = await this.deleteResourceWithRetry(resourceId, retryAttempts, dryRun);
          if (success) {
            return resourceId;
          } else {
            errors.push(new Error(`Failed to delete resource ${resourceId}`));
            return null;
          }
        });

        const results = await Promise.all(deletePromises);
        results.forEach(result => {
          if (result) destroyed.push(result);
        });
      } else {
        // Delete resources sequentially
        for (const resourceId of resourceIds) {
          const success = await this.deleteResourceWithRetry(resourceId, retryAttempts, dryRun);
          if (success) {
            destroyed.push(resourceId);
          } else {
            errors.push(new Error(`Failed to delete resource ${resourceId}`));
          }
        }
      }

      // Clean up state file if no resources remain
      if (!dryRun && destroyed.length > 0 && Object.keys(await this.getResources()).length === 0) {
        await this.stateManager.deleteState(this.scopePath);
      }

    } catch (error) {
      errors.push(error as Error);
    }

    return {
      scope: this,
      created,
      updated,
      destroyed,
      errors,
      duration: Date.now() - startTime,
      success: errors.length === 0,
    };
  }

  /**
   * Finalize a specific nested scope
   */
  private async finalizeNestedScope(
    nestedScopePath: string,
    options: { retryAttempts: number; strategy: string; dryRun: boolean }
  ): Promise<void> {
    // This would typically delegate to a NestedScope instance
    // For now, we'll implement basic nested scope finalization
    const resources = await this.stateManager.getResources(nestedScopePath);

    for (const [resourceId] of Object.entries(resources)) {
      const success = await this.deleteResourceWithRetry(resourceId, options.retryAttempts, options.dryRun);
      if (!success && options.strategy === 'conservative') {
        throw new Error(`Failed to delete resource ${resourceId} in nested scope ${nestedScopePath}`);
      }
    }

    if (!options.dryRun) {
      await this.stateManager.deleteState(nestedScopePath);
    }
  }

  /**
   * Delete a resource with retry logic
   */
  private async deleteResourceWithRetry(
    resourceId: string,
    retryAttempts: number,
    dryRun: boolean
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        if (!dryRun) {
          await this.performResourceDeletion(resourceId);
        }
        return true;
      } catch (error: any) {
        console.warn(`Resource deletion attempt ${attempt}/${retryAttempts} failed for ${resourceId}:`, error);

        if (attempt === retryAttempts) {
          console.error(`Final attempt failed for resource ${resourceId}:`, error);
          return false;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  /**
   * Perform actual resource deletion (placeholder - would integrate with resource APIs)
   */
  private async performResourceDeletion(resourceId: string): Promise<void> {
    // This would be implemented to call the appropriate resource deletion APIs
    // For now, it's a placeholder that simulates deletion
    console.log(`Deleting resource: ${resourceId}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In a real implementation, this would:
    // 1. Determine resource type from state
    // 2. Call appropriate deletion API (Cloudflare Workers API, D1 API, etc.)
    // 3. Handle API-specific error responses
  }

  /**
   * Get scope statistics
   */
  async getStats(): Promise<{
    totalResources: number;
    nestedScopes: number;
    stateSize: number;
    lastUpdated: number;
  }> {
    await this.initialize();

    const resources = await this.getResources();
    const nestedScopes = await this.getNestedScopes();
    const state = await this.stateManager.loadState(this.scopePath);

    return {
      totalResources: Object.keys(resources).length,
      nestedScopes: nestedScopes.length,
      stateSize: state ? JSON.stringify(state).length : 0,
      lastUpdated: state?.updatedAt || 0
    };
  }

  /**
   * Register a resource with this scope
   */
  registerResource(resourceId: string): void {
    this.currentResourceIds.add(resourceId);
  }

  /**
   * Unregister a resource from this scope
   */
  unregisterResource(resourceId: string): void {
    this.currentResourceIds.delete(resourceId);
  }

  /**
   * Check if a resource is registered with this scope
   */
  hasResource(resourceId: string): boolean {
    return this.currentResourceIds.has(resourceId);
  }

  /**
   * Get all currently registered resources
   */
  getCurrentResources(): string[] {
    return Array.from(this.currentResourceIds);
  }
}