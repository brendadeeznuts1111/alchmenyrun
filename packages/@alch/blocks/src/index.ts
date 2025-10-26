/**
 * Reusable infrastructure building blocks for Alchemy
 * One-line resource creation with sensible defaults
 * 
 * @see {@link https://alchemy.run/docs | Alchemy Framework Documentation}
 * @see {@link https://developers.cloudflare.com/workers/ | Cloudflare Workers Documentation}
 * @see {@link https://developers.cloudflare.com/durable-objects/ | Durable Objects Documentation}
 */

import type {
  Worker as WorkerType,
  DurableObjectNamespace as DOType,
  Queue as QueueType,
} from "alchemy";

/**
 * Create a WebSocket chat room with Durable Object
 * 
 * @see {@link https://developers.cloudflare.com/durable-objects/ | Durable Objects Documentation}
 * @example
 * ```ts
 * const { worker, room } = ChatBlock("support");
 * ```
 */
export function ChatBlock(name: string, opts?: { className?: string }) {
  const className = opts?.className ?? `${name}Room`;

  // Note: These are type definitions, actual resources created by consumer
  return {
    config: {
      workerName: name,
      className,
      entrypoint: `./src/blocks/${name}/worker.ts`,
    },
    // Template for consumer to implement
    template: "chat",
  };
}

/**
 * Create a job queue for async processing
 * 
 * @see {@link https://developers.cloudflare.com/queues/ | Cloudflare Queues Documentation}
 * @example
 * ```ts
 * const emails = JobQueue("emails");
 * ```
 */
export function JobQueue(name: string) {
  return {
    config: {
      name: `${name}-queue`,
    },
    template: "queue",
  };
}

/**
 * Create a scheduled task (CRON job)
 * 
 * @see {@link https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers Documentation}
 * @example
 * ```ts
 * const cleanup = ScheduledTask("cleanup", "0 4 * * *", "src/cron/cleanup.ts");
 * ```
 */
export function ScheduledTask(
  name: string,
  cron: string,
  handlerEntry: string,
) {
  return {
    config: {
      name: `${name}-cron`,
      cron,
      entrypoint: handlerEntry,
    },
    template: "cron",
  };
}

/**
 * Create a KV cache with worker
 * 
 * @see {@link https://developers.cloudflare.com/kv/ | Workers KV Documentation}
 * @example
 * ```ts
 * const { kv, worker } = CacheBlock("api-cache");
 * ```
 */
export function CacheBlock(name: string) {
  return {
    config: {
      kvName: `${name}-cache`,
      workerName: `${name}-cache-worker`,
      entrypoint: `./src/blocks/${name}/cache-worker.ts`,
    },
    template: "cache",
  };
}

// Export types for consumers
export type ChatBlockConfig = ReturnType<typeof ChatBlock>;
export type JobQueueConfig = ReturnType<typeof JobQueue>;
export type ScheduledTaskConfig = ReturnType<typeof ScheduledTask>;
export type CacheBlockConfig = ReturnType<typeof CacheBlock>;
