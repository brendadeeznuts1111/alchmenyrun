import { JobQueue } from '../src/index';

// One line → queue + processor + DLQ + REST producer deployed
export const emailQueue = JobQueue({
  name: 'emails',
  batchSize: 20,
  maxRetries: 5,
  deadLetterQueue: true,
});

// Usage from anywhere (CLI, Worker, frontend):
// curl -X POST https://emails-producer.your-subdomain.workers.dev \
//   -H "Content-Type: application/json" \
//   -d '{"type":"email","payload":{"to":"user@ex.com","subject":"Hi"}}'
