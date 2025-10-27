import {
  BaseResourceDestroyer,
  ResourceDestroyer,
  DestructionContext,
  DestructionResult
} from "./finalization";

/**
 * Generic resource destroyer that handles common resource types
 */
export class GenericResourceDestroyer extends BaseResourceDestroyer {
  private readonly destroyHandlers: Map<string, (context: DestructionContext) => Promise<void>>;

  constructor(options: {
    maxRetries?: number;
    retryDelay?: number;
    maxRetryDelay?: number;
    timeout?: number;
  } = {}) {
    super(options);
    this.destroyHandlers = new Map();

    // Register built-in handlers
    this.registerHandler('worker', this.destroyWorker.bind(this));
    this.registerHandler('database', this.destroyDatabase.bind(this));
    this.registerHandler('bucket', this.destroyBucket.bind(this));
    this.registerHandler('queue', this.destroyQueue.bind(this));
    this.registerHandler('kv', this.destroyKV.bind(this));
    this.registerHandler('durable-object', this.destroyDurableObject.bind(this));
  }

  canDestroy(resourceType: string): boolean {
    return this.destroyHandlers.has(resourceType);
  }

  /**
   * Register a custom destruction handler for a resource type
   */
  registerHandler(resourceType: string, handler: (context: DestructionContext) => Promise<void>): void {
    this.destroyHandlers.set(resourceType, handler);
  }

  async destroyResource(context: DestructionContext): Promise<void> {
    const handler = this.destroyHandlers.get(context.resourceType);
    if (!handler) {
      throw new Error(`No destruction handler registered for resource type: ${context.resourceType}`);
    }

    await handler(context);
  }

  /**
   * Destroy a Cloudflare Worker
   */
  private async destroyWorker(context: DestructionContext): Promise<void> {
    // This would integrate with Cloudflare API to delete the worker
    // For now, just log what would be done
    console.log(`Destroying worker: ${context.resourceId}`);

    // TODO: Implement actual Cloudflare Worker deletion
    // const cfApi = new CloudflareAPI();
    // await cfApi.deleteWorker(context.properties.zoneId, context.resourceId);
  }

  /**
   * Destroy a Cloudflare D1 Database
   */
  private async destroyDatabase(context: DestructionContext): Promise<void> {
    console.log(`Destroying database: ${context.resourceId}`);

    // TODO: Implement actual D1 database deletion
    // const cfApi = new CloudflareAPI();
    // await cfApi.deleteDatabase(context.resourceId);
  }

  /**
   * Destroy a Cloudflare R2 Bucket
   */
  private async destroyBucket(context: DestructionContext): Promise<void> {
    console.log(`Destroying bucket: ${context.resourceId}`);

    // TODO: Implement actual R2 bucket deletion
    // const cfApi = new CloudflareAPI();
    // await cfApi.deleteBucket(context.resourceId);
  }

  /**
   * Destroy a Cloudflare Queue
   */
  private async destroyQueue(context: DestructionContext): Promise<void> {
    console.log(`Destroying queue: ${context.resourceId}`);

    // TODO: Implement actual Queue deletion
    // const cfApi = new CloudflareAPI();
    // await cfApi.deleteQueue(context.resourceId);
  }

  /**
   * Destroy a Cloudflare KV Namespace
   */
  private async destroyKV(context: DestructionContext): Promise<void> {
    console.log(`Destroying KV namespace: ${context.resourceId}`);

    // TODO: Implement actual KV namespace deletion
    // const cfApi = new CloudflareAPI();
    // await cfApi.deleteKVNamespace(context.resourceId);
  }

  /**
   * Destroy a Durable Object namespace
   */
  private async destroyDurableObject(context: DestructionContext): Promise<void> {
    console.log(`Destroying durable object: ${context.resourceId}`);

    // TODO: Implement actual Durable Object deletion
    // Durable Objects are typically managed through Workers, so this might
    // involve deleting the associated Worker or namespace
  }
}

/**
 * Composite resource destroyer that tries multiple destroyers
 */
export class CompositeResourceDestroyer implements ResourceDestroyer {
  private readonly destroyers: ResourceDestroyer[];

  constructor(destroyers: ResourceDestroyer[]) {
    this.destroyers = destroyers;
  }

  canDestroy(resourceType: string): boolean {
    return this.destroyers.some(d => d.canDestroy(resourceType));
  }

  async destroy(context: DestructionContext): Promise<DestructionResult> {
    const destroyer = this.destroyers.find(d => d.canDestroy(context.resourceType));

    if (!destroyer) {
      return {
        resourceId: context.resourceId,
        success: false,
        error: new Error(`No destroyer found for resource type: ${context.resourceType}`),
        duration: 0,
        attempts: 0,
      };
    }

    return destroyer.destroy(context);
  }

  /**
   * Add a destroyer to the composite
   */
  addDestroyer(destroyer: ResourceDestroyer): void {
    this.destroyers.push(destroyer);
  }
}

/**
 * Mock resource destroyer for testing
 */
export class MockResourceDestroyer implements ResourceDestroyer {
  private readonly shouldFail: Set<string>;
  private readonly delay: number;

  constructor(options: {
    shouldFail?: string[];
    delay?: number;
  } = {}) {
    this.shouldFail = new Set(options.shouldFail || []);
    this.delay = options.delay || 100;
  }

  canDestroy(resourceType: string): boolean {
    return true; // Mock destroyer can handle any type
  }

  async destroy(context: DestructionContext): Promise<DestructionResult> {
    const startTime = Date.now();

    // Simulate destruction delay
    await new Promise(resolve => setTimeout(resolve, this.delay));

    const shouldFail = this.shouldFail.has(context.resourceId);

    return {
      resourceId: context.resourceId,
      success: !shouldFail,
      error: shouldFail ? new Error(`Mock destruction failure for ${context.resourceId}`) : undefined,
      duration: Date.now() - startTime,
      attempts: 1,
    };
  }
}
