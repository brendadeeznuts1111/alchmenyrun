import { StateManager } from "./state-manager";

/**
 * Stage scope configuration
 */
export interface StageScopeConfig {
  /**
   * Application name
   */
  appName: string;

  /**
   * Stage name (e.g., "prod", "dev", "pr-123")
   */
  stageName: string;

  /**
   * Profile for security isolation
   */
  profile?: string;

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
 * Stage scope snapshot for inspection
 */
export interface StageSnapshot {
  appName: string;
  stageName: string;
  profile: string;
  scopePath: string;
  totalResources: number;
  nestedScopes: string[];
  stateSize: number;
  createdAt: number;
  lastUpdated: number;
  isLocked: boolean;
}

/**
 * Stage scope - environment-specific isolation (dev, prod, pr-XXX)
 */
export class StageScope {
  public readonly appName: string;
  public readonly stageName: string;
  public readonly profile: string;
  public readonly scopePath: string;

  private readonly stateManager: StateManager;
  private initialized = false;

  /**
   * Initialize the stage scope
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure state directory exists
    let state = await this.stateManager.loadState(this.scopePath);
    if (!state) {
      state = this.stateManager.createInitialState(this.scopePath);
      await this.stateManager.saveState(this.scopePath, state);
    }

    this.initialized = true;
  }

  constructor(config: StageScopeConfig) {
    this.appName = config.appName;
    this.stageName = config.stageName;
    this.profile = config.profile || "default";
    this.scopePath = `${this.appName}/${this.stageName}`;

    this.stateManager = new StateManager({
      baseDir: config.stateDir,
      enableLocking: config.enableLocking ?? true
    });
  }

  /**
   * Initialize the stage scope
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure state directory exists
    let state = await this.stateManager.loadState(this.scopePath);
    if (!state) {
      state = this.stateManager.createInitialState(this.scopePath);
      await this.stateManager.saveState(this.scopePath, state);
    }

    this.initialized = true;
  }

  /**
   * Get a snapshot of the current stage state
   */
  async getSnapshot(): Promise<StageSnapshot> {
    await this.initialize();

    const state = await this.stateManager.loadState(this.scopePath);
    const resources = await this.stateManager.getResources(this.scopePath);
    const nestedScopes = await this.stateManager.getNestedScopes(this.scopePath);
    const isLocked = await this.stateManager.isLocked(this.scopePath);

    return {
      appName: this.appName,
      stageName: this.stageName,
      profile: this.profile,
      scopePath: this.scopePath,
      totalResources: Object.keys(resources).length,
      nestedScopes,
      stateSize: state ? JSON.stringify(state).length : 0,
      createdAt: state?.createdAt || 0,
      lastUpdated: state?.updatedAt || 0,
      isLocked
    };
  }

  /**
   * Check if this stage can be accessed with the given profile
   */
  canAccessWithProfile(requestedProfile: string): boolean {
    // Profile isolation logic:
    // - "ci" profile can only access pr-* stages
    // - "prod" profile can only access prod stage
    // - "default" profile can access user stages ($USER)
    // - Other profiles have full access (for custom setups)

    if (requestedProfile === "ci") {
      return this.stageName.startsWith("pr-");
    }

    if (requestedProfile === "prod") {
      return this.stageName === "prod";
    }

    if (requestedProfile === "default") {
      return this.stageName === process.env.USER || this.stageName === "default";
    }

    // Custom profiles have full access
    return true;
  }

  /**
   * Get all resources in this stage
   */
  async getResources(): Promise<Record<string, any>> {
    await this.initialize();
    return await this.stateManager.getResources(this.scopePath);
  }

  /**
   * Add a resource to this stage
   */
  async addResource(resourceId: string, resource: any): Promise<void> {
    await this.initialize();
    await this.stateManager.addResource(this.scopePath, resourceId, resource);
  }

  /**
   * Remove a resource from this stage
   */
  async removeResource(resourceId: string): Promise<void> {
    await this.initialize();
    await this.stateManager.removeResource(this.scopePath, resourceId);
  }

  /**
   * Get all nested scopes in this stage
   */
  async getNestedScopes(): Promise<string[]> {
    await this.initialize();
    return await this.stateManager.getNestedScopes(this.scopePath);
  }

  /**
   * Add a resource to this stage
   */
  async addResource(resourceId: string, resource: any): Promise<void> {
    await this.initialize();
    await this.stateManager.addResource(this.scopePath, resourceId, resource);
  }

  /**
   * Remove a resource from this stage
   */
  async removeResource(resourceId: string): Promise<void> {
    await this.initialize();
    await this.stateManager.removeResource(this.scopePath, resourceId);
  }

  /**
   * Register a nested scope
   */
  async registerNestedScope(scopeName: string): Promise<void> {
    await this.initialize();
    await this.stateManager.addNestedScope(this.scopePath, scopeName);
  }

  /**
   * Unregister a nested scope
   */
  async unregisterNestedScope(scopeName: string): Promise<void> {
    await this.initialize();
    await this.stateManager.removeNestedScope(this.scopePath, scopeName);
  }

  /**
   * Check if stage is currently locked
   */
  async isLocked(): Promise<boolean> {
    return await this.stateManager.isLocked(this.scopePath);
  }

  /**
   * Get stage metadata
   */
  async getMetadata(): Promise<{
    environment: 'development' | 'production' | 'preview' | 'unknown';
    isEphemeral: boolean;
    estimatedCost: 'low' | 'medium' | 'high';
    lastActivity: number;
  }> {
    await this.initialize();

    const state = await this.stateManager.loadState(this.scopePath);
    const resources = await this.getResources();

    // Determine environment type
    let environment: 'development' | 'production' | 'preview' | 'unknown' = 'unknown';
    if (this.stageName === 'prod') {
      environment = 'production';
    } else if (this.stageName.startsWith('pr-')) {
      environment = 'preview';
    } else if (this.stageName === process.env.USER || this.stageName === 'default') {
      environment = 'development';
    }

    // Check if ephemeral (PR previews, etc.)
    const isEphemeral = this.stageName.startsWith('pr-') || this.stageName.includes('temp');

    // Estimate cost based on resources
    let estimatedCost: 'low' | 'medium' | 'high' = 'low';
    const resourceCount = Object.keys(resources).length;
    if (resourceCount > 10) {
      estimatedCost = 'high';
    } else if (resourceCount > 3) {
      estimatedCost = 'medium';
    }

    return {
      environment,
      isEphemeral,
      estimatedCost,
      lastActivity: state?.updatedAt || 0
    };
  }

  /**
   * List all stages for an application
   */
  static async listStages(appName: string, stateDir?: string): Promise<string[]> {
    const stateManager = new StateManager({ baseDir: stateDir });

    // This is a simplified implementation - in reality, we'd need to
    // scan the state directory structure to find all stages
    // For now, return common stage names
    const commonStages = ['prod', process.env.USER || 'default'];

    // Try to find PR stages by scanning state files
    const stages: string[] = [...commonStages];

    // In a full implementation, this would scan the .alchemy/appName/ directory
    // and return all subdirectories that contain state.json files

    return stages.filter(stage => stage.length > 0);
  }

  /**
   * Find orphaned resources in this stage
   */
  async findOrphanedResources(): Promise<string[]> {
    await this.initialize();

    const resources = await this.getResources();
    const orphaned: string[] = [];

    // In a real implementation, this would:
    // 1. Compare current alchemy.run.ts with state file
    // 2. Identify resources that exist in state but not in code
    // 3. Return list of orphaned resource IDs

    // For now, return empty array as placeholder
    return orphaned;
  }
}
