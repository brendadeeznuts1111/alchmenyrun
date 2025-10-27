import { AsyncLocalStorage } from "node:async_hooks";
import { Scope, FinalizationReport } from "./interfaces";
import {
  ApplicationScope,
  ApplicationScopeConfig as ApplicationScopeOptions,
  StageScopeOptions,
  NestedScopeOptions,
  TestScopeOptions
} from "./application-scope";
import { ScopeFactory } from "./scope-factory";

/**
 * Global scope storage for managing current scope context
 */
const scopeStorage = new AsyncLocalStorage<Scope>();

/**
 * Main scope manager that provides the public API
 */
export class ScopeManager {
  private static instance: ScopeManager;
  private readonly rootScopes = new Map<string, ApplicationScope>();

  private constructor() {}

  static getInstance(): ScopeManager {
    if (!ScopeManager.instance) {
      ScopeManager.instance = new ScopeManager();
    }
    return ScopeManager.instance;
  }

  /**
   * Get the current scope from async context
   */
  static get current(): Scope | undefined {
    return scopeStorage.getStore();
  }

  /**
   * Create or get an application scope
   * Usage: await alchemy("my-app")
   */
  async application(name: string, options: Partial<ApplicationScopeOptions> = {}): Promise<ApplicationScope> {
    // Check if application scope already exists
    let appScope = this.rootScopes.get(name);
    if (appScope) {
      return appScope;
    }

    // Create new application scope
    const appOptions: ApplicationScopeOptions = {
      name,
      phase: options.phase || 'up',
      ...options,
    };

    appScope = ScopeFactory.createApplication(appOptions);
    this.rootScopes.set(name, appScope);

    return appScope;
  }

  /**
   * Create a stage scope within an application
   * Usage: await alchemy("my-app", { stage: "prod" })
   */
  async stage(appName: string, stageOptions: StageScopeOptions & Partial<ApplicationScopeOptions>): Promise<Scope> {
    const appScope = await this.application(appName, stageOptions);

    // Check if stage already exists
    const existingStage = appScope.getChild(stageOptions.stage);
    if (existingStage) {
      return existingStage;
    }

    // Create new stage scope
    return ScopeFactory.createStage(appScope, stageOptions);
  }

  /**
   * Run a function within a nested scope
   * Usage: await alchemy.run("backend", async () => { ... })
   */
  async run<T>(
    scopeName: string,
    fn: () => Promise<T>,
    options: Partial<NestedScopeOptions> = {}
  ): Promise<T> {
    const currentScope = ScopeManager.current;
    if (!currentScope) {
      throw new Error("No current scope context. Call alchemy() first.");
    }

    // Create nested scope
    const nestedOptions: NestedScopeOptions = {
      name: scopeName,
      ...options,
    };

    const nestedScope = ScopeFactory.createNested(currentScope, nestedOptions);

    // Run function within nested scope context
    return scopeStorage.run(nestedScope, async () => {
      try {
        return await fn();
      } finally {
        // Cleanup will be handled by finalization
      }
    });
  }

  /**
   * Create a test scope with automatic cleanup
   * Usage: alchemy.test(import.meta, { prefix: "branch-name" }, async (scope) => { ... })
   */
  async test<T>(
    meta: ImportMeta,
    options: {
      prefix?: string;
      autoCleanup?: boolean;
      timeout?: number;
    } = {},
    fn: (scope: Scope) => Promise<T>
  ): Promise<T> {
    const currentScope = ScopeManager.current;
    if (!currentScope) {
      throw new Error("No current scope context. Call alchemy() first.");
    }

    // Generate test ID from file path and options
    const testId = this.generateTestId(meta, options.prefix);

    // Create test scope
    const testOptions: TestScopeOptions = {
      testId,
      branchPrefix: options.prefix,
      autoCleanup: options.autoCleanup ?? true,
      timeout: options.timeout,
    };

    const testScope = ScopeFactory.createTest(currentScope, testOptions);

    // Run function within test scope context
    return scopeStorage.run(testScope, async () => {
      try {
        return await fn(testScope);
      } finally {
        // Automatic cleanup for tests
        if (testScope.autoCleanup) {
          await testScope.finalize();
        }
      }
    });
  }

  /**
   * Finalize all scopes and cleanup resources
   */
  async finalize(): Promise<FinalizationReport[]> {
    const reports: FinalizationReport[] = [];

    for (const appScope of this.rootScopes.values()) {
      try {
        const report = await appScope.finalize();
        reports.push(report);
      } catch (error) {
        // Create error report
        reports.push({
          scope: appScope,
          created: [],
          updated: [],
          destroyed: [],
          errors: [error as Error],
          duration: 0,
          success: false,
        });
      }
    }

    // Clear root scopes after finalization
    this.rootScopes.clear();

    return reports;
  }

  /**
   * Get all active scopes
   */
  getActiveScopes(): Scope[] {
    const scopes: Scope[] = [];
    for (const appScope of this.rootScopes.values()) {
      scopes.push(appScope);
      scopes.push(...appScope.getDescendants());
    }
    return scopes;
  }

  /**
   * Find a scope by path
   */
  findScopeByPath(path: string): Scope | undefined {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return undefined;

    const appScope = this.rootScopes.get(parts[0]);
    if (!appScope) return undefined;

    let currentScope: Scope = appScope;

    for (let i = 1; i < parts.length; i++) {
      const child = currentScope.getChild(parts[i]);
      if (!child) return undefined;
      currentScope = child;
    }

    return currentScope;
  }

  /**
   * Generate a unique test ID
   */
  private generateTestId(meta: ImportMeta, prefix?: string): string {
    const filePath = meta.url || 'unknown';
    const fileName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown';
    const timestamp = Date.now();

    let testId = `${fileName}-${timestamp}`;

    if (prefix) {
      testId = `${prefix}-${testId}`;
    }

    return testId;
  }
}

/**
 * Global scope manager instance
 */
export const scopeManager = ScopeManager.getInstance();

/**
 * Main alchemy function - creates application or stage scope
 * Usage:
 * - await alchemy("my-app") - creates application scope
 * - await alchemy("my-app", { stage: "prod" }) - creates stage scope
 */
export async function alchemy(
  appName: string,
  options: StageScopeOptions & Partial<ApplicationScopeOptions> = {}
): Promise<Scope> {
  if (options.stage) {
    // Create stage scope
    return scopeManager.stage(appName, options);
  } else {
    // Create application scope
    return scopeManager.application(appName, options);
  }
}

/**
 * Extend alchemy function with additional methods
 */
export interface AlchemyFunction extends typeof alchemy {
  run: typeof scopeManager.run;
  test: typeof scopeManager.test;
  finalize: typeof scopeManager.finalize;
  getActiveScopes: typeof scopeManager.getActiveScopes;
  findScopeByPath: typeof scopeManager.findScopeByPath;
}

// Add methods to alchemy function
(alchemy as AlchemyFunction).run = scopeManager.run.bind(scopeManager);
(alchemy as AlchemyFunction).test = scopeManager.test.bind(scopeManager);
(alchemy as AlchemyFunction).finalize = scopeManager.finalize.bind(scopeManager);
(alchemy as AlchemyFunction).getActiveScopes = scopeManager.getActiveScopes.bind(scopeManager);
(alchemy as AlchemyFunction).findScopeByPath = scopeManager.findScopeByPath.bind(scopeManager);

/**
 * Export the extended alchemy function
 */
export { alchemy as default };
