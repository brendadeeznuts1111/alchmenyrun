import { StateManager } from "./state-manager";
import { BaseScopeOptions, Scope, ScopeMetadata, FinalizationReport } from "./application-scope";

/**
 * Resource scope options
 */
export interface ResourceScopeOptions extends BaseScopeOptions {
  /** Resource identifier */
  resourceId: string;
  /** Resource type (e.g., "worker", "database", "bucket") */
  resourceType: string;
}

/**
 * Resource scope - implicit child resource encapsulation
 * Created automatically for each resource within a parent scope
 */
export class ResourceScope implements Scope {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly parent: Scope;
  readonly children = new Map<string, Scope>();
  readonly stateManager: StateManager;
  readonly createdAt: number;
  readonly type = 'resource' as const;

  private readonly resourceId: string;
  private readonly resourceType: string;
  private finalized = false;

  constructor(parent: Scope, options: ResourceScopeOptions) {
    this.parent = parent;
    this.resourceId = options.resourceId;
    this.resourceType = options.resourceType;
    this.name = `${this.resourceType}-${this.resourceId}`;
    this.id = `resource-${parent.path.replace(/\//g, '-')}-${this.name}`;
    this.path = `${parent.path}/${this.name}`;
    this.createdAt = Date.now();

    // Use parent's state manager but with resource-specific path
    this.stateManager = new StateManager({
      baseDir: `${parent.stateManager.baseDir}/resources/${this.name}`,
      enableLocking: true,
      lockTimeout: options.timeout || 30000,
    });

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
    const created: string[] = [];
    const updated: string[] = [];
    const destroyed: string[] = [];

    try {
      this.finalized = true;

      // Finalize all child scopes first
      for (const child of this.children.values()) {
        try {
          const childReport = await child.finalize();
          created.push(...childReport.created);
          updated.push(...childReport.updated);
          destroyed.push(...childReport.destroyed);
          errors.push(...childReport.errors);
        } catch (error) {
          errors.push(error as Error);
        }
      }

      // TODO: Implement resource-specific finalization logic
      // This would handle individual resource cleanup

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

  getMetadata(): ScopeMetadata {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      type: this.type,
      createdAt: this.createdAt,
      childrenCount: this.children.size,
      resourceCount: 1, // Resource scopes contain exactly one resource
      statePath: this.stateManager.baseDir,
    };
  }

  /**
   * Get the resource identifier
   */
  getResourceId(): string {
    return this.resourceId;
  }

  /**
   * Get the resource type
   */
  getResourceType(): string {
    return this.resourceType;
  }
}
