# Workflow Orchestration

Long-running, multi-step background jobs powered by Cloudflare Workflows.

## Overview

The demo implements a **Durable Workflow** pattern using Cloudflare's Workflow API. Workflows are long-running processes that can span minutes, hours, or days with automatic retries, state persistence, and step-by-step execution.

## API

### Start a Workflow

```http
POST /api/workflow/start
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response**
```json
{
  "workflowId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Check Workflow Status

```bash
# Get workflow status (future feature)
curl https://your-worker.workers.dev/api/workflow/status/[workflowId]
```

## Built-in Workflows

### Onboarding Workflow

The demo includes a user onboarding workflow with the following steps:

| Step | Description | Duration |
|------|-------------|----------|
| 1. Validate | Validate user email and name | Instant |
| 2. Create Profile | Create user profile with UUID | Instant |
| 3. Send Email | Queue welcome email job | Instant |
| 4. Initialize Settings | Set up default user settings | Instant |

**Example:**
```bash
curl -X POST https://cloudflare-demo-website-prod.utahj4754.workers.dev/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

## How It Works

1. **Trigger**: HTTP POST to `/api/workflow/start` creates a new workflow instance
2. **Execution**: Workflow runs each step sequentially with automatic state persistence
3. **Retries**: Failed steps are automatically retried with exponential backoff
4. **Completion**: Workflow completes when all steps succeed

## Implementation

See `src/backend/workflow.ts` for the full `OnboardingWorkflow` implementation.

### Workflow Structure

```typescript
export default class OnboardingWorkflow {
  async run(event: WorkflowEvent, step: WorkflowStep): Promise<void> {
    // Step 1: Validate
    await step.do("validate-user", async () => {
      // Validation logic
    });

    // Step 2: Create profile
    const profile = await step.do("create-profile", async () => {
      // Profile creation logic
    });

    // Step 3: Send email
    await step.do("send-welcome-email", async () => {
      // Email sending logic
    });

    // Step 4: Complete
    await step.complete("onboarding-complete", {
      userId: profile.userId,
    });
  }
}
```

## Key Features

### Automatic Retries
- Failed steps are automatically retried
- Exponential backoff between retries
- Configurable retry limits

### State Persistence
- Workflow state is persisted between steps
- Survives worker restarts and deployments
- Step results are cached and reused

### Idempotency
- Each step receives the same input on replay
- Steps can be safely retried without side effects
- Results are deterministic

### Error Handling
- Errors are captured and logged
- Workflows can be inspected and debugged
- Failed workflows can be manually retried

## Cloudflare Workflow Limits

- **Duration**: Up to 30 days per workflow
- **Steps**: Unlimited steps per workflow
- **Concurrency**: 1,000+ concurrent workflows per account
- **State Size**: 128 KB max per workflow state
- **Step Duration**: 15 minutes max per step

## Adding Custom Workflows

1. **Create Workflow Class**

Create a new file in `src/backend/workflows/`:

```typescript
// src/backend/workflows/MyWorkflow.ts
export default class MyWorkflow {
  async run(event: WorkflowEvent, step: WorkflowStep): Promise<void> {
    // Your workflow steps here
    await step.do("step-1", async () => {
      // Step 1 logic
    });

    await step.complete("workflow-complete", {
      result: "success"
    });
  }
}
```

2. **Export from Worker**

Add to `src/backend/server.ts`:

```typescript
import MyWorkflow from "./workflows/MyWorkflow";
export { MyWorkflow };
```

3. **Create Workflow Namespace**

Add to `alchemy.run.ts`:

```typescript
const myWorkflow = await Workflow("my-workflow", {
  className: "MyWorkflow",
  scriptName: "website",
});
```

4. **Bind to Worker**

Add binding in `alchemy.run.ts`:

```typescript
bindings: {
  MY_WORKFLOW: myWorkflow,
}
```

## Use Cases

Workflows are ideal for:

- **User onboarding**: Multi-step user setup processes
- **Data processing**: ETL pipelines and batch jobs
- **Scheduled tasks**: Recurring jobs with complex logic
- **Approval flows**: Multi-stage approval processes
- **Integration sync**: Syncing data between systems

## Production Considerations

1. **Monitoring**: Add logging and metrics for workflow execution
2. **Error Handling**: Implement comprehensive error handling
3. **Timeouts**: Set appropriate timeouts for each step
4. **Idempotency**: Ensure steps are idempotent for safe retries
5. **Testing**: Test workflow execution and error scenarios

## Resources

- [Cloudflare Workflows Documentation](https://developers.cloudflare.com/workflows/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- Implementation: `src/backend/workflow.ts`
