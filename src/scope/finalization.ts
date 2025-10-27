import { StateManager } from "./state-manager";

/**
 * Destruction strategy types
 */
export type DestructionStrategy = 'sequential' | 'parallel' | 'batched';

/**
 * Destruction result for a single resource
 */
export interface DestructionResult {
  /** Resource identifier */
  resourceId: string;
  /** Whether destruction succeeded */
  success: boolean;
  /** Error if destruction failed */
  error?: Error;
  /** Duration of destruction attempt */
  duration: number;
  /** Number of retry attempts made */
  attempts: number;
}

/**
 * Finalization options
 */
export interface FinalizationOptions {
  /** Destruction strategy to use */
  strategy?: DestructionStrategy;
  /** Maximum retry attempts for failed destructions */
  maxRetries?: number;
  /** Base delay between retries in milliseconds */
  retryDelay?: number;
  /** Maximum delay between retries in milliseconds */
  maxRetryDelay?: number;
  /** Whether to run in dry-run mode */
  dryRun?: boolean;
  /** Timeout for individual resource destruction */
  timeout?: number;
  /** Batch size for batched strategy */
  batchSize?: number;
  /** Whether to continue on errors */
  continueOnError?: boolean;
}

/**
 * Finalization report
 */
export interface FinalizationReport {
  /** Scope path that was finalized */
  scopePath: string;
  /** Total resources found */
  totalResources: number;
  /** Resources successfully destroyed */
  destroyed: string[];
  /** Resources that failed to destroy */
  failed: Array<{
    resourceId: string;
    error: string;
    attempts: number;
  }>;
  /** Resources that were orphaned (found in state but not in scope) */
  orphaned: string[];
  /** Duration of finalization process */
  duration: number;
  /** Whether finalization completed successfully */
  success: boolean;
  /** Strategy used */
  strategy: DestructionStrategy;
}

/**
 * Resource destruction context
 */
export interface DestructionContext {
  /** Resource identifier */
  resourceId: string;
  /** Resource type */
  resourceType: string;
  /** Resource properties */
  properties: Record<string, any>;
  /** Scope path */
  scopePath: string;
  /** Whether this is a dry run */
  dryRun: boolean;
}

/**
 * Resource destroyer interface
 */
export interface ResourceDestroyer {
  /**
   * Check if this destroyer can handle the given resource type
   */
  canDestroy(resourceType: string): boolean;

  /**
   * Destroy a single resource
   */
  destroy(context: DestructionContext): Promise<DestructionResult>;
}

/**
 * Base resource destroyer with retry logic
 */
export abstract class BaseResourceDestroyer implements ResourceDestroyer {
  protected readonly maxRetries: number;
  protected readonly retryDelay: number;
  protected readonly maxRetryDelay: number;
  protected readonly timeout: number;

  constructor(options: {
    maxRetries?: number;
    retryDelay?: number;
    maxRetryDelay?: number;
    timeout?: number;
  } = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.maxRetryDelay = options.maxRetryDelay ?? 30000;
    this.timeout = options.timeout ?? 60000;
  }

  abstract canDestroy(resourceType: string): boolean;
  abstract destroyResource(context: DestructionContext): Promise<void>;

  async destroy(context: DestructionContext): Promise<DestructionResult> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        if (!context.dryRun) {
          await this.withTimeout(
            this.destroyResource(context),
            this.timeout
          );
        }

        return {
          resourceId: context.resourceId,
          success: true,
          duration: Date.now() - startTime,
          attempts,
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(
            this.retryDelay * Math.pow(2, attempt) + Math.random() * 1000,
            this.maxRetryDelay
          );

          console.warn(
            `Destruction attempt ${attempt + 1} failed for ${context.resourceId}, retrying in ${delay}ms:`,
            error
          );

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      resourceId: context.resourceId,
      success: false,
      error: lastError,
      duration: Date.now() - startTime,
      attempts,
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }
}

/**
 * Sequential destruction strategy - destroys resources one by one
 */
export class SequentialDestructionStrategy {
  private readonly destroyer: ResourceDestroyer;

  constructor(destroyer: ResourceDestroyer) {
    this.destroyer = destroyer;
  }

  async execute(
    resources: DestructionContext[],
    options: FinalizationOptions
  ): Promise<DestructionResult[]> {
    const results: DestructionResult[] = [];

    for (const resource of resources) {
      if (!options.continueOnError && results.some(r => !r.success)) {
        // Stop on first failure if continueOnError is false
        break;
      }

      const result = await this.destroyer.destroy(resource);
      results.push(result);

      // Log progress
      if (result.success) {
        console.log(`✓ Destroyed ${resource.resourceId}`);
      } else {
        console.error(`✗ Failed to destroy ${resource.resourceId}:`, result.error?.message);
      }
    }

    return results;
  }
}

/**
 * Parallel destruction strategy - destroys resources concurrently
 */
export class ParallelDestructionStrategy {
  private readonly destroyer: ResourceDestroyer;
  private readonly concurrency: number;

  constructor(destroyer: ResourceDestroyer, concurrency: number = 5) {
    this.destroyer = destroyer;
    this.concurrency = concurrency;
  }

  async execute(
    resources: DestructionContext[],
    options: FinalizationOptions
  ): Promise<DestructionResult[]> {
    const results: DestructionResult[] = [];

    // Process resources in batches
    for (let i = 0; i < resources.length; i += this.concurrency) {
      const batch = resources.slice(i, i + this.concurrency);

      const batchPromises = batch.map(resource => this.destroyer.destroy(resource));
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);

      // Log batch progress
      const successCount = batchResults.filter(r => r.success).length;
      const failCount = batchResults.length - successCount;
      console.log(`Processed batch: ${successCount} successful, ${failCount} failed`);
    }

    return results;
  }
}

/**
 * Batched destruction strategy - processes resources in configurable batches
 */
export class BatchedDestructionStrategy {
  private readonly destroyer: ResourceDestroyer;
  private readonly batchSize: number;

  constructor(destroyer: ResourceDestroyer, batchSize: number = 10) {
    this.destroyer = destroyer;
    this.batchSize = batchSize;
  }

  async execute(
    resources: DestructionContext[],
    options: FinalizationOptions
  ): Promise<DestructionResult[]> {
    const results: DestructionResult[] = [];
    const batchSize = options.batchSize ?? this.batchSize;

    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} resources)...`);

      // Process batch sequentially for stability
      const sequentialStrategy = new SequentialDestructionStrategy(this.destroyer);
      const batchResults = await sequentialStrategy.execute(batch, options);

      results.push(...batchResults);

      // Small delay between batches to prevent overwhelming APIs
      if (i + batchSize < resources.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

/**
 * Scope finalizer - manages the finalization process for a scope
 */
export class ScopeFinalizer {
  private readonly stateManager: StateManager;
  private readonly destroyer: ResourceDestroyer;
  private readonly defaultOptions: FinalizationOptions;

  constructor(
    stateManager: StateManager,
    destroyer: ResourceDestroyer,
    defaultOptions: Partial<FinalizationOptions> = {}
  ) {
    this.stateManager = stateManager;
    this.destroyer = destroyer;
    this.defaultOptions = {
      strategy: 'sequential',
      maxRetries: 3,
      retryDelay: 1000,
      maxRetryDelay: 30000,
      dryRun: false,
      timeout: 60000,
      batchSize: 10,
      continueOnError: true,
      ...defaultOptions,
    };
  }

  /**
   * Finalize a scope by destroying orphaned resources
   */
  async finalize(
    scopePath: string,
    currentResourceIds: Set<string>,
    options: Partial<FinalizationOptions> = {}
  ): Promise<FinalizationReport> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };

    console.log(`🔍 Analyzing scope ${scopePath} for orphaned resources...`);

    // Get resources currently in state
    const stateResources = await this.stateManager.getResources(scopePath);
    const stateResourceIds = new Set(Object.keys(stateResources));

    // Find orphaned resources (in state but not in current scope)
    const orphanedIds = Array.from(stateResourceIds).filter(
      id => !currentResourceIds.has(id)
    );

    if (orphanedIds.length === 0) {
      console.log(`✅ No orphaned resources found in scope ${scopePath}`);
      return {
        scopePath,
        totalResources: stateResourceIds.size,
        destroyed: [],
        failed: [],
        orphaned: [],
        duration: Date.now() - startTime,
        success: true,
        strategy: finalOptions.strategy!,
      };
    }

    console.log(`🗑️ Found ${orphanedIds.length} orphaned resources in scope ${scopePath}`);

    if (finalOptions.dryRun) {
      console.log(`🔍 Dry run mode - would destroy: ${orphanedIds.join(', ')}`);
      return {
        scopePath,
        totalResources: stateResourceIds.size,
        destroyed: [],
        failed: [],
        orphaned: orphanedIds,
        duration: Date.now() - startTime,
        success: true,
        strategy: finalOptions.strategy!,
      };
    }

    // Prepare destruction contexts
    const destructionContexts: DestructionContext[] = orphanedIds.map(id => {
      const resource = stateResources[id];
      return {
        resourceId: id,
        resourceType: resource.type,
        properties: resource.metadata || {},
        scopePath,
        dryRun: finalOptions.dryRun!,
      };
    });

    // Execute destruction based on strategy
    let strategy: SequentialDestructionStrategy | ParallelDestructionStrategy | BatchedDestructionStrategy;

    switch (finalOptions.strategy) {
      case 'parallel':
        strategy = new ParallelDestructionStrategy(this.destroyer);
        break;
      case 'batched':
        strategy = new BatchedDestructionStrategy(this.destroyer);
        break;
      case 'sequential':
      default:
        strategy = new SequentialDestructionStrategy(this.destroyer);
        break;
    }

    console.log(`🚀 Starting destruction using ${finalOptions.strategy} strategy...`);
    const results = await strategy.execute(destructionContexts, finalOptions);

    // Process results
    const destroyed: string[] = [];
    const failed: Array<{ resourceId: string; error: string; attempts: number }> = [];

    for (const result of results) {
      if (result.success) {
        destroyed.push(result.resourceId);
        // Remove from state
        await this.stateManager.removeResource(scopePath, result.resourceId);
      } else {
        failed.push({
          resourceId: result.resourceId,
          error: result.error?.message || 'Unknown error',
          attempts: result.attempts,
        });
      }
    }

    const success = failed.length === 0;
    const duration = Date.now() - startTime;

    console.log(`📊 Finalization complete for ${scopePath}:`);
    console.log(`   - Total resources: ${stateResourceIds.size}`);
    console.log(`   - Orphaned: ${orphanedIds.length}`);
    console.log(`   - Destroyed: ${destroyed.length}`);
    console.log(`   - Failed: ${failed.length}`);
    console.log(`   - Duration: ${duration}ms`);

    if (!success) {
      console.error('❌ Finalization completed with errors:');
      failed.forEach(f => console.error(`   - ${f.resourceId}: ${f.error}`));
    } else {
      console.log('✅ Finalization completed successfully');
    }

    return {
      scopePath,
      totalResources: stateResourceIds.size,
      destroyed,
      failed,
      orphaned: orphanedIds,
      duration,
      success,
      strategy: finalOptions.strategy!,
    };
  }

  /**
   * Force cleanup of a scope (removes all resources regardless of current state)
   */
  async forceCleanup(scopePath: string, options: Partial<FinalizationOptions> = {}): Promise<FinalizationReport> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };

    console.log(`🧹 Force cleaning up scope ${scopePath}...`);

    // Get all resources in state
    const stateResources = await this.stateManager.getResources(scopePath);
    const resourceIds = Object.keys(stateResources);

    if (resourceIds.length === 0) {
      console.log(`✅ No resources found in scope ${scopePath}`);
      return {
        scopePath,
        totalResources: 0,
        destroyed: [],
        failed: [],
        orphaned: [],
        duration: Date.now() - startTime,
        success: true,
        strategy: finalOptions.strategy!,
      };
    }

    // Prepare destruction contexts
    const destructionContexts: DestructionContext[] = resourceIds.map(id => {
      const resource = stateResources[id];
      return {
        resourceId: id,
        resourceType: resource.type,
        properties: resource.metadata || {},
        scopePath,
        dryRun: finalOptions.dryRun!,
      };
    });

    // Use parallel strategy for force cleanup (faster)
    const strategy = new ParallelDestructionStrategy(this.destroyer, 10);
    const results = await strategy.execute(destructionContexts, finalOptions);

    // Process results and clean up state
    const destroyed: string[] = [];
    const failed: Array<{ resourceId: string; error: string; attempts: number }> = [];

    for (const result of results) {
      if (result.success) {
        destroyed.push(result.resourceId);
      } else {
        failed.push({
          resourceId: result.resourceId,
          error: result.error?.message || 'Unknown error',
          attempts: result.attempts,
        });
      }

      // Always remove from state, even if destruction failed
      await this.stateManager.removeResource(scopePath, result.resourceId);
    }

    const duration = Date.now() - startTime;

    console.log(`🧹 Force cleanup complete for ${scopePath}:`);
    console.log(`   - Processed: ${resourceIds.length}`);
    console.log(`   - Removed from state: ${resourceIds.length}`);
    console.log(`   - Duration: ${duration}ms`);

    return {
      scopePath,
      totalResources: resourceIds.length,
      destroyed,
      failed,
      orphaned: resourceIds, // All were orphaned in force cleanup
      duration,
      success: true, // Force cleanup always succeeds (state is cleaned)
      strategy: 'parallel',
    };
  }
}
