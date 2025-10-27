import { StateManager } from "./state-manager";

/**
 * Nested scope configuration
 */
export interface NestedScopeConfig {
  /**
   * Parent scope path (e.g., "my-app/prod")
   */
  parentScopePath: string;

  /**
   * Nested scope name (e.g., "backend", "frontend")
   */
  scopeName: string;

  /**
   * Base directory for state files
   */
  stateDir?: string;

  /**
   * Enable state file locking
   */
  enableLocking?: boolean;
}

/**
 * Nested scope context for resource operations
 */
export interface NestedScopeContext {
  scopePath: string;
  parentScopePath: string;
  scopeName: string;
  createdAt: number;
  resources: Record<string, any>;
}

/**
 * Nested scope - hierarchical grouping for service layers and components
 */
export class NestedScope {
  public readonly parentScopePath: string;
  public readonly scopeName: string;
  public readonly scopePath: string;

  private readonly stateManager: StateManager;
  private initialized = false;
  private context: NestedScopeContext | null = null;

  /**
   * Initialize the nested scope
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create initial state if it doesn't exist
    let state = await this.stateManager.loadState(this.scopePath);
    if (!state) {
      state = this.stateManager.createInitialState(this.scopePath);
      await this.stateManager.saveState(this.scopePath, state);
    }

    // Register with parent scope
    await this.stateManager.addNestedScope(this.parentScopePath, this.scopeName);

    // Create context
    const resources = await this.stateManager.getResources(this.scopePath);
    this.context = {
      scopePath: this.scopePath,
      parentScopePath: this.parentScopePath,
      scopeName: this.scopeName,
      createdAt: state.createdAt,
      resources
    };

    this.initialized = true;
  }

  constructor(config: NestedScopeConfig) {
    this.parentScopePath = config.parentScopePath;
    this.scopeName = config.scopeName;
    this.scopePath = `${this.parentScopePath}/${this.scopeName}`;

    this.stateManager = new StateManager({
      baseDir: config.stateDir,
      enableLocking: config.enableLocking ?? true
    });
  }

  /**
   * Initialize the nested scope
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Create initial state if it doesn't exist
    let state = await this.stateManager.loadState(this.scopePath);
    if (!state) {
      state = this.stateManager.createInitialState(this.scopePath);
      await this.stateManager.saveState(this.scopePath, state);
    }

    // Register with parent scope
    await this.stateManager.addNestedScope(this.parentScopePath, this.scopeName);

    // Create context
    const resources = await this.stateManager.getResources(this.scopePath);
    this.context = {
      scopePath: this.scopePath,
      parentScopePath: this.parentScopePath,
      scopeName: this.scopeName,
      createdAt: state.createdAt,
      resources
    };

    this.initialized = true;
  }

  /**
   * Execute a function within this nested scope context
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.initialize();

    try {
      // Set up scope context (in a real implementation, this might set thread-local variables)
      const result = await fn();
      return result;
    } finally {
      // Automatic cleanup when scope exits
      await this.finalize();
    }
  }

  /**
   * Get the current scope context
   */
  getContext(): NestedScopeContext | null {
    return this.context;
  }

  /**
   * Add a resource to this nested scope
   */
  async addResource(resourceId: string, resource: any): Promise<void> {
    await this.initialize();
    await this.stateManager.addResource(this.scopePath, resourceId, resource);

    // Update context
    if (this.context) {
      this.context.resources[resourceId] = resource;
    }
  }

  /**
   * Remove a resource from this nested scope
   */
  async removeResource(resourceId: string): Promise<void> {
    await this.initialize();
    await this.stateManager.removeResource(this.scopePath, resourceId);

    // Update context
    if (this.context) {
      delete this.context.resources[resourceId];
    }
  }

  /**
   * Get all resources in this nested scope
   */
  async getResources(): Promise<Record<string, any>> {
    await this.initialize();
    return await this.stateManager.getResources(this.scopePath);
  }

  /**
   * Get nested scopes within this scope (supports deeper nesting)
   */
  async getNestedScopes(): Promise<string[]> {
    await this.initialize();
    return await this.stateManager.getNestedScopes(this.scopePath);
  }

  /**
   * Register a child nested scope
   */
  async registerNestedScope(childScopeName: string): Promise<void> {
    await this.initialize();
    await this.stateManager.addNestedScope(this.scopePath, childScopeName);
  }

  /**
   * Unregister a child nested scope
   */
  async unregisterNestedScope(childScopeName: string): Promise<void> {
    await this.initialize();
    await this.stateManager.removeNestedScope(this.scopePath, childScopeName);
  }

  /**
   * Create a child nested scope (for deeper hierarchy)
   */
  createChildScope(childScopeName: string): NestedScope {
    return new NestedScope({
      parentScopePath: this.scopePath,
      scopeName: childScopeName,
      stateDir: this.stateManager['baseDir'] // Access private property (in real impl, add getter)
    });
  }

  /**
   * Finalize this nested scope (automatic cleanup)
   */
  async finalize(): Promise<void> {
    if (!this.initialized) return;

    try {
      // Get all resources before deletion for cleanup
      const resources = await this.getResources();
      const resourceIds = Object.keys(resources);

      // Delete all resources in this scope
      for (const resourceId of resourceIds) {
        try {
          await this.performResourceDeletion(resourceId);
          await this.removeResource(resourceId);
        } catch (error) {
          console.warn(`Failed to delete resource ${resourceId} in nested scope ${this.scopePath}:`, error);
          // Continue with other resources
        }
      }

      // Clean up nested scopes recursively
      const nestedScopes = await this.getNestedScopes();
      for (const nestedScopeName of nestedScopes) {
        const childScope = this.createChildScope(nestedScopeName);
        await childScope.finalize();
      }

      // Remove from parent scope
      await this.stateManager.removeNestedScope(this.parentScopePath, this.scopeName);

      // Delete this scope's state
      await this.stateManager.deleteState(this.scopePath);

    } catch (error) {
      console.error(`Failed to finalize nested scope ${this.scopePath}:`, error);
      throw error;
    }
  }

  /**
   * Perform actual resource deletion (placeholder)
   */
  private async performResourceDeletion(resourceId: string): Promise<void> {
    // This would be implemented to call the appropriate resource deletion APIs
    // Similar to ApplicationScope.performResourceDeletion
    console.log(`Deleting resource ${resourceId} in nested scope ${this.scopePath}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * Get scope statistics
   */
  async getStats(): Promise<{
    resourceCount: number;
    nestedScopeCount: number;
    stateSize: number;
    depth: number;
  }> {
    await this.initialize();

    const resources = await this.getResources();
    const nestedScopes = await this.getNestedScopes();
    const state = await this.stateManager.loadState(this.scopePath);

    // Calculate depth by counting path segments
    const depth = this.scopePath.split('/').length - 1; // -1 for app name

    return {
      resourceCount: Object.keys(resources).length,
      nestedScopeCount: nestedScopes.length,
      stateSize: state ? JSON.stringify(state).length : 0,
      depth
    };
  }

  /**
   * Check if this scope is empty (no resources, no nested scopes)
   */
  async isEmpty(): Promise<boolean> {
    await this.initialize();

    const resources = await this.getResources();
    const nestedScopes = await this.getNestedScopes();

    return Object.keys(resources).length === 0 && nestedScopes.length === 0;
  }

  /**
   * Get the full hierarchy path for this scope
   */
  getHierarchyPath(): string[] {
    return this.scopePath.split('/');
  }

  /**
   * Get parent scope information
   */
  getParentInfo(): { path: string; name: string } {
    const pathParts = this.scopePath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/');
    const parentName = pathParts[pathParts.length - 2] || 'root';

    return {
      path: parentPath,
      name: parentName
    };
  }
}
