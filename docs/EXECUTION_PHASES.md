# Alchemy Execution Phases Guide

Complete guide to Alchemy's three execution phases: `up`, `destroy`, and `read`.

> **Official Documentation**: [alchemy.run/concepts/phase](https://alchemy.run/concepts/phase.md)

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Up Phase](#up-phase)
3. [Destroy Phase](#destroy-phase)
4. [Read Phase](#read-phase)
5. [Practical Examples](#practical-examples)
6. [Best Practices](#best-practices)

---

## 🎯 Overview

Alchemy has **three execution phases** that control how your infrastructure code runs:

| Phase | Purpose | Creates | Updates | Deletes |
|-------|---------|---------|---------|---------|
| **`up`** | Deploy infrastructure | ✅ | ✅ | ✅ (orphaned) |
| **`destroy`** | Tear down infrastructure | ❌ | ❌ | ✅ (all) |
| **`read`** | Access infrastructure | ❌ | ❌ | ❌ |

### Setting the Phase

```typescript
const app = await alchemy("my-app", {
  phase: "up" | "destroy" | "read"
});
```

**Environment Variable:**
```typescript
const phase = (process.env.PHASE as "up" | "destroy" | "read") ?? "up";

const app = await alchemy("my-app", { phase });
```

---

## 🚀 Up Phase

### Purpose

The **Up phase** creates, updates, and deletes resources to match your code. This is the **default** and most common mode.

### Behavior

```typescript
const app = await alchemy("my-app", {
  phase: "up" // default
});

const worker = await Worker("my-app", { /* ... */ });
// ✅ Will be created or updated

await app.finalize();
// ✅ Will delete orphaned resources
```

### What Happens

1. **Create**: New resources are created
2. **Update**: Existing resources are updated
3. **Delete**: Orphaned resources are removed (via `finalize()`)

### Usage

```bash
# Default (up phase)
bun ./alchemy.run.ts

# Explicit
PHASE=up bun ./alchemy.run.ts

# With Alchemy CLI
alchemy deploy
```

### Example

```typescript
// alchemy.run.ts
const app = await alchemy("my-app", {
  phase: process.env.PHASE ?? "up"
});

// Create/update worker
export const api = await Worker("api", {
  script: "./src/backend/server.ts",
});

// Create/update database
export const db = await D1Database("database");

// Finalize to clean up orphaned resources
await app.finalize();
```

**First deployment:**
- Creates `api` worker
- Creates `database`

**Second deployment (after removing database):**
- Updates `api` worker
- Deletes `database` (orphaned)

---

## 💥 Destroy Phase

### Purpose

The **Destroy phase** deletes all resources in the specified stage and **stops execution**.

### Behavior

```typescript
const app = await alchemy("my-app", {
  phase: "destroy",
  stage: "prod" // ← This stage will be destroyed
});

// ❌ Execution stops here - code below never runs

const worker = await Worker("my-app", { /* ... */ });
// ← Never executed
```

### What Happens

1. **Delete All**: All resources in the stage are deleted
2. **Stop**: Program execution terminates immediately
3. **No Creation**: No resources are created or updated

### Usage

```bash
# Destroy default stage
PHASE=destroy bun ./alchemy.run.ts

# Destroy specific stage
PHASE=destroy bun ./alchemy.run.ts --stage prod

# With Alchemy CLI
alchemy destroy --stage prod
```

### Example

```typescript
// alchemy.run.ts
const phase = process.env.PHASE as "up" | "destroy" | "read" | undefined;
const stage = process.env.STAGE ?? "dev";

const app = await alchemy("my-app", { phase, stage });

// If phase is "destroy", execution stops after alchemy() call
// Resources below are never evaluated

export const api = await Worker("api", { /* ... */ });
export const db = await D1Database("database");

await app.finalize();
```

**Destroy command:**
```bash
PHASE=destroy STAGE=dev bun ./alchemy.run.ts
# Deletes: my-app-api-dev, my-app-database-dev
# Stops execution immediately
```

### Package.json Scripts

```json
{
  "scripts": {
    "destroy": "PHASE=destroy bun ./alchemy.run.ts",
    "destroy:prod": "PHASE=destroy STAGE=prod bun ./alchemy.run.ts"
  }
}
```

---

## 📖 Read Phase

### Purpose

The **Read phase** runs your code without creating, updating, or deleting resources. Useful for accessing infrastructure properties in scripts.

### Behavior

```typescript
const app = await alchemy("my-app", {
  phase: "read"
});

// Reconstructs from state (doesn't create/update)
const worker = await Worker("my-app", { /* ... */ });

// Access properties
console.log(worker.url); // ← Populated from `.alchemy/` state

await app.finalize();
// ← Will NOT delete orphaned resources
```

### What Happens

1. **Read State**: Resources are reconstructed from `.alchemy/` state
2. **No Changes**: No creation, updates, or deletions
3. **Access Properties**: All resource properties available
4. **Error if Missing**: Fails if resource doesn't exist in state

### Usage

```bash
# Read phase
PHASE=read bun ./alchemy.run.ts

# With Alchemy CLI
alchemy read
```

### Use Cases

#### 1. Build Scripts

Access infrastructure URLs during build:

```typescript
// scripts/build.ts
import { exec } from "alchemy/os";
import { api } from "../alchemy.run";

await exec("astro build", {
  BACKEND_URL: api.url // ← Read from state
});
```

```bash
# Run build with infrastructure properties
PHASE=read bun ./scripts/build.ts
```

#### 2. Environment Variables

Export infrastructure properties:

```typescript
// scripts/env.ts
import { api, db } from "../alchemy.run";

console.log(`API_URL=${api.url}`);
console.log(`DB_ID=${db.id}`);
```

```bash
# Generate .env file
PHASE=read bun ./scripts/env.ts > .env
```

#### 3. Verification Scripts

Check infrastructure without modifying:

```typescript
// scripts/verify.ts
import { api, db, storage } from "../alchemy.run";

console.log("✅ API:", api.url);
console.log("✅ Database:", db.id);
console.log("✅ Storage:", storage.name);
```

```bash
# Verify infrastructure
PHASE=read bun ./scripts/verify.ts
```

#### 4. Integration Tests

Access real infrastructure in tests:

```typescript
// tests/integration.test.ts
import { api } from "../alchemy.run";

describe("API Integration", () => {
  it("should respond to health check", async () => {
    const response = await fetch(`${api.url}/api/health`);
    expect(response.ok).toBe(true);
  });
});
```

```bash
# Run integration tests
PHASE=read bun test tests/integration.test.ts
```

---

## 🎨 Practical Examples

### Example 1: Standard Deployment

```typescript
// alchemy.run.ts
const app = await alchemy("my-app", {
  phase: process.env.PHASE ?? "up"
});

export const api = await Worker("api", {
  script: "./src/backend/server.ts",
});

export const db = await D1Database("database");

await app.finalize();
```

**Commands:**
```bash
# Deploy (up phase)
bun ./alchemy.run.ts

# Destroy
PHASE=destroy bun ./alchemy.run.ts

# Read
PHASE=read bun ./alchemy.run.ts
```

### Example 2: Build Script with Infrastructure

```typescript
// alchemy.run.ts
const app = await alchemy("my-app", {
  phase: process.env.PHASE ?? "up"
});

export const api = await Worker("api", {
  script: "./src/backend/server.ts",
});

await app.finalize();
```

```typescript
// scripts/build-frontend.ts
import { exec } from "alchemy/os";
import { api } from "../alchemy.run";

console.log("Building frontend with API URL:", api.url);

await exec("vite build", {
  VITE_API_URL: api.url,
  VITE_API_ENV: process.env.STAGE ?? "dev"
});

console.log("✅ Frontend built successfully");
```

**Usage:**
```bash
# Build frontend with infrastructure URLs
PHASE=read bun ./scripts/build-frontend.ts
```

### Example 3: Multi-Stage Management

```typescript
// alchemy.run.ts
const phase = process.env.PHASE as "up" | "destroy" | "read" | undefined;
const stage = process.env.STAGE ?? process.env.USER ?? "dev";

const app = await alchemy("my-app", { phase, stage });

export const api = await Worker("api", {
  script: "./src/backend/server.ts",
});

await app.finalize();
```

**Commands:**
```bash
# Deploy to dev
STAGE=dev bun ./alchemy.run.ts

# Deploy to prod
STAGE=prod bun ./alchemy.run.ts

# Destroy dev
PHASE=destroy STAGE=dev bun ./alchemy.run.ts

# Read prod
PHASE=read STAGE=prod bun ./alchemy.run.ts
```

### Example 4: Package.json Scripts

```json
{
  "scripts": {
    "deploy": "bun ./alchemy.run.ts",
    "deploy:prod": "STAGE=prod bun ./alchemy.run.ts",
    "deploy:read": "PHASE=read bun ./alchemy.run.ts",
    "destroy": "PHASE=destroy bun ./alchemy.run.ts",
    "destroy:prod": "PHASE=destroy STAGE=prod bun ./alchemy.run.ts",
    "build:frontend": "PHASE=read bun ./scripts/build-frontend.ts",
    "verify": "PHASE=read bun ./scripts/verify.ts"
  }
}
```

**Usage:**
```bash
bun run deploy              # Deploy to dev
bun run deploy:prod         # Deploy to prod
bun run deploy:read         # Read infrastructure
bun run destroy             # Destroy dev
bun run destroy:prod        # Destroy prod
bun run build:frontend      # Build with infra URLs
bun run verify              # Verify infrastructure
```

---

## ✅ Best Practices

### 1. Always Use Environment Variables

```typescript
// ✅ Good: Flexible
const phase = (process.env.PHASE as "up" | "destroy" | "read") ?? "up";
const app = await alchemy("my-app", { phase });

// ❌ Bad: Hardcoded
const app = await alchemy("my-app", { phase: "up" });
```

### 2. Export Resources for Read Phase

```typescript
// ✅ Good: Exportable
export const api = await Worker("api", { /* ... */ });
export const db = await D1Database("database");

// ❌ Bad: Not exportable
const api = await Worker("api", { /* ... */ });
```

### 3. Handle Phase in Scripts

```typescript
// scripts/build.ts
if (process.env.PHASE !== "read") {
  console.error("❌ This script requires PHASE=read");
  process.exit(1);
}

import { api } from "../alchemy.run";
// Safe to use api.url
```

### 4. Always Call finalize()

```typescript
const app = await alchemy("my-app");

// ... create resources ...

await app.finalize(); // ✅ Clean up orphaned resources
```

### 5. Document Phase Usage

```typescript
/**
 * Build frontend with infrastructure URLs
 * 
 * Usage: PHASE=read bun ./scripts/build-frontend.ts
 * 
 * Requires:
 * - Infrastructure must be deployed
 * - PHASE must be set to "read"
 */
import { api } from "../alchemy.run";
```

---

## 🔄 Phase Comparison

### Up vs Read

| Aspect | Up | Read |
|--------|----|----|
| **Creates** | ✅ Yes | ❌ No |
| **Updates** | ✅ Yes | ❌ No |
| **Deletes** | ✅ Yes (orphaned) | ❌ No |
| **Reads State** | ✅ Yes | ✅ Yes |
| **Requires State** | ❌ No | ✅ Yes |
| **Use Case** | Deployment | Scripts |

### Up vs Destroy

| Aspect | Up | Destroy |
|--------|----|----|
| **Creates** | ✅ Yes | ❌ No |
| **Deletes** | ✅ Orphaned only | ✅ All resources |
| **Continues** | ✅ Yes | ❌ Stops immediately |
| **Use Case** | Deployment | Cleanup |

---

## 🧪 Testing Phases

### Test Up Phase

```bash
# Deploy
bun ./alchemy.run.ts

# Verify resources created
ls .alchemy/state/
```

### Test Destroy Phase

```bash
# Destroy
PHASE=destroy bun ./alchemy.run.ts

# Verify resources deleted
ls .alchemy/state/  # Should be empty
```

### Test Read Phase

```bash
# Deploy first
bun ./alchemy.run.ts

# Read without changes
PHASE=read bun ./alchemy.run.ts

# Verify no changes
git status .alchemy/state/  # Should be unchanged
```

---

## 📊 Decision Tree

```
What do you want to do?
│
├─ Deploy infrastructure
│  └─ Use: phase: "up" (default)
│
├─ Access infrastructure properties
│  └─ Use: phase: "read"
│
└─ Delete all infrastructure
   └─ Use: phase: "destroy"
```

---

## 🔗 Related Documentation

- **Resource Lifecycle**: [docs/RESOURCE_LIFECYCLE.md](./RESOURCE_LIFECYCLE.md)
- **Deployment Stages**: [docs/ALCHEMY_PHASES.md](./ALCHEMY_PHASES.md)
- **Naming Strategy**: [docs/NAMING_STRATEGY.md](./NAMING_STRATEGY.md)

---

## 📝 Summary

### Quick Reference

```typescript
// Up phase (default) - Deploy
const app = await alchemy("my-app", { phase: "up" });

// Destroy phase - Tear down
const app = await alchemy("my-app", { phase: "destroy" });

// Read phase - Access only
const app = await alchemy("my-app", { phase: "read" });
```

### Commands

```bash
# Deploy
bun ./alchemy.run.ts

# Destroy
PHASE=destroy bun ./alchemy.run.ts

# Read
PHASE=read bun ./alchemy.run.ts
```

### Key Takeaways

1. **Up**: Default mode for deployment
2. **Destroy**: Deletes all resources and stops
3. **Read**: Access properties without changes
4. **Environment Variables**: Use `PHASE` env var for flexibility
5. **Export Resources**: Make resources accessible for read phase

---

**Last Updated**: October 26, 2025  
**Alchemy Version**: 0.76.1+  
**Status**: ✅ Production-ready patterns
