import { Queue, Worker } from "alchemy/cloudflare";

/* ---------- JOB-QUEUE RESOURCE ---------- */
export interface JobQueueProps {
  name: string;
  batchSize?: number;           // CF native
  maxRetries?: number;          // CF native
  maxConcurrency?: number;      // our throttle
  deadLetterQueue?: boolean;
}

export interface JobQueue {
  queue: Awaited<ReturnType<typeof Queue>>;
  processor: Awaited<ReturnType<typeof Worker>>;
  deadLetterQueue?: Awaited<ReturnType<typeof Queue>>;
  producer: Awaited<ReturnType<typeof Worker>>;
}

export async function JobQueue(
  props: JobQueueProps
): Promise<JobQueue> {
  const { name, batchSize = 10, maxRetries = 3, maxConcurrency = 50, deadLetterQueue = true } = props;

  const dlq = deadLetterQueue
    ? await Queue(`${name}-dlq`, { name: `${name}-dlq` })
    : undefined;

  const queue = await Queue(`${name}-queue`, {
    name,
  });

  const processor = await Worker(`${name}-processor`, {
    name: `${name}-processor`,
    entrypoint: './src/queue-handler.ts',
    bindings: { 
      QUEUE: queue,
      ...(dlq && { DLQ: dlq }),
    },
    env: {
      MAX_CONCURRENCY: maxConcurrency.toString(),
    },
  });

  const producer = await Worker(`${name}-producer`, {
    name: `${name}-producer`,
    entrypoint: './src/queue-producer.ts',
    bindings: { 
      QUEUE: queue,
    },
  });

  return { queue, processor, deadLetterQueue: dlq, producer };
}
