# Alchemy Scopes Guide

Complete guide to organizing resources with Alchemy's hierarchical scope system.

> **Official Documentation**: [alchemy.run/concepts/scope](https://alchemy.run/concepts/scope.md)

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Scope Types](#scope-types)
3. [Scope Hierarchy](#scope-hierarchy)
4. [Scope Finalization](#scope-finalization)
5. [Test Scopes](#test-scopes)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## 🎯 Overview

### What are Scopes?

**Scopes** are hierarchical containers that organize resources and other scopes, similar to a file system.

```typescript
// Scope hierarchy
app (Application Scope)
├── dev (Stage Scope)
│   ├── api (Nested Scope)
│   │   ├── worker.json
│   │   └── queue.json
│   └── database (Resource)
└── prod (Stage Scope)
    ├── api (Nested Scope)
    └── database (Resource)
```

### Benefits

- ✅ **Organization**: Logical grouping of related resources
- ✅ **Isolation**: Separate environments (dev, staging, prod)
- ✅ **Cleanup**: Automatic orphan resource deletion
- ✅ **Testing**: Isolated test scopes with auto-cleanup
- ✅ **Hierarchy**: Nested scopes for complex architectures

---

## 📦 Scope Types

### 1. Application Scope

The **top-level scope** created with `alchemy()`:

```typescript
import alchemy from "alchemy";

const app = await alchemy("my-app");

// Resources in application scope
const config = await File("config", {
  path: "./config.json",
  content: "{}"
});
```

**State Structure:**
```
.alchemy/
└── my-app/          # Application scope
    └── $USER/       # Default stage
        └── config.json
```

### 2. Stage Scope

A **scope directly under the application** for environment separation:

```typescript
const app = await alchemy("my-app", {
  stage: "prod"
});

const database = await Database("main", { /* ... */ });
```

**State Structure:**
```
.alchemy/
└── my-app/
    └── prod/        # Stage scope
        └── main.json
```

**Common Stages:**
- `dev` - Development
- `staging` - Staging/QA
- `prod` - Production
- `$USER` - Personal (default)
- `pr-123` - Pull request preview

### 3. Resource Scope

Each **resource gets its own scope** for child resources:

```typescript
export const WebApp = Resource(
  "my::WebApp",
  async function (this, id, props) {
    // Child resources automatically scoped to this WebApp
    const database = await Database("db", {});
    const apiGateway = await ApiGateway("api", {});
    
    return {
      id,
      url: apiGateway.url,
      dbConnectionString: database.connectionString
    };
  }
);

const app = await WebApp("my-app", {});
```

**State Structure:**
```
.alchemy/
└── my-app/
    └── dev/
        ├── my-app.json      # WebApp resource
        └── my-app/          # Resource scope
            ├── db.json      # Child resource
            └── api.json     # Child resource
```

### 4. Nested Scope

**Custom scopes** for organizing related resources:

```typescript
// Create nested scopes
await alchemy.run("backend", async () => {
  await ApiGateway("api", {});
  await Function("handler", {});
});

await alchemy.run("frontend", async () => {
  await Bucket("assets", {});
});
```

**State Structure:**
```
.alchemy/
└── my-app/
    └── dev/
        ├── backend/         # Nested scope
        │   ├── api.json
        │   └── handler.json
        └── frontend/        # Nested scope
            └── assets.json
```

---

## 🌳 Scope Hierarchy

### Basic Hierarchy

```typescript
const app = await alchemy("my-app", {
  stage: "dev"
});

// Flat structure
const api = await Worker("api", {});
const db = await D1Database("database", {});
const storage = await R2Bucket("storage", {});
```

**State:**
```
.alchemy/
└── my-app/
    └── dev/
        ├── api.json
        ├── database.json
        └── storage.json
```

### Nested Hierarchy

```typescript
const app = await alchemy("my-app", {
  stage: "dev"
});

// Backend scope
await alchemy.run("backend", async () => {
  await Worker("api", {});
  await Queue("jobs", {});
  
  // Database scope (nested within backend)
  await alchemy.run("database", async () => {
    await D1Database("primary", {});
    await D1Database("analytics", {});
  });
});

// Frontend scope
await alchemy.run("frontend", async () => {
  await R2Bucket("assets", {});
  await KVNamespace("cache", {});
});
```

**State:**
```
.alchemy/
└── my-app/
    └── dev/
        ├── backend/
        │   ├── api.json
        │   ├── jobs.json
        │   └── database/
        │       ├── primary.json
        │       └── analytics.json
        └── frontend/
            ├── assets.json
            └── cache.json
```

### Recommended Patterns

#### Pattern 1: Layer-Based

```typescript
// Infrastructure layer
await alchemy.run("infrastructure", async () => {
  await D1Database("database", {});
  await R2Bucket("storage", {});
  await KVNamespace("cache", {});
});

// Application layer
await alchemy.run("application", async () => {
  await Worker("api", {});
  await Worker("worker", {});
});

// Edge layer
await alchemy.run("edge", async () => {
  await Worker("cdn", {});
});
```

#### Pattern 2: Service-Based

```typescript
// User service
await alchemy.run("users", async () => {
  await Worker("api", {});
  await D1Database("db", {});
  await Queue("events", {});
});

// Auth service
await alchemy.run("auth", async () => {
  await Worker("api", {});
  await KVNamespace("sessions", {});
});

// Storage service
await alchemy.run("storage", async () => {
  await R2Bucket("uploads", {});
  await Queue("processing", {});
});
```

#### Pattern 3: Environment-Based

```typescript
const stage = process.env.STAGE ?? "dev";

const app = await alchemy("my-app", { stage });

// Shared resources (all stages)
await alchemy.run("shared", async () => {
  await KVNamespace("config", {});
});

// Stage-specific resources
if (stage === "prod") {
  await alchemy.run("monitoring", async () => {
    await Worker("metrics", {});
    await D1Database("analytics", {});
  });
}
```

---

## 🔄 Scope Finalization

### What is Finalization?

**Finalization** deletes orphaned resources (resources in state but not in code).

### Manual Finalization

Application scopes require manual finalization:

```typescript
const app = await alchemy("my-app");

await Worker("api", {});
// If a previously existing resource is removed from code,
// it will be deleted during finalization

await app.finalize(); // ✅ Required for application scope
```

### Automatic Finalization

Nested scopes finalize automatically:

```typescript
await alchemy.run("backend", async () => {
  await Worker("api", {});
  await Queue("jobs", {});
  // ✅ Auto-finalizes when function completes
});
```

### Example: Orphan Cleanup

**First Deployment:**
```typescript
const app = await alchemy("my-app");

await Worker("api", {});
await Worker("worker", {});
await D1Database("database", {});

await app.finalize();
```

**State After:**
```
.alchemy/my-app/dev/
├── api.json
├── worker.json
└── database.json
```

**Second Deployment (removed worker):**
```typescript
const app = await alchemy("my-app");

await Worker("api", {});
await D1Database("database", {});

await app.finalize(); // Deletes orphaned "worker"
```

**State After:**
```
.alchemy/my-app/dev/
├── api.json
└── database.json
```

---

## 🧪 Test Scopes

### Purpose

**Test scopes** provide isolated environments that automatically clean up after tests.

### Basic Usage

```typescript
import { alchemy } from "../../src/alchemy";
import "../../src/test/bun";

// Create test scope from filename
const test = alchemy.test(import.meta, {
  prefix: "test"
});

// Each test gets isolated sub-scope
test("create resource", async (scope) => {
  const resource = await Resource("test-resource", {});
  expect(resource.id).toBeTruthy();
  // ✅ Resources auto-cleaned when test completes
});
```

### Real Example

```typescript
import { alchemy } from "../../src/alchemy";
import { Worker } from "../../src/cloudflare/worker";
import "../../src/test/bun";

const BRANCH_PREFIX = process.env.BRANCH || "main";
const test = alchemy.test(import.meta, { prefix: BRANCH_PREFIX });

describe("Worker Resource", () => {
  test("create worker", async (scope) => {
    const worker = await Worker(`${BRANCH_PREFIX}-test-worker`, {
      script: "export default { async fetch() { return new Response('OK'); } }",
      format: "esm",
    });
    
    expect(worker.id).toBeTruthy();
    expect(worker.url).toContain("workers.dev");
  });
  
  test("update worker", async (scope) => {
    // First create
    await Worker("test-worker", {
      script: "// v1",
      format: "esm",
    });
    
    // Then update
    const updated = await Worker("test-worker", {
      script: "// v2",
      format: "esm",
    });
    
    expect(updated.id).toBeTruthy();
  });
});
```

### Benefits

- ✅ **Isolation**: Each test has its own scope
- ✅ **Cleanup**: Automatic resource deletion
- ✅ **Parallel**: Tests can run in parallel
- ✅ **Deterministic**: No test pollution

---

## ⚡ Destroy Strategy

### Sequential (Default)

Resources destroyed one at a time:

```typescript
const app = await alchemy("my-app", {
  destroyStrategy: "sequential" // default
});
```

**Behavior:**
- Slower but safer
- Respects dependencies
- Good for complex architectures

### Parallel

Resources destroyed simultaneously:

```typescript
const app = await alchemy("my-app", {
  destroyStrategy: "parallel"
});
```

**Behavior:**
- Faster cleanup
- No dependency ordering
- Good for independent resources

### Per-Scope Strategy

```typescript
await alchemy.run("backend", {
  destroyStrategy: "parallel"
}, async (scope) => {
  // These resources will be deleted in parallel
  await Worker("api", {});
  await Worker("worker", {});
  await Queue("jobs", {});
});
```

---

## ✅ Best Practices

### 1. Use Nested Scopes for Organization

```typescript
// ✅ Good: Organized
await alchemy.run("backend", async () => {
  await Worker("api", {});
  await Queue("jobs", {});
});

await alchemy.run("frontend", async () => {
  await R2Bucket("assets", {});
});

// ❌ Bad: Flat
await Worker("api", {});
await Queue("jobs", {});
await R2Bucket("assets", {});
```

### 2. Always Finalize Application Scopes

```typescript
const app = await alchemy("my-app");

// ... create resources ...

await app.finalize(); // ✅ Required
```

### 3. Use Meaningful Scope Names

```typescript
// ✅ Good: Clear purpose
await alchemy.run("user-service", async () => { /* ... */ });
await alchemy.run("auth-service", async () => { /* ... */ });

// ❌ Bad: Unclear
await alchemy.run("scope1", async () => { /* ... */ });
await alchemy.run("scope2", async () => { /* ... */ });
```

### 4. Match Scope Hierarchy to Architecture

```typescript
// Microservices architecture
await alchemy.run("users", async () => {
  await alchemy.run("api", async () => { /* ... */ });
  await alchemy.run("database", async () => { /* ... */ });
});

await alchemy.run("orders", async () => {
  await alchemy.run("api", async () => { /* ... */ });
  await alchemy.run("database", async () => { /* ... */ });
});
```

### 5. Use Test Scopes for Testing

```typescript
// ✅ Good: Isolated tests
const test = alchemy.test(import.meta);

test("create resource", async (scope) => {
  const resource = await Resource("test", {});
  // Auto-cleanup
});

// ❌ Bad: Manual cleanup
test("create resource", async () => {
  const resource = await Resource("test", {});
  // Need manual cleanup
  await resource.delete();
});
```

---

## 🎨 Examples

### Example 1: Simple App

```typescript
const app = await alchemy("my-app");

await Worker("api", {});
await D1Database("database", {});
await R2Bucket("storage", {});

await app.finalize();
```

**State:**
```
.alchemy/my-app/dev/
├── api.json
├── database.json
└── storage.json
```

### Example 2: Organized App

```typescript
const app = await alchemy("my-app");

await alchemy.run("backend", async () => {
  await Worker("api", {});
  await Queue("jobs", {});
});

await alchemy.run("data", async () => {
  await D1Database("database", {});
  await R2Bucket("storage", {});
  await KVNamespace("cache", {});
});

await app.finalize();
```

**State:**
```
.alchemy/my-app/dev/
├── backend/
│   ├── api.json
│   └── jobs.json
└── data/
    ├── database.json
    ├── storage.json
    └── cache.json
```

### Example 3: Multi-Service App

```typescript
const app = await alchemy("my-app");

// User service
await alchemy.run("users", async () => {
  await Worker("api", { script: "./src/users/api.ts" });
  await D1Database("db", {});
  await Queue("events", {});
});

// Auth service
await alchemy.run("auth", async () => {
  await Worker("api", { script: "./src/auth/api.ts" });
  await KVNamespace("sessions", {});
  await DurableObject("sessions", {});
});

// Shared resources
await alchemy.run("shared", async () => {
  await R2Bucket("uploads", {});
  await KVNamespace("config", {});
});

await app.finalize();
```

**State:**
```
.alchemy/my-app/dev/
├── users/
│   ├── api.json
│   ├── db.json
│   └── events.json
├── auth/
│   ├── api.json
│   ├── sessions.json (KV)
│   └── sessions.json (DO)
└── shared/
    ├── uploads.json
    └── config.json
```

---

## 🔗 Related Documentation

- **Profiles**: [docs/PROFILES_GUIDE.md](./PROFILES_GUIDE.md)
- **Resource Lifecycle**: [docs/RESOURCE_LIFECYCLE.md](./RESOURCE_LIFECYCLE.md)
- **Execution Phases**: [docs/EXECUTION_PHASES.md](./EXECUTION_PHASES.md)

---

## 📝 Summary

### Quick Reference

```typescript
// Application scope
const app = await alchemy("my-app", { stage: "prod" });

// Nested scope
await alchemy.run("backend", async () => {
  await Worker("api", {});
});

// Finalize
await app.finalize();

// Test scope
const test = alchemy.test(import.meta);
test("test name", async (scope) => { /* ... */ });
```

### Key Takeaways

1. **Scopes** organize resources hierarchically
2. **Application scope** is the top level
3. **Stage scopes** separate environments
4. **Nested scopes** organize related resources
5. **Finalization** cleans up orphaned resources
6. **Test scopes** provide isolation and auto-cleanup

---

**Last Updated**: October 26, 2025  
**Alchemy Version**: 0.76.1+  
**Status**: ✅ Production-ready patterns
