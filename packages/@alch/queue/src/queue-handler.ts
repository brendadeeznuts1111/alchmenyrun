export const handler: QueueHandler<QueueMessage> = {
  async batch(messages, env, ctx) {
    const concurrency = parseInt(env.MAX_CONCURRENCY || '50');
    const promises = messages.map((msg) =>
      ctx.waitUntil(limitConcurrency(handle(msg, env), concurrency))
    );
    await Promise.all(promises);
  },
};

async function handle(msg: QueueMessage, env: Record<string, string>) {
  const start = Date.now();
  let status: 'ok' | 'fail' = 'ok';
  try {
    switch (msg.type) {
      case 'email':
        await sendEmail(msg.payload as any);
        break;
      default:
        throw new Error(`Unknown type: ${msg.type}`);
    }
  } catch (err) {
    status = 'fail';
    throw err; // CF will retry / DLQ
  } finally {
    // TODO: Add metrics when alchemy/observability is available
    console.log(`Queue processed: ${msg.type}, status: ${status}, duration: ${Date.now() - start}ms`);
  }
}

/* ---------- concurrency throttle ---------- */
let inFlight = 0;
async function limitConcurrency<T>(promise: Promise<T>, max: number): Promise<T> {
  while (inFlight >= max) await new Promise((r) => setTimeout(r, 50));
  inFlight++;
  try { return await promise; } finally { inFlight--; }
}

/* ---------- stubs ---------- */
async function sendEmail(p: { to: string; subject: string; body: string }) { /* user land */ }

/* ---------- types ---------- */
export interface QueueMessage {
  type: string;
  payload: any;
}

export interface QueueHandler<T> {
  batch(messages: T[], env: Record<string, string>, ctx: ExecutionContext): Promise<void>;
}
