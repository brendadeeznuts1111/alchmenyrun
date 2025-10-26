# Worker Configuration Guide

Complete guide to configuring Cloudflare Workers in Alchemy.run applications.

---

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Advanced Configuration](#advanced-configuration)
- [Binding Configuration](#binding-configuration)
- [Runtime Configuration](#runtime-configuration)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)

---

## Basic Configuration

### Simple Worker Deployment

The simplest way to deploy a Worker:

```typescript
import { Worker } from "@alchemy/astro";

export default alchemy({
  name: "my-app",
  async setup() {
    const api = Worker("api", {
      entry: "./src/worker.ts"
    });
    
    return { api };
  }
});
```

### Entry Point Configuration

The `entry` field specifies the path to your Worker code:

```typescript
const api = Worker("api", {
  entry: "./src/api/worker.ts"  // Relative to project root
});
```

### Automatic Naming

Workers are automatically named based on your identifier:

```typescript
const api = Worker("api");  // Worker name: "api"
const backend = Worker("backend");  // Worker name: "backend"
```

### Deployment Verification

After deployment, verify your Worker:

```bash
# Deploy
alchemy deploy

# Check status
wrangler deployments list

# Test endpoint
curl https://your-worker.workers.dev
```

---

## Advanced Configuration

### Custom Names and Routes

Override automatic naming and add custom routes:

```typescript
const api = Worker("api", {
  entry: "./src/worker.ts",
  name: "production-api",  // Custom name
  route: {
    pattern: "api.example.com/*",
    zone_name: "example.com"
  }
});
```

### Environment Variables

Add environment variables to your Worker:

```typescript
const api = Worker("api", {
  entry: "./src/worker.ts",
  bindings: {
    // Plain environment variables
    STAGE: process.env.STAGE ?? "dev",
    API_URL: "https://api.example.com",
    DEBUG: process.env.DEBUG === "true"
  }
});
```

### Secret Management

Use `alchemy.secret()` for sensitive data:

```typescript
const api = Worker("api", {
  entry: "./src/worker.ts",
  bindings: {
    // Secrets (encrypted)
    API_KEY: alchemy.secret(process.env.API_KEY),
    JWT_SECRET: alchemy.secret(process.env.JWT_SECRET),
    DATABASE_URL: alchemy.secret(process.env.DATABASE_URL),
    
    // Plain env vars (not sensitive)
    STAGE: process.env.STAGE ?? "dev"
  }
});
```

### Multiple Workers

Deploy multiple Workers in one application:

```typescript
export default alchemy({
  name: "my-app",
  async setup() {
    const api = Worker("api", {
      entry: "./src/api/worker.ts"
    });
    
    const admin = Worker("admin", {
      entry: "./src/admin/worker.ts"
    });
    
    const cron = Worker("cron", {
      entry: "./src/cron/worker.ts"
    });
    
    return { api, admin, cron };
  }
});
```

---

## Binding Configuration

### KV Namespaces

Key-value storage for caching and simple data:

```typescript
import { Worker, KV } from "@alchemy/astro";

const api = Worker("api", {
  entry: "./src/worker.ts",
  bindings: {
    CACHE: KV("cache"),
    SESSIONS: KV("sessions"),
    RATE_LIMIT: KV("rate-limit")
  }
});
```

**Usage in Worker:**
```typescript
export default {
  async fetch(request, env) {
    // Get from KV
    const cached = await env.CACHE.get("key");
    
    // Set in KV
    await env.CACHE.put("key", "value", {
      expirationTtl: 3600  // 1 hour
    });
    
    // Delete from KV
    await env.CACHE.delete("key");
    
    return new Response(cached);
  }
};
```

### D1 Databases

SQL database for structured data:

```typescript
import { Worker, D1 } from "@alchemy/astro";

const api = Worker("api", {
  entry: "./src/worker.ts",
  bindings: {
    DB: D1("main-db"),
    ANALYTICS: D1("analytics-db")
  }
});
```

**Usage in Worker:**
```typescript
export default {
  async fetch(request, env) {
    // Query database
    const result = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(1).first();
    
    // Insert data
    await env.DB.prepare(
      "INSERT INTO users (name, email) VALUES (?, ?)"
    ).bind("John", "john@example.com").run();
    
    return Response.json(result);
  }
};
```

### R2 Buckets

Object storage for files and large data:

```typescript
import { Worker, R2 } from "@alchemy/astro";

const api = Worker("api", {
  entry: "./src/worker.ts",
  bindings: {
    FILES: R2("uploads"),
    BACKUPS: R2("backups")
  }
});
```

**Usage in Worker:**
```typescript
export default {
  async fetch(request, env) {
    // Upload file
    await env.FILES.put("file.txt", "content");
    
    // Download file
    const object = await env.FILES.get("file.txt");
    const content = await object?.text();
    
    // Delete file
    await env.FILES.delete("file.txt");
    
    return new Response(content);
  }
};
```

### Durable Objects

Stateful objects for real-time features:

```typescript
import { Worker, DurableObjectNamespace } from "@alchemy/astro";

const chat = Worker("chat", {
  entry: "./src/worker.ts",
  bindings: {
    ROOMS: DurableObjectNamespace("ChatRoom"),
    SESSIONS: DurableObjectNamespace("UserSession")
  }
});
```

**Usage in Worker:**
```typescript
export default {
  async fetch(request, env) {
    // Get Durable Object
    const id = env.ROOMS.idFromName("room-123");
    const room = env.ROOMS.get(id);
    
    // Call Durable Object
    return room.fetch(request);
  }
};

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
  }
  
  async fetch(request) {
    // Stateful logic here
    return new Response("Room active");
  }
}
```

### Queues

Background job processing:

```typescript
import { Worker, Queue } from "@alchemy/astro";

const api = Worker("api", {
  entry: "./src/worker.ts",
  bindings: {
    JOBS: Queue("background-jobs"),
    EMAILS: Queue("email-queue")
  }
});
```

**Usage in Worker:**
```typescript
export default {
  async fetch(request, env) {
    // Send message to queue
    await env.JOBS.send({
      type: "process-upload",
      fileId: "123"
    });
    
    return new Response("Job queued");
  },
  
  async queue(batch, env) {
    // Process queue messages
    for (const message of batch.messages) {
      console.log("Processing:", message.body);
      message.ack();
    }
  }
};
```

### Service Bindings

Worker-to-worker communication:

```typescript
import { Worker, Service } from "@alchemy/astro";

const api = Worker("api", {
  entry: "./src/api/worker.ts",
  bindings: {
    AUTH: Service("auth")
  }
});

const auth = Worker("auth", {
  entry: "./src/auth/worker.ts"
});
```

**Usage in Worker:**
```typescript
export default {
  async fetch(request, env) {
    // Call another worker
    const authResponse = await env.AUTH.fetch(
      new Request("https://internal/verify", {
        headers: request.headers
      })
    );
    
    if (!authResponse.ok) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    return new Response("Authorized");
  }
};
```

---

## Runtime Configuration

### Compatibility Dates

Set the Workers runtime version:

```typescript
const api = Worker("api", {
  entry: "./src/worker.ts",
  compatibility_date: "2024-01-15"
});
```

**Recommended:** Always set a compatibility date to ensure consistent behavior.

### Usage Models

Choose between bundled and unbound pricing:

```typescript
const api = Worker("api", {
  entry: "./src/worker.ts",
  usage_model: "bundled"  // or "unbound"
});
```

**Bundled:** 10ms CPU time per request (default)  
**Unbound:** 30s CPU time per request (higher cost)

### Limits and Timeouts

Configure execution limits:

```typescript
const api = Worker("api", {
  entry: "./src/worker.ts",
  limits: {
    cpu_ms: 50  // Maximum CPU time in milliseconds
  }
});
```

---

## Best Practices

### Security Guidelines

#### ✅ DO: Use Secrets for Sensitive Data
```typescript
const api = Worker("api", {
  bindings: {
    API_KEY: alchemy.secret(process.env.API_KEY),
    JWT_SECRET: alchemy.secret(process.env.JWT_SECRET)
  }
});
```

#### ❌ DON'T: Use Plain Env Vars for Secrets
```typescript
const api = Worker("api", {
  bindings: {
    API_KEY: process.env.API_KEY  // Bad: Not encrypted
  }
});
```

#### ✅ DO: Validate Input
```typescript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id || !/^\d+$/.test(id)) {
      return new Response("Invalid ID", { status: 400 });
    }
    
    // Process valid input
  }
};
```

### Performance Optimization

#### ✅ DO: Use KV for Caching
```typescript
export default {
  async fetch(request, env) {
    const cacheKey = new URL(request.url).pathname;
    
    // Check cache first
    const cached = await env.CACHE.get(cacheKey);
    if (cached) return new Response(cached);
    
    // Generate response
    const response = await generateResponse();
    
    // Cache for 1 hour
    await env.CACHE.put(cacheKey, response, {
      expirationTtl: 3600
    });
    
    return new Response(response);
  }
};
```

#### ✅ DO: Set Compatibility Date
```typescript
const api = Worker("api", {
  compatibility_date: "2024-01-15"  // Use latest stable version
});
```

#### ❌ DON'T: Block on External APIs
```typescript
// Bad: Synchronous blocking
const response = await fetch("https://slow-api.com");
const data = await response.json();

// Good: Use Promise.race for timeouts
const response = await Promise.race([
  fetch("https://slow-api.com"),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Timeout")), 5000)
  )
]);
```

### Error Handling

#### ✅ DO: Handle Errors Gracefully
```typescript
export default {
  async fetch(request, env) {
    try {
      const result = await env.DB.prepare(
        "SELECT * FROM users WHERE id = ?"
      ).bind(1).first();
      
      return Response.json(result);
    } catch (error) {
      console.error("Database error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
};
```

#### ✅ DO: Log Important Events
```typescript
export default {
  async fetch(request, env) {
    console.log("Request:", {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers)
    });
    
    const response = await handleRequest(request, env);
    
    console.log("Response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers)
    });
    
    return response;
  }
};
```

### Testing Strategies

#### Unit Tests
```typescript
import { describe, test, expect } from "vitest";

describe("Worker", () => {
  test("returns 200 for valid request", async () => {
    const request = new Request("https://example.com/api");
    const env = getMockEnv();
    
    const response = await worker.fetch(request, env);
    
    expect(response.status).toBe(200);
  });
});
```

#### Integration Tests with PHASE=read
```bash
# Test against deployed infrastructure
PHASE=read bun test
PHASE=read bun ./scripts/test-api.ts
```

---

## Real-World Examples

### 1. API Server with Database

```typescript
import { Worker, D1, KV } from "@alchemy/astro";

const api = Worker("api", {
  entry: "./src/api/worker.ts",
  bindings: {
    DB: D1("main-db"),
    CACHE: KV("api-cache"),
    RATE_LIMIT: KV("rate-limit"),
    JWT_SECRET: alchemy.secret(process.env.JWT_SECRET)
  },
  compatibility_date: "2024-01-15"
});
```

**Worker Implementation:**
```typescript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Rate limiting
    const ip = request.headers.get("CF-Connecting-IP");
    const rateLimitKey = `rate:${ip}`;
    const requests = await env.RATE_LIMIT.get(rateLimitKey);
    
    if (requests && parseInt(requests) > 100) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
    
    await env.RATE_LIMIT.put(rateLimitKey, 
      String((parseInt(requests || "0") + 1)),
      { expirationTtl: 60 }
    );
    
    // Cache check
    const cacheKey = url.pathname;
    const cached = await env.CACHE.get(cacheKey);
    if (cached) return new Response(cached);
    
    // Database query
    const result = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(url.searchParams.get("id")).first();
    
    // Cache result
    const response = JSON.stringify(result);
    await env.CACHE.put(cacheKey, response, {
      expirationTtl: 300
    });
    
    return new Response(response);
  }
};
```

### 2. File Upload Service

```typescript
import { Worker, R2, D1, Queue } from "@alchemy/astro";

const uploads = Worker("uploads", {
  entry: "./src/uploads/worker.ts",
  bindings: {
    FILES: R2("uploads"),
    METADATA: D1("file-metadata"),
    UPLOAD_QUEUE: Queue("upload-processing")
  }
});
```

**Worker Implementation:**
```typescript
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!file) {
      return new Response("No file provided", { status: 400 });
    }
    
    const fileId = crypto.randomUUID();
    
    // Upload to R2
    await env.FILES.put(fileId, file.stream());
    
    // Store metadata
    await env.METADATA.prepare(
      "INSERT INTO files (id, name, size, type) VALUES (?, ?, ?, ?)"
    ).bind(fileId, file.name, file.size, file.type).run();
    
    // Queue processing
    await env.UPLOAD_QUEUE.send({
      fileId,
      type: "process-upload"
    });
    
    return Response.json({ fileId });
  }
};
```

### 3. Real-time Chat with Durable Objects

```typescript
import { Worker, DurableObjectNamespace, D1, KV } from "@alchemy/astro";

const chat = Worker("chat", {
  entry: "./src/chat/worker.ts",
  bindings: {
    ROOMS: DurableObjectNamespace("ChatRoom"),
    MESSAGES: D1("chat-messages"),
    ONLINE_USERS: KV("online-users")
  }
});
```

**Worker Implementation:**
```typescript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("room");
    
    if (!roomId) {
      return new Response("Room ID required", { status: 400 });
    }
    
    // Get Durable Object
    const id = env.ROOMS.idFromName(roomId);
    const room = env.ROOMS.get(id);
    
    // Forward request to Durable Object
    return room.fetch(request);
  }
};

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
  }
  
  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    
    return new Response("WebSocket required", { status: 426 });
  }
  
  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    this.sessions.add(server);
    
    server.addEventListener("message", async (event) => {
      // Broadcast to all sessions
      for (const session of this.sessions) {
        session.send(event.data);
      }
      
      // Store in database
      await this.env.MESSAGES.prepare(
        "INSERT INTO messages (room_id, content) VALUES (?, ?)"
      ).bind(this.state.id.toString(), event.data).run();
    });
    
    server.accept();
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}
```

---

## Configuration Reference

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entry` | `string` | *required* | Path to worker entry file |
| `name` | `string` | automatic | Custom worker name |
| `route` | `object` | *worker-only* | Custom domain route |

### Binding Options

| Binding | Type | Example | Use Case |
|---------|------|---------|----------|
| `KV` | `KVNamespace` | `KV("cache")` | Key-value storage |
| `D1` | `D1Database` | `D1("db")` | SQL database |
| `R2` | `R2Bucket` | `R2("files")` | Object storage |
| `DurableObjectNamespace` | `DurableObjectNamespace` | `DurableObjectNamespace("Room")` | Stateful objects |
| `Queue` | `Queue` | `Queue("jobs")` | Background jobs |
| `Service` | `Fetcher` | `Service("auth")` | Worker-to-worker |

### Runtime Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `compatibility_date` | `string` | *recommended* | Workers runtime version |
| `usage_model` | `"bundled" \| "unbound"` | `"bundled"` | Pricing model |

---

## Performance Comparison

| Configuration | Cold Start | Memory | Best For |
|---------------|------------|--------|----------|
| Basic worker | Fast | Low | Simple APIs |
| With KV | Medium | Medium | Cached data |
| With D1 | Medium | Medium | Structured data |
| With Durable Objects | Slow | High | Stateful logic |
| With multiple bindings | Slower | Higher | Complex apps |

---

## Next Steps

- [Alchemy Commands](./ALCHEMY_COMMANDS.md) - Learn deployment commands
- [Durable Objects Guide](./DURABLE_OBJECTS.md) - Deep dive into stateful objects
- [D1 Database Guide](./D1_DATABASE.md) - SQL database configuration
- [KV Storage Guide](./KV_STORAGE.md) - Key-value storage patterns
