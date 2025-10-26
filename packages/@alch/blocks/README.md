# @alch/blocks

**Reusable infrastructure building blocks for Alchemy**

One-line resource creation with sensible defaults and automatic wiring.

## Installation

```bash
bun add @alch/blocks
```

## Blocks

### ChatBlock - WebSocket Chat Room

Create a WebSocket chat room with Durable Object in one line:

```typescript
import { ChatBlock } from "@alch/blocks";

const { config, template } = ChatBlock("support");
```

**What it creates:**
- Worker with WebSocket handling
- Durable Object for state management
- Automatic message broadcasting

**Template files:**
- `templates/chat/worker.ts` - Worker entrypoint
- `templates/chat/do.ts` - Durable Object implementation

### JobQueue - Async Job Processing

Create a job queue for async processing:

```typescript
import { JobQueue } from "@alch/blocks";

const emails = JobQueue("emails");
```

**What it creates:**
- Cloudflare Queue for job processing
- Automatic retry logic
- Dead letter queue support

### ScheduledTask - CRON Jobs

Create scheduled tasks:

```typescript
import { ScheduledTask } from "@alch/blocks";

const cleanup = ScheduledTask("cleanup", "0 4 * * *", "src/cron/cleanup.ts");
```

**What it creates:**
- CRON trigger with specified schedule
- Handler function execution
- Automatic error handling

### CacheBlock - KV Cache

Create a KV cache with worker:

```typescript
import { CacheBlock } from "@alch/blocks";

const { config, template } = CacheBlock("api-cache");
```

**What it creates:**
- KV namespace for caching
- Worker for cache operations
- TTL and eviction policies

## Usage

### 1. Import blocks

```typescript
import { ChatBlock, JobQueue, ScheduledTask } from "@alch/blocks";
```

### 2. Create block configurations

```typescript
const chat = ChatBlock("support");
const emails = JobQueue("emails");
const nightly = ScheduledTask("nightly", "0 4 * * *", "src/cron/nightly.ts");
```

### 3. Copy templates to your project

```bash
# Copy chat templates
cp -r node_modules/@alch/blocks/templates/chat src/blocks/support/
```

### 4. Deploy

```bash
alchemy deploy --profile prod
```

## Templates

Each block comes with template files that you copy into your project:

```
templates/
├─ chat/
│  ├─ worker.ts    – Worker entrypoint
│  └─ do.ts        – Durable Object
├─ queue/
│  └─ worker.ts    – Queue consumer
├─ cron/
│  └─ handler.ts   – CRON handler
└─ cache/
   └─ worker.ts    – Cache worker
```

## Examples

See `examples/simple-chat/` for a complete working example.

## License

MIT
