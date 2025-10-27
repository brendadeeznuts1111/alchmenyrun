import { Resource, secret, Secret, Context } from 'alchemy';
import { Queue, Worker } from "alchemy/cloudflare";

/* -------------- PUBLIC TYPES -------------- */
export interface JobQueueProps {
  name?: string;
  batchSize?: number;
  maxRetries?: number;
  maxConcurrency?: number;
  deadLetterQueue?: boolean;
  delete?: boolean; // data-resource opt-out
}

/* -------------- OUTPUT TYPE -------------- */
export type JobQueue = Omit<JobQueueProps, 'delete'> & {
  id: string;
  name: string;
  queue: Awaited<ReturnType<typeof Queue>>;
  processor: Awaited<ReturnType<typeof Worker>>;
  producer: Awaited<ReturnType<typeof Worker>>;
  deadLetterQueue?: Awaited<ReturnType<typeof Queue>>;
  createdAt: number;
  type: 'job-queue';
};

/* -------------- TYPE GUARD -------------- */
export function isJobQueue(res: any): res is JobQueue {
  return res?.type === 'job-queue';
}

/* -------------- RESOURCE FACTORY -------------- */
export function JobQueue(id: string, props: JobQueueProps = {}): Promise<JobQueue> {
  // Normalize: allow string or Resource for every queue field (future-proof)
  return _JobQueue(id, {
    ...props,
    name: props.name ?? undefined,
  });
}

/* -------------- INTERNAL IMPLEMENTATION -------------- */
const _JobQueue = Resource(
  'alch::job-queue',
  async function (this: Context<JobQueue>, id: string, props: JobQueueProps): Promise<JobQueue> {
    const {
      batchSize = 10,
      maxRetries = 3,
      maxConcurrency = 50,
      deadLetterQueue = true,
      delete: shouldDelete = true,
    } = props;

    /* ---------- IMMUTABLE NAME HANDLING ---------- */
    const name = props.name
      ?? this.output?.name
      ?? this.scope.createPhysicalName(id);

    if (this.phase === 'update' && this.output.name !== name) {
      return this.replace(); // queue name is immutable
    }

    /* ---------- CONDITIONAL DELETE ---------- */
    if (this.phase === 'delete') {
      if (shouldDelete === false && this.output?.id) {
        // user opted out: skip cloud call, just destroy state
        return this.destroy();
      }
      // Normal deletion path - destroy will handle cleanup
      return this.destroy();
    }

    /* ---------- DLQ ---------- */
    const dlq = deadLetterQueue
      ? await Queue(`${name}-dlq`, { name: `${name}-dlq` })
      : undefined;

    /* ---------- MAIN QUEUE ---------- */
    const queue = await Queue(`${name}-queue`, {
      name,
    });

    /* ---------- PROCESSOR WORKER ---------- */
    const processor = await Worker(`${name}-processor`, {
      name: `${name}-processor`,
      entrypoint: './src/queue-handler.ts',
      bindings: { 
        QUEUE: queue,
        ...(dlq && { DLQ: dlq }),
      },
      env: {
        QUEUE: queue.id,
        DLQ: dlq?.id ?? '',
        MAX_CONCURRENCY: maxConcurrency.toString(),
      },
    });

    /* ---------- PRODUCER WORKER ---------- */
    const producer = await Worker(`${name}-producer`, {
      name: `${name}-producer`,
      entrypoint: './src/queue-producer.ts',
      bindings: { 
        QUEUE: queue,
      },
      env: { QUEUE: queue.id },
    });

    return {
      id: queue.id,
      name,
      queue,
      processor,
      producer,
      deadLetterQueue: dlq,
      createdAt: Date.now(),
      type: 'job-queue',
    };
  }
);

/* -------------- INTERNAL API TYPES -------------- */
/**
 * Raw Cloudflare Queue API response
 * @internal
 */
interface QueueApiResponse {
  id: string;
  name: string;
  created_at: string;
}
