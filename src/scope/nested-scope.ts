import { StateManager } from "./state-manager";
import { Scope, BaseScopeOptions, ScopeMetadata, FinalizationReport } from "./interfaces";

/**
 * Nested scope configuration
 */
export interface NestedScopeConfig extends BaseScopeOptions {
  /**
   * Parent scope path (e.g., "my-app/prod")
   */
  parentScopePath: string;

  /**
   * Nested scope name (e.g., "backend", "frontend")
   */
  scopeName: string;
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
export class NestedScope implements Scope {
  public readonly parentScopePath: string;
  public readonly scopeName: string;
  public readonly scopePath: string;
  public readonly path: string;
  public readonly id: string;
  public readonly name: string;
  public readonly parent: Scope;
  public readonly children = new Map<string, Scope>();
  public readonly createdAt: number;
  public readonly type = 'nested' as const;

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

  constructor(config: NestedScopeConfig, parent: Scope) {
    this.parentScopePath = config.parentScopePath;
    this.scopeName = config.scopeName;
    this.scopePath = `${this.parentScopePath}/${this.scopeName}`;
    this.path = this.scopePath;
    this.name = this.scopeName;
    this.id = `nested-${this.scopePath.replace(/\//g, '-')}`;
    this.parent = parent;
    this.createdAt = Date.now();

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
      resourceCount: this.context ? Object.keys(this.context.resources).length : 0,
      statePath: this.stateManager.baseDir,
    };
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
    }, this);
  }

  /**
   * Finalize this nested scope (automatic cleanup)
   */
  async finalize(): Promise<FinalizationReport> {
    if (!this.initialized) {
      return {
        scope: this,
        created: [],
        updated: [],
        destroyed: [],
        errors: [],
        duration: 0,
        success: true,
      };
    }

    const startTime = Date.now();
    const errors: Error[] = [];
    const destroyed: string[] = [];

    try {
      // Get all resources before deletion for cleanup
      const resources = await this.getResources();
      const resourceIds = Object.keys(resources);

      // Delete all resources in this scope
      for (const resourceId of resourceIds) {
        try {
          await this.performResourceDeletion(resourceId);
          await this.removeResource(resourceId);
          destroyed.push(resourceId);
        } catch (error) {
          console.warn(`Failed to delete resource ${resourceId} in nested scope ${this.scopePath}:`, error);
          errors.push(error as Error);
        }
      }

      // Clean up nested scopes recursively
      const nestedScopes = await this.getNestedScopes();
      for (const nestedScopeName of nestedScopes) {
        const childScope = this.createChildScope(nestedScopeName);
        const childReport = await childScope.finalize();
        destroyed.push(...childReport.destroyed);
        errors.push(...childReport.errors);
      }

      // Remove from parent scope
      await this.stateManager.removeNestedScope(this.parentScopePath, this.scopeName);

      // Delete this scope's state
      await this.stateManager.deleteState(this.scopePath);

    } catch (error) {
      console.error(`Failed to finalize nested scope ${this.scopePath}:`, error);
      errors.push(error as Error);
    }

    return {
      scope: this,
      created: [],
      updated: [],
      destroyed,
      errors,
      duration: Date.now() - startTime,
      success: errors.length === 0,
    };
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
