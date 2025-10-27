import {
  ApplicationScope,
  ApplicationScopeConfig as ApplicationScopeOptions,
  StageScopeOptions,
  NestedScopeOptions,
  TestScopeOptions,
  Scope
} from "./application-scope";
import { StageScope } from "./stage-scope";
import { NestedScope } from "./nested-scope";
import { ResourceScope, ResourceScopeOptions } from "./resource-scope";

/**
 * Scope factory functions for creating different types of scopes
 */
export class ScopeFactory {

  /**
   * Create an application scope (root container)
   * Usage: await alchemy("my-app")
   */
  static createApplication(options: ApplicationScopeOptions): ApplicationScope {
    return new ApplicationScope(options);
  }

  /**
   * Create a stage scope (environment isolation)
   * Usage: await alchemy("my-app", { stage: "prod" })
   */
  static createStage(parent: ApplicationScope, options: StageScopeOptions): StageScope {
    return new StageScope(options, parent);
  }

  /**
   * Create a nested scope (groups related resources)
   * Usage: await alchemy.run("backend", ...)
   */
  static createNested(parent: Scope, options: NestedScopeOptions): NestedScope {
    return new NestedScope(options, parent);
  }

  /**
   * Create a test scope (automatic cleanup)
   * Usage: alchemy.test(import.meta, ...)
   */
  static createTest(parent: Scope, options: TestScopeOptions): TestScope {
    return new TestScope(parent, options);
  }

  /**
   * Create a resource scope (implicit child resource encapsulation)
   * Created automatically for each resource
   */
  static createResource(parent: Scope, options: ResourceScopeOptions): ResourceScope {
    return new ResourceScope(parent, options);
  }

  /**
   * Create a scope hierarchy from a scope path
   * Path format: "app-name/stage/nested-scope"
   */
  static createFromPath(path: string, options: {
    baseOptions?: Partial<ApplicationScopeOptions>;
    stageOptions?: Partial<StageScopeOptions>;
    nestedOptions?: Partial<NestedScopeOptions>;
  } = {}): Scope {
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) {
      throw new Error("Scope path cannot be empty");
    }

    // Create application scope
    const appOptions: ApplicationScopeOptions = {
      name: parts[0],
      ...options.baseOptions,
    };
    const appScope = this.createApplication(appOptions);

    let currentScope: Scope = appScope;

    // Add stage if specified
    if (parts.length >= 2) {
      const stageOptions: StageScopeOptions = {
        stage: parts[1],
        ...options.stageOptions,
      };
      currentScope = this.createStage(appScope, stageOptions);
    }

    // Add nested scopes if specified
    for (let i = 2; i < parts.length; i++) {
      const nestedOptions: NestedScopeOptions = {
        name: parts[i],
        ...options.nestedOptions,
      };
      currentScope = this.createNested(currentScope, nestedOptions);
    }

    return currentScope;
  }
}
