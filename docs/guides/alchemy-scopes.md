# 🗂️ Alchemy Scope System Guide

**Version:** 2.0  
**Last Updated:** 2025-10-27  
**Status:** Production Ready

---

## 📋 Quick Reference

Scopes are Alchemy's filesystem-like containers for resources.  
They give you three guarantees:

1. **Naming isolation** – every resource id is prefixed by its scope path.  
2. **State isolation** – each scope owns one state file.  
3. **Cleanup isolation** – you can destroy a scope without touching its siblings.

### Hierarchy (Five Levels)

| Level | Created by | State dir example | Lifetime |
|-------|------------|-------------------|----------|
| **Application** | `await alchemy("my-app")` | `.alchemy/my-app/` | until `app.finalize()` |
| **Stage** | `{ stage: "prod" }` | `.alchemy/my-app/prod/` | until `alchemy destroy --stage prod` |
| **Nested** | `await alchemy.run("backend", …)` | `.alchemy/my-app/prod/backend/` | auto at block exit |
| **Resource** | implicit inside custom `Resource` | `.alchemy/my-app/prod/backend/my-resource/` | auto when parent finalized |
| **Test** | `alchemy.test(import.meta, …)` | *ephemeral* | auto on test end |

### Cleanup Strategies

- **Sequential** (default) – one resource at a time.  
- **Parallel** – `destroyStrategy: "parallel"` for CI speed.

### Typical Flows

```typescript
// local sandbox
await alchemy("my-app");          // uses $USER stage, default profile

// CI build
await alchemy("my-app", {
  stage: `pr-${PR}`,
  destroyStrategy: "parallel",
  profile: "ci"
});

// prod deploy
await alchemy("my-app", {
  stage: "prod",
  profile: "prod"
});
```

### Remaining Work

See [Issue #38](https://github.com/brendadeeznuts1111/alchmenyrun/issues/38) for tracking:

1. **State-file locking** – prevent concurrent CI jobs on same stage.  
2. **Granular finalize** – `scope.finalizeNested()` to clean one nested block.  
3. **Retry on 429** – inside `app.finalize()` for Cloudflare rate limits.

---

## 📋 Detailed Overview

The Alchemy Scope System is the core mechanism for organizing, isolating, and managing resources, analogous to directories in a filesystem. Scopes ensure environment isolation, enforce resource lifecycle management, and enable reliable cleanup—critical for both local development and CI/CD pipelines.

### Scope Hierarchy

| Type | Creation | Purpose | State Directory |
|------|----------|---------|-----------------|
| **Application** | `await alchemy("my-app")` | Root container for the project | `.alchemy/my-app/` |
| **Stage** | `await alchemy("my-app", { stage: "prod" })` | Isolates environments (dev, prod, pr-XXX) | `.alchemy/my-app/prod/` |
| **Nested** | `await alchemy.run("backend", ...)` | Groups related resources (service layer) | `.alchemy/my-app/dev/backend/` |
| **Resource** | Implicit via `Resource()` | Encapsulates child resources | `.alchemy/my-app/dev/my-resource/` |
| **Test** | `alchemy.test(import.meta, ...)` | Temporary testing scopes | Ephemeral, auto-cleanup |

### Lifecycle and Cleanup

**Finalization (Garbage Collection):**
- Compares current codebase with state files
- Deletes resources no longer defined
- Triggers:
  - **Application:** Manual via `await app.finalize()`
  - **Nested:** Automatic at `alchemy.run()` completion
  - **Test:** Automatic post-test

**Destroy Strategy:**
- **Sequential (default):** One-by-one deletion, reliable
- **Parallel:** Concurrent deletion, faster for CI/CD

**State Files:**
- Stored in `.alchemy/` hierarchy
- Examples:
  - App + Default: `.alchemy/my-app/$USER/`
  - App + Prod: `.alchemy/my-app/prod/`
  - Nested: `.alchemy/my-app/dev/backend/`

### Integration with Workflow

| Context | Stage Scope | Profile | State Directory |
|---------|-------------|---------|-----------------|
| **Local Dev** | `$USER` | `default` | `.alchemy/my-app/$USER/` |
| **CI/CD PR** | `pr-XXX` | `ci` | `.alchemy/my-app/pr-XXX/` |
| **Production** | `prod` | `prod` | `.alchemy/my-app/prod/` |

### Example

```typescript
// Application scope with stage
const app = await alchemy("my-app", { 
  stage: "prod",
  destroyStrategy: "parallel" 
});

// Nested scope for backend services
await alchemy.run("backend", async () => {
  const worker = await Worker("my-worker");
  const db = await D1Database("my-db");
});

// Test scope with automatic cleanup
await alchemy.test(import.meta, async () => {
  const tempDb = await D1Database("test-db");
  // Automatically destroyed after test
});
```

---

## 📋 Detailed Overview

### What Are Scopes?

Scopes are hierarchical containers that:
- ✅ Organize resources logically
- ✅ Enforce environment isolation
- ✅ Manage resource lifecycle
- ✅ Enable reliable cleanup
- ✅ Track state per environment

Think of scopes as **directories** in a filesystem:
- Application scope = root directory
- Stage scope = environment subdirectory
- Nested scope = service/component subdirectory
- Resource scope = individual resource container

---

## 🏗️ Scope Types in Detail

### 1. Application Scope

**Purpose:** Root container for your entire project

**Creation:**
```typescript
const app = await alchemy("my-app");
```

**Characteristics:**
- Top-level scope
- Contains all stages and resources
- Manual finalization required
- State directory: `.alchemy/my-app/`

**Use Cases:**
- Project initialization
- Global resource management
- Manual cleanup operations

**Example:**
```typescript
const app = await alchemy("my-app", {
  phase: "up",
  password: process.env.ALCHEMY_PASSWORD,
  profile: "default"
});

// Create resources...

// Manual finalization
await app.finalize();
```

---

### 2. Stage Scope

**Purpose:** Isolate environments (dev, staging, prod, pr-XXX)

**Creation:**
```typescript
const app = await alchemy("my-app", { 
  stage: "prod" 
});
```

**Characteristics:**
- Environment-specific isolation
- Separate state files per stage
- No cross-stage interference
- State directory: `.alchemy/my-app/<stage>/`

**Use Cases:**
- Local development (`$USER` stage)
- PR previews (`pr-123` stage)
- Production deployment (`prod` stage)

**Example:**
```typescript
// Local development
const devApp = await alchemy("my-app", { 
  stage: process.env.USER 
});

// PR preview
const prApp = await alchemy("my-app", { 
  stage: `pr-${process.env.PR_NUMBER}` 
});

// Production
const prodApp = await alchemy("my-app", { 
  stage: "prod" 
});
```

---

### 3. Nested Scope

**Purpose:** Group related resources (service layers, components)

**Creation:**
```typescript
await alchemy.run("backend", async () => {
  // Resources here
});
```

**Characteristics:**
- Automatic finalization on completion
- Hierarchical organization
- Team/component isolation
- State directory: `.alchemy/my-app/<stage>/backend/`

**Use Cases:**
- Service layer organization
- Component grouping
- Team-specific resources

**Example:**
```typescript
const app = await alchemy("my-app", { stage: "prod" });

// Backend services
await alchemy.run("backend", async () => {
  const apiWorker = await Worker("api");
  const db = await D1Database("api-db");
});

// Frontend services
await alchemy.run("frontend", async () => {
  const siteWorker = await Worker("site");
  const assets = await R2Bucket("assets");
});

// Analytics services
await alchemy.run("analytics", async () => {
  const analyticsWorker = await Worker("analytics");
  const metricsDb = await D1Database("metrics");
});
```

---

### 4. Resource Scope

**Purpose:** Encapsulate child resources within custom resources

**Creation:**
```typescript
// Implicit via Resource()
const customResource = await CustomResource("my-resource");
```

**Characteristics:**
- Managed as single unit
- Child resources inherit lifecycle
- Automatic cleanup with parent
- State directory: `.alchemy/my-app/<stage>/my-resource/`

**Use Cases:**
- Custom resource patterns
- Composite resources
- Reusable components

**Example:**
```typescript
// Custom resource with child resources
class ApiStack extends Resource {
  async create() {
    this.worker = await Worker("api-worker");
    this.db = await D1Database("api-db");
    this.kv = await KVNamespace("api-cache");
    
    return {
      workerUrl: this.worker.url,
      dbId: this.db.id
    };
  }
  
  async destroy() {
    // All child resources destroyed automatically
  }
}

const apiStack = await ApiStack("api-stack");
```

---

### 5. Test Scope

**Purpose:** Create temporary, isolated scopes for testing

**Creation:**
```typescript
await alchemy.test(import.meta, async () => {
  // Test resources here
});
```

**Characteristics:**
- Ephemeral (no persistent state)
- Automatic cleanup post-test
- Isolated from other scopes
- No state directory (temporary)

**Use Cases:**
- Unit testing
- Integration testing
- Temporary resource creation

**Example:**
```typescript
// Test with automatic cleanup
await alchemy.test(import.meta, async () => {
  const testDb = await D1Database("test-db");
  const testKv = await KVNamespace("test-kv");
  
  // Run tests...
  
  // Resources automatically destroyed after test
});

// Test with custom configuration
await alchemy.test(import.meta, {
  stage: "test",
  destroyStrategy: "parallel"
}, async () => {
  const worker = await Worker("test-worker");
  // Test worker...
});
```

---

## 🔄 Lifecycle Management

### Finalization (Garbage Collection)

**How It Works:**
1. Reads current `alchemy.run.ts` (desired state)
2. Compares with `.alchemy/` state files (actual state)
3. Identifies removed resources
4. Deletes orphaned resources

**Triggers:**

| Scope Type | Trigger | Automatic? |
|------------|---------|------------|
| Application | `await app.finalize()` | No (manual) |
| Nested | End of `alchemy.run()` block | Yes |
| Test | End of `alchemy.test()` block | Yes |

**Example:**
```typescript
const app = await alchemy("my-app");

// Create resources
const worker1 = await Worker("worker-1");
const worker2 = await Worker("worker-2");

// Later: remove worker2 from code
// const worker1 = await Worker("worker-1");
// worker2 is now orphaned

// Finalization detects and deletes worker2
await app.finalize();
```

---

### Destroy Strategies

**Sequential (Default):**
- Deletes resources one-by-one
- Reliable, handles dependencies
- Slower for large applications

**Parallel:**
- Deletes resources concurrently
- Faster for CI/CD cleanup
- Best for independent resources

**Configuration:**
```typescript
// Sequential (default)
const app = await alchemy("my-app", {
  stage: "prod",
  destroyStrategy: "sequential"
});

// Parallel (faster)
const app = await alchemy("my-app", {
  stage: "pr-123",
  destroyStrategy: "parallel"  // Fast cleanup for ephemeral stages
});
```

**When to Use:**
- **Sequential:** Production, resources with dependencies
- **Parallel:** PR previews, test environments, independent resources

---

### State Files

**Location:** `.alchemy/` directory

**Structure:**
```
.alchemy/
└── my-app/
    ├── alice/              # $USER stage (local dev)
    │   ├── state.json
    │   └── backend/
    │       └── state.json
    ├── pr-123/             # PR preview stage
    │   └── state.json
    └── prod/               # Production stage
        ├── state.json
        └── backend/
            └── state.json
```

**State File Contents:**
```json
{
  "resources": {
    "worker-my-worker": {
      "type": "Worker",
      "id": "abc123",
      "name": "my-worker",
      "created_at": "2025-10-27T00:00:00Z"
    },
    "d1-my-db": {
      "type": "D1Database",
      "id": "def456",
      "name": "my-db",
      "created_at": "2025-10-27T00:00:00Z"
    }
  },
  "version": "1.0",
  "last_updated": "2025-10-27T01:00:00Z"
}
```

---

## 🔄 Integration with Alchemy Workflow

### Local Development

```bash
# Start local dev
alchemy dev

# Uses:
# - Stage: $USER
# - Profile: default
# - State: .alchemy/my-app/$USER/
```

**Scope Behavior:**
- Application scope: `my-app`
- Stage scope: `$USER` (e.g., `alice`)
- Automatic nested scope cleanup
- Miniflare emulation (no real cloud resources)

---

### CI/CD PR Preview

```bash
# Deploy PR preview
alchemy deploy --stage pr-123 --profile ci

# Uses:
# - Stage: pr-123
# - Profile: ci
# - State: .alchemy/my-app/pr-123/
```

**Scope Behavior:**
- Application scope: `my-app`
- Stage scope: `pr-123`
- Real cloud resources
- Parallel destroy on PR close

**GitHub Actions:**
```yaml
# Deploy preview
- run: alchemy deploy --stage pr-${{ github.event.pull_request.number }} --profile ci

# Cleanup on PR close
- run: alchemy destroy --stage pr-${{ github.event.pull_request.number }} --profile ci --force
```

---

### Production Deployment

```bash
# Deploy to production
alchemy deploy --stage prod --profile prod

# Uses:
# - Stage: prod
# - Profile: prod
# - State: .alchemy/my-app/prod/
```

**Scope Behavior:**
- Application scope: `my-app`
- Stage scope: `prod`
- Real cloud resources
- Sequential destroy (reliable)
- Manual finalization

---

## 🛡️ Security Integration

### Profile + Scope Isolation

**Scopes** provide logical isolation (resources).  
**Profiles** provide security isolation (credentials).

**Example:**
```typescript
// CI profile can only access pr-XXX stages
alchemy deploy --stage pr-123 --profile ci  // ✅ Allowed

// CI profile cannot access prod stage
alchemy deploy --stage prod --profile ci    // ❌ Denied

// Prod profile can access prod stage
alchemy deploy --stage prod --profile prod  // ✅ Allowed
```

**Enforcement:**
```typescript
const app = await alchemy("my-app", {
  stage: "prod",
  profile: "prod",
  stageProfileMapping: {
    "pr-*": ["ci"],           // PR stages use ci profile
    "prod": ["prod"],         // Prod stage uses prod profile
    "$USER": ["default"]      // Dev stages use default profile
  }
});
```

---

## 💡 Practical Examples

### Example 1: Multi-Service Application

```typescript
const app = await alchemy("my-app", { 
  stage: process.env.STAGE || process.env.USER 
});

// API Backend
await alchemy.run("api", async () => {
  const apiWorker = await Worker("api-worker", {
    script: "./src/api/index.ts"
  });
  
  const apiDb = await D1Database("api-db");
  const apiCache = await KVNamespace("api-cache");
});

// Frontend
await alchemy.run("frontend", async () => {
  const siteWorker = await Worker("site-worker", {
    script: "./src/frontend/index.ts"
  });
  
  const assets = await R2Bucket("site-assets");
});

// Background Jobs
await alchemy.run("jobs", async () => {
  const jobQueue = await Queue("job-queue");
  const jobWorker = await Worker("job-worker", {
    script: "./src/jobs/index.ts"
  });
});
```

---

### Example 2: PR Preview with Cleanup

```typescript
// alchemy.run.ts
const prNumber = process.env.PR_NUMBER;
const stage = prNumber ? `pr-${prNumber}` : process.env.USER;

const app = await alchemy("my-app", {
  stage,
  profile: prNumber ? "ci" : "default",
  destroyStrategy: prNumber ? "parallel" : "sequential"
});

// Resources...
```

**GitHub Actions:**
```yaml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: alchemy deploy --stage pr-${{ github.event.pull_request.number }} --profile ci
        env:
          PR_NUMBER: ${{ github.event.pull_request.number }}

  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: alchemy destroy --stage pr-${{ github.event.pull_request.number }} --profile ci --force
```

---

### Example 3: Testing with Scopes

```typescript
// tests/integration.test.ts
import { alchemy } from "alchemy";
import { describe, it, expect } from "vitest";

describe("API Integration", () => {
  it("should create and query database", async () => {
    await alchemy.test(import.meta, async () => {
      // Create test resources
      const db = await D1Database("test-db");
      const worker = await Worker("test-worker");
      
      // Test operations
      await db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY)");
      const result = await db.query("SELECT * FROM users");
      
      expect(result.rows).toEqual([]);
      
      // Resources automatically destroyed after test
    });
  });
});
```

---

## 🔍 Troubleshooting

### Issue 1: State File Conflicts

**Symptom:**
```
Error: State file locked by another process
```

**Cause:** Multiple CI jobs writing to same stage simultaneously

**Solution:**
```typescript
// Use unique stages per CI job
const stage = `pr-${PR_NUMBER}-${JOB_ID}`;

// Or implement state file locking
const app = await alchemy("my-app", {
  stage: "pr-123",
  stateLocking: true  // Enable file locking
});
```

---

### Issue 2: Orphaned Resources

**Symptom:** Resources exist in cloud but not in state files

**Cause:** Deployment failed mid-way or state file deleted

**Solution:**
```bash
# Adopt existing resources
alchemy deploy --adopt --stage prod

# Or manually clean up
alchemy destroy --stage prod --force
```

---

### Issue 3: Test Scope Leakage

**Symptom:** Test resources persist after test failure

**Cause:** Test crashed before cleanup

**Solution:**
```typescript
// Ensure cleanup with try/finally
await alchemy.test(import.meta, async () => {
  const db = await D1Database("test-db");
  
  try {
    // Test operations...
  } finally {
    // Cleanup happens automatically
    // But you can add explicit cleanup if needed
  }
});
```

---

## 📚 Related Documentation

- [Alchemy Workflow Primer](../alchemy-workflow-primer.md) - Core workflow concepts
- [Alchemy CLI Reference](../alchemy-cli-reference.md) - Complete CLI documentation
- [Alchemy Profile System](./alchemy-profiles.md) - Security & credentials
- [Stage Management Guide](./stage-management.md) - Managing stages
- [CI/CD Integration](./ci-cd-integration.md) - Automating deployments

---

## 🔗 Related RFCs

- [ALC-RFC-001: tgk Core Control Plane](../../docs/ALC-RFC-001-tgk-core.md) - Automation principles
- [ALC-RFC-002: Telegram Forum Polish](../../docs/ALC-RFC-002-forum-polish.md) - Governance automation
- [ALC-RFC-004: Advanced Governance](../../docs/ALC-RFC-004-advanced-governance.md) - Enterprise governance

---

## ❓ FAQ

### Q: What's the difference between a scope and a stage?
**A:** A **stage** is a type of scope that isolates environments (dev, prod, pr-XXX). All stages are scopes, but not all scopes are stages (e.g., nested scopes).

### Q: When should I use nested scopes?
**A:** Use nested scopes to organize related resources (service layers, components) and enable automatic cleanup when the scope completes.

### Q: How do I clean up a specific nested scope?
**A:** Nested scopes clean up automatically when their `alchemy.run()` block completes. For manual cleanup, use `await scope.finalize()` if exposed.

### Q: Can I have multiple stages in one deployment?
**A:** No, each deployment targets one stage. Use separate `alchemy deploy` commands for multiple stages.

### Q: What happens to state files when I destroy a stage?
**A:** State files are deleted along with the resources. Backup state files before destroying if you need to restore.

---

## 🚀 Next Steps

1. **Understand the hierarchy:**
   - Application → Stage → Nested → Resource → Test

2. **Use appropriate scopes:**
   - Local dev: `$USER` stage
   - PR preview: `pr-XXX` stage
   - Production: `prod` stage

3. **Enable automatic cleanup:**
   - Use nested scopes for service organization
   - Use test scopes for testing
   - Configure `destroyStrategy: "parallel"` for CI/CD

4. **Monitor state files:**
   - Check `.alchemy/` directory structure
   - Verify state files match deployed resources
   - Clean up orphaned state files

---

**🎉 Your scopes are now organized for reliable, isolated deployments!**

For questions or issues, see [Troubleshooting](#-troubleshooting) or open an issue on GitHub.
