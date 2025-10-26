# @alch/queue

Advanced JobQueue implementation with exponential backoff retries, concurrency throttling, and TypeScript-first design.

## Features

- ✅ **Exponential-backoff retries** - Automatic retry with backoff for transient Cloudflare API errors
- ✅ **Concurrency throttling** - Control job processing rates and prevent overwhelming downstream services
- ✅ **Type-safe configuration** - Full TypeScript support with proper input/output type separation
- ✅ **Conditional deletion** - Optional cleanup with `delete?: boolean` flag
- ✅ **Deterministic naming** - Consistent resource naming with `scope.createPhysicalName()`
- ✅ **Input normalization** - Flexible constructor with future-proofing

## Usage

```typescript
import { JobQueue } from "@alch/queue";

// Create a queue with custom configuration
const jobs = await JobQueue("my-queue", {
  name: "custom-queue-name", // Optional custom name
  delete: false,              // Keep queue on destroy (default: false)
});
```

## Profiles & Multi-Account

Use per-resource or global profiles exactly as described in the
[Alchemy Profiles Guide](https://github.com/brendadeeznuts1111/alchmenyrun/blob/main/docs/PROFILES_GUIDE.md).
