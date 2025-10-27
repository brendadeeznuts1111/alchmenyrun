/**
 * Base scope interface that all scope types must implement
 */
export interface Scope {
  /** Unique identifier for the scope */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Full path in the hierarchy (e.g., "my-app/prod/backend") */
  readonly path: string;
  /** Parent scope (null for application scopes) */
  readonly parent: Scope | null;
  /** Child scopes */
  readonly children: Map<string, Scope>;
  /** Scope type */
  readonly type: 'application' | 'stage' | 'nested' | 'resource' | 'test';
  /** Creation timestamp */
  readonly createdAt: number;
  /** State manager instance */
  readonly stateManager: any;

  /** Add a child scope */
  addChild(child: Scope): void;
  
  /** Remove a child scope */
  removeChild(name: string): void;
  
  /** Get a child scope by name */
  getChild(name: string): Scope | undefined;
  
  /** Check if a child scope exists */
  hasChild(name: string): boolean;
  
  /** Get all descendant scopes */
  getDescendants(): Scope[];
  
  /** Finalize the scope and cleanup resources */
  finalize(): Promise<FinalizationReport>;
  
  /** Get scope metadata */
  getMetadata(): ScopeMetadata;
}

/**
 * Scope metadata for inspection and debugging
 */
export interface ScopeMetadata {
  /** Scope identifier */
  id: string;
  /** Scope name */
  name: string;
  /** Full scope path */
  path: string;
  /** Scope type */
  type: string;
  /** Creation timestamp */
  createdAt: number;
  /** Number of child scopes */
  childrenCount: number;
  /** Number of resources in this scope */
  resourceCount: number;
  /** State file path */
  statePath: string;
}

/**
 * Finalization report for scope cleanup operations
 */
export interface FinalizationReport {
  /** Scope that was finalized */
  scope: Scope;
  /** Resources that were created */
  created: string[];
  /** Resources that were updated */
  updated: string[];
  /** Resources that were destroyed */
  destroyed: string[];
  /** Errors that occurred */
  errors: Error[];
  /** Duration of finalization in milliseconds */
  duration: number;
  /** Whether finalization was successful */
  success: boolean;
}

/**
 * Base scope options that all scope types inherit from
 */
export interface BaseScopeOptions {
  /** State directory for this scope */
  stateDir?: string;
  /** Enable distributed locking */
  enableLocking?: boolean;
  /** Lock timeout in milliseconds */
  timeout?: number;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Test scope implementation
 */
export class TestScope implements Scope {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly parent: Scope;
  readonly children = new Map<string, Scope>();
  readonly stateManager: any;
  readonly createdAt: number;
  readonly type = 'test' as const;

  private readonly testId: string;
  private readonly autoCleanup: boolean;
  private finalized = false;

  constructor(parent: Scope, options: {
    testId: string;
    branchPrefix?: string;
    autoCleanup?: boolean;
  }) {
    this.parent = parent;
    this.testId = options.testId;
    this.autoCleanup = options.autoCleanup ?? true;
    this.name = `test-${this.testId}`;
    this.id = `test-${parent.path.replace(/\//g, '-')}-${this.testId}`;
    this.path = `${parent.path}/${this.name}`;
    this.createdAt = Date.now();

    // Use parent's state manager with test-specific path
    this.stateManager = parent.stateManager;
    
    // Register with parent
    parent.addChild(this);
  }

  addChild(child: Scope): void {
    this.children.set(child.name, child);
  }

  removeChild(name: string): void {
    this.children.delete(name);
  }

  getChild(name: string): Scope | undefined {
    return this.children.get(name);
  }

  hasChild(name: string): boolean {
    return this.children.has(name);
  }

  getDescendants(): Scope[] {
    const descendants: Scope[] = [];
    for (const child of this.children.values()) {
      descendants.push(child);
      descendants.push(...child.getDescendants());
    }
    return descendants;
  }

  async finalize(): Promise<FinalizationReport> {
    if (this.finalized) {
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
      this.finalized = true;

      // Finalize all child scopes first
      for (const child of this.children.values()) {
        try {
          const childReport = await child.finalize();
          destroyed.push(...childReport.destroyed);
          errors.push(...childReport.errors);
        } catch (error) {
          errors.push(error as Error);
        }
      }

      // Test-specific cleanup logic would go here
      console.log(`Test scope ${this.path} finalized`);

    } catch (error) {
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

  getMetadata(): ScopeMetadata {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      type: this.type,
      createdAt: this.createdAt,
      childrenCount: this.children.size,
      resourceCount: 0, // Test scopes don't contain resources directly
      statePath: this.stateManager.baseDir,
    };
  }

  getTestId(): string {
    return this.testId;
  }

  shouldAutoCleanup(): boolean {
    return this.autoCleanup;
  }
}

/**
 * State lock interface for different implementations
 */
export interface StateLock {
  /** Acquire a lock for a scope */
  acquire(scopePath: string, timeout?: number): Promise<boolean>;
  
  /** Release a lock for a scope */
  release(scopePath: string): Promise<void>;
  
  /** Check if a scope is locked */
  isLocked(scopePath: string): Promise<boolean>;
}
