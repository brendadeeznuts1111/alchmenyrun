# Alchemy Scope System

The Alchemy Scope System provides hierarchical resource management and isolation for Cloudflare infrastructure deployments. It enables safe concurrent deployments, automatic cleanup of orphaned resources, and organized state management across different environments.

## Overview

The scope system organizes your infrastructure into a hierarchical structure that mirrors your application's architecture:

```
Application (my-app)
├── Stage (prod)
│   ├── Nested (database)
│   │   ├── Resource (db-main)
│   │   └── Resource (db-cache)
│   ├── Nested (compute)
│   │   └── Resource (worker-api)
│   └── Nested (storage)
│       └── Resource (bucket-files)
├── Stage (dev)
│   └── Nested (backend)
│       └── Resource (worker-dev)
└── Test (pr-123)
    └── Resource (test-db)
```

## Scope Hierarchy Types

### Application Scope
**Purpose:** Root container for an entire application  
**Creation:** `await alchemy("my-app")`  
**State Path:** `.alchemy/my-app/`  
**Lifetime:** Application deployment

Application scopes contain all resources for a single application and provide the top-level isolation boundary.

### Stage Scope
**Purpose:** Environment isolation (prod, dev, staging)  
**Creation:** `await alchemy("my-app", { stage: "prod" })`  
**State Path:** `.alchemy/my-app/prod/`  
**Lifetime:** Environment deployment

Stage scopes isolate different deployment environments, preventing conflicts between production and development resources.

### Nested Scope
**Purpose:** Logical grouping of related resources  
**Creation:** `await alchemy.run("database", async () => { ... })`  
**State Path:** `.alchemy/my-app/prod/database/`  
**Lifetime:** Scoped operation

Nested scopes group related resources (database, compute, storage) and provide focused cleanup boundaries.

### Resource Scope
**Purpose:** Individual resource encapsulation  
**Creation:** Automatic (per resource)  
**State Path:** `.alchemy/my-app/prod/database/resources/worker-api/`  
**Lifetime:** Resource lifetime

Resource scopes are created automatically for each resource and provide individual resource isolation.

### Test Scope
**Purpose:** Isolated testing with automatic cleanup  
**Creation:** `alchemy.test(import.meta, { prefix: "branch" }, async () => { ... })`  
**State Path:** `.alchemy/my-app/test/test-id/`  
**Lifetime:** Test execution

Test scopes provide isolated environments for testing with guaranteed cleanup.

## Lifecycle & Cleanup

### Scope Creation Flow

1. **Application Scope**: Created first, establishes root state directory
2. **Stage Scope**: Created within application, adds environment isolation
3. **Nested Scopes**: Created within stages, group related resources
4. **Resource Scopes**: Auto-created for each resource
5. **Test Scopes**: Created on-demand for testing

### Finalization Process

Finalization occurs in reverse order of creation:

1. **Resource Cleanup**: Individual resources are destroyed
2. **Nested Scope GC**: Orphaned resources in nested scopes are cleaned
3. **Stage Scope GC**: Orphaned resources in stage scopes are cleaned
4. **Application Scope GC**: Application-level orphaned resources are cleaned

### Garbage Collection Strategy

The scope system implements intelligent garbage collection:

```typescript
// Compare current resources with state
const currentResources = new Set(['worker-api', 'db-main']);
const stateResources = await stateManager.getResources('my-app/prod');

// Find orphaned resources (in state but not current)
const orphaned = stateResources.filter(id => !currentResources.has(id));

// Destroy orphaned resources
for (const orphanId of orphaned) {
  await destroyResource(orphanId);
}
```

### Destruction Strategies

Choose the appropriate strategy for your use case:

- **Sequential**: One-by-one destruction (default, safest)
- **Parallel**: Concurrent destruction (fastest for CI)
- **Batched**: Process in configurable batches (balanced)

```typescript
await scope.finalize({
  strategy: 'parallel',    // 'sequential' | 'parallel' | 'batched'
  maxRetries: 3,           // Retry failed destructions
  retryDelay: 1000,        // Base delay between retries
  dryRun: false            // Preview without destroying
});
```

## Integration with Workflow

### Basic Application Structure

```typescript
// alchemy.run.ts
const app = await alchemy("my-app", {
  phase: "up",
  password: process.env.ALCHEMY_PASSWORD
});

// Stage-specific deployment
await alchemy.run("database", async () => {
  const db = await Database("main-db", {
    adopt: true,
    apiToken: cfToken
  });

  resources.db = db;
});

await alchemy.run("compute", async () => {
  const worker = await Worker("api", {
    entrypoint: "src/server.ts",
    bindings: {
      DB: resources.db
    }
  });

  resources.worker = worker;
});

// Finalize and cleanup
await app.finalize();
```

### Multi-Environment Deployment

```typescript
// Deploy to production
const prodApp = await alchemy("my-app", { stage: "prod" });

// Deploy to development
const devApp = await alchemy("my-app", { stage: "dev" });

// Each stage is completely isolated
await prodApp.finalize(); // Only affects prod resources
await devApp.finalize();  // Only affects dev resources
```

### Testing with Isolated Scopes

```typescript
// Run tests in isolated scope
await alchemy.test(import.meta, {
  prefix: "feature-branch",
  autoCleanup: true
}, async (testScope) => {
  // Create test resources
  const testDb = await Database("test-db", {
    // Test-specific configuration
  });

  // Run tests
  await runTestSuite();

  // Automatic cleanup happens here
});
```

## State Management

### State File Structure

```
.alchemy/
├── my-app/
│   ├── state.json              # Application-level state
│   ├── prod/
│   │   ├── state.json          # Production state
│   │   ├── database/
│   │   │   ├── state.json      # Database scope state
│   │   │   └── resources/
│   │   │       └── db-main/
│   │   │           └── state.json
│   │   └── compute/
│   │       └── state.json      # Compute scope state
│   └── dev/
│       └── state.json          # Development state
└── locks/
    ├── my-app.lock             # Application-level lock
    ├── my-app/prod.lock        # Production lock
    └── my-app/prod/database.lock
```

### Distributed Locking

The scope system uses distributed locking to prevent CI job conflicts:

```typescript
// Automatic locking during state operations
await stateManager.saveState(scopePath, stateData);
// Lock is acquired automatically, released on completion

// Manual lock management
const locked = await stateManager.acquireLock(scopePath, 30000);
if (locked) {
  try {
    // Perform state operations
  } finally {
    await stateManager.releaseLock(scopePath);
  }
}
```

### State Backups

State files are automatically versioned with timestamps:

```
.alchemy/my-app/prod/backups/
├── state-2024-01-15T10-30-00-000Z.json
├── state-2024-01-15T11-00-00-000Z.json
└── state-2024-01-15T11-30-00-000Z.json
```

## Configuration Options

### Scope Options

```typescript
interface ScopeOptions {
  // State management
  stateDir?: string;           // Custom state directory
  enableLocking?: boolean;     // Enable distributed locking
  lockTimeout?: number;        // Lock acquisition timeout

  // Finalization
  destroyStrategy?: 'sequential' | 'parallel' | 'batched';
  maxRetries?: number;          // Max retry attempts
  retryDelay?: number;          // Base retry delay
  continueOnError?: boolean;    // Continue on destruction errors

  // Resource management
  adopt?: boolean;              // Adopt existing resources
  force?: boolean;              // Force operations

  // Logging and debugging
  verbose?: boolean;            // Verbose logging
  quiet?: boolean;              // Suppress logs
}
```

### Environment Variables

```bash
# State management
ALCHEMY_STATE_DIR=".alchemy"          # State directory
ALCHEMY_LOCK_TIMEOUT="30000"          # Lock timeout (ms)

# Cloud storage (for team collaboration)
R2_ACCESS_KEY_ID="..."                # R2 access key
R2_SECRET_ACCESS_KEY="..."            # R2 secret key
R2_BUCKET_NAME="alchemy-state"        # R2 bucket for state

# Finalization
ALCHEMY_DESTROY_STRATEGY="parallel"   # Default destroy strategy
ALCHEMY_MAX_RETRIES="3"               # Max retry attempts
```

## Troubleshooting

### Common Issues

#### "Failed to acquire lock" Error

**Symptom:** Deployments fail with lock acquisition timeout

**Causes:**
- Concurrent deployments to same scope
- Stale locks from crashed processes
- Network issues with cloud storage

**Solutions:**
```bash
# Force release stale locks
alchemy scope unlock my-app/prod

# Check active locks
alchemy scope list-locks

# Increase lock timeout
ALCHEMY_LOCK_TIMEOUT=60000 bun run deploy
```

#### Orphaned Resources Not Cleaned

**Symptom:** Resources remain after deployment

**Causes:**
- State file corruption
- Destruction failures not properly handled
- Resources removed from code but state not updated

**Solutions:**
```bash
# Manual cleanup
alchemy scope cleanup my-app/prod --force

# Check state file integrity
alchemy scope validate my-app/prod

# Force state reset (dangerous!)
alchemy scope reset my-app/prod
```

#### State File Corruption

**Symptom:** Invalid JSON in state files

**Causes:**
- Interrupted writes during deployment
- Disk space issues
- Concurrent modifications

**Solutions:**
```bash
# Restore from backup
alchemy scope restore my-app/prod --backup state-2024-01-15T10-30-00-000Z.json

# Recreate state from current resources
alchemy scope rebuild my-app/prod
```

### Debugging Commands

```bash
# Inspect scope hierarchy
alchemy scope inspect my-app/prod

# View state file contents
alchemy scope state my-app/prod

# List all active scopes
alchemy scope list

# Check lock status
alchemy scope locks

# Validate state integrity
alchemy scope validate my-app

# View finalization logs
alchemy scope logs my-app/prod
```

### Performance Optimization

#### For CI/CD Pipelines

```typescript
// Use parallel destruction for speed
await scope.finalize({
  strategy: 'parallel',
  maxRetries: 2,  // Fewer retries for speed
  timeout: 30000   // Shorter timeout
});
```

#### For Large Deployments

```typescript
// Use batched destruction to avoid API limits
await scope.finalize({
  strategy: 'batched',
  batchSize: 5,    // Smaller batches
  retryDelay: 2000 // Longer delays
});
```

## Migration Guide

### From Flat State Management

**Before:**
```typescript
// Single state file for everything
const state = await loadState('.alchemy/state.json');
```

**After:**
```typescript
// Hierarchical scopes
const app = await alchemy('my-app');
const stage = await alchemy('my-app', { stage: 'prod' });

// Automatic state isolation
await stage.finalize(); // Only affects prod resources
```

### From Manual Cleanup

**Before:**
```typescript
// Manual resource tracking
const created = [];
// ... create resources ...
// Manual cleanup on error
for (const resource of created) {
  await destroy(resource);
}
```

**After:**
```typescript
// Automatic cleanup via scopes
await alchemy.run('deployment', async () => {
  const db = await Database('main');
  const worker = await Worker('api');
  // Automatic cleanup if scope fails
});
```

## API Reference

### Core Functions

#### `alchemy(appName, options?)`
Creates application or stage scope.

#### `alchemy.run(scopeName, fn, options?)`
Runs function within nested scope.

#### `alchemy.test(meta, options?, fn)`
Runs function within test scope with automatic cleanup.

### Scope Methods

#### `scope.finalize(options?)`
Finalizes scope and cleans up orphaned resources.

#### `scope.registerResource(id)`
Registers a resource with the scope.

#### `scope.hasResource(id)`
Checks if resource is registered.

### State Management

#### `StateManager.saveState(path, state)`
Saves state with locking.

#### `StateManager.getResources(path)`
Gets all resources in scope.

#### `StateManager.acquireLock(path, timeout?)`
Acquires distributed lock.

## Related RFCs

- [RFC-005: Micro Rollback Telemetry](./micro-rfc-005.md)
- [RFC-006: AI Orchestration](./micro-rfc-006.md)
- [Scope System Architecture](../../ARCHITECTURE.md#scope-system)

---

## Quick Start

1. **Create your first scope:**
   ```typescript
   const app = await alchemy("my-app");
   ```

2. **Add environment isolation:**
   ```typescript
   const prod = await alchemy("my-app", { stage: "prod" });
   ```

3. **Group related resources:**
   ```typescript
   await alchemy.run("database", async () => {
     const db = await Database("main");
   });
   ```

4. **Finalize and cleanup:**
   ```typescript
   await app.finalize();
   ```

The scope system handles the rest automatically!
