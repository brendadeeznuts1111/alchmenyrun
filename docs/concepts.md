# Alchemy Concepts in This Project

This guide explains how this project implements Alchemy's core concepts: Apps & Stages, Scope, Phase, Secret, Bindings, and Resources.

## 🏗️ Apps & Stages

### What are Apps & Stages?

An **Alchemy App** is a collection of Stages where each deployed Stage is an isolated copy of your Resources including Workers, Databases, Queues, etc.

### Scope Hierarchy

This project implements Alchemy's hierarchical scope structure:

```
cloudflare-demo (Application Scope)
├── $USER/ (Stage Scope - your username)
│   ├── database/ (Nested Scope)
│   │   └── db.json
│   ├── storage/ (Nested Scope)
│   │   ├── storage.json
│   │   ├── cache.json
│   │   └── mcp-kv.json
│   ├── compute/ (Nested Scope)
│   │   ├── jobs.json
│   │   ├── ChatDO.json
│   │   └── OnboardingWorkflow.json
│   └── website.json (Resource)
└── prod/ (Stage Scope - production)
    └── [same structure as above]
```

### App Structure

```typescript
// alchemy.run.ts
import alchemy from "alchemy";

// Application Scope - Root level
const app = await alchemy("cloudflare-demo"); // App name

// Nested Scopes - Organized by function
await alchemy.run("database", async () => {
  const db = await D1Database("db", { ... });
});

await alchemy.run("storage", async () => {
  const storage = await R2Bucket("storage", { ... });
  const cache = await KVNamespace("cache", { ... });
});

await alchemy.run("compute", async () => {
  const jobs = await Queue("jobs", { ... });
  const workflow = await Workflow("workflow", { ... });
});

// Resource in application scope
export const website = await BunSPA("website", { ... });

// Clean up unused resources
await app.finalize();
```

### Stage Management

Each App contains multiple Stages with isolated infrastructure:

```bash
# Default stage (your username)
bun run deploy

# Specific stage
bun run deploy --stage prod

# Pull request stage (automatically created)
bun run deploy --stage pr-123
```

### Recommended Setup

This project follows the recommended team setup:

1. **Personal Stage** - Each developer uses `bun run deploy` (defaults to `$USER` stage)
2. **Pull Request Stage** - Each PR deploys to `pr-${number}` stage automatically
3. **Production Stage** - Main branch deploys to `prod` stage

### Stage Examples

```bash
# Development (personal stage)
bun run alchemy:dev        # Uses your username as stage
bun run deploy            # Deploys to your personal stage

# Production
bun run deploy:prod       # Deploys to prod stage

# Pull Request (automated)
bun run deploy --stage pr-123  # Deploys to PR stage

# Cleanup
bun run destroy           # Cleans up your personal stage
bun run destroy:prod      # Cleans up production stage
```

### Resource Naming

Resources are automatically named with the pattern: `${app}-${stage}-${id}`

```typescript
const app = await alchemy("cloudflare-demo");
const worker = await Worker("api");
console.log(worker.name); // "cloudflare-demo-api-${stage}"
```

## 📁 Scope

### What is Scope?

Scope in Alchemy provides hierarchical organization of infrastructure resources. Each scope level manages its own state and resource lifecycle.

### Scope Types

#### 1. Application Scope
The root scope created with `alchemy()`:
```typescript
const app = await alchemy("cloudflare-demo");
```
- **State Directory**: `.alchemy/cloudflare-demo/`
- **Purpose**: Root container for all stages and resources
- **Finalization**: Manual (requires `await app.finalize()`)

#### 2. Stage Scope
Environment-specific scopes under the application:
```typescript
// Implicit stage (your username)
const app = await alchemy("cloudflare-demo");

// Explicit stage
const app = await alchemy("cloudflare-demo", { stage: "prod" });
```
- **State Directory**: `.alchemy/cloudflare-demo/$USER/` or `.alchemy/cloudflare-demo/prod/`
- **Purpose**: Environment isolation (dev, prod, pr-123, etc.)
- **Finalization**: Manual

#### 3. Nested Scope
Custom organization scopes created with `alchemy.run()`:
```typescript
await alchemy.run("database", async () => {
  const db = await D1Database("db", { ... });
});
```
- **State Directory**: `.alchemy/cloudflare-demo/$USER/database/`
- **Purpose**: Logical grouping of related resources
- **Finalization**: Automatic

#### 4. Resource Scope
Each resource gets its own scope:
```typescript
const db = await D1Database("db", { ... });
```
- **State Directory**: `.alchemy/cloudflare-demo/$USER/database/db.json`
- **Purpose**: Individual resource state management
- **Finalization**: Automatic

### Scope Benefits

#### 1. Organization
- **Logical Grouping**: Database, storage, compute resources grouped together
- **Clear Structure**: Easy to understand resource relationships
- **Maintainability**: Simplified code organization

#### 2. State Management
- **Isolated State**: Each scope manages its own state files
- **Independent Lifecycle**: Resources can be created/updated/deleted independently
- **Clean Cleanup**: Orphaned resources automatically detected and removed

#### 3. Resource Sharing
Resources created in nested scopes can be shared with other scopes:

```typescript
const resources = {} as any;

// Database scope creates resources
await alchemy.run("database", async () => {
  const db = await D1Database("db", { ... });
  resources.db = db; // Share with other scopes
});

// Storage scope uses shared resources
await alchemy.run("storage", async () => {
  const storage = await R2Bucket("storage", { ... });
  // Can access resources.db if needed
});
```

### Scope Finalization

#### Automatic Finalization
Nested scopes finalize automatically when execution completes:
```typescript
await alchemy.run("storage", async () => {
  const bucket = await R2Bucket("files", { ... });
  // Scope finalizes here - orphaned resources cleaned up
});
```

#### Manual Finalization
Application scopes need manual finalization:
```typescript
const app = await alchemy("my-app");
await Bucket("assets", {});

// Manual finalization required
await app.finalize(); // Deletes orphaned resources
```

### State Directory Structure

The complete state directory for this project:

```
.alchemy/
└── cloudflare-demo/           # Application scope
    ├── $USER/                 # Stage scope (your username)
    │   ├── database/          # Nested scope
    │   │   └── db.json        # Resource state
    │   ├── storage/           # Nested scope
    │   │   ├── storage.json   # Resource state
    │   │   ├── cache.json     # Resource state
    │   │   └── mcp-kv.json    # Resource state
    │   ├── compute/           # Nested scope
    │   │   ├── jobs.json      # Resource state
    │   │   ├── ChatDO.json    # Resource state
    │   │   └── OnboardingWorkflow.json # Resource state
    │   └── website.json       # Resource state
    └── prod/                  # Production stage scope
        └── [same structure as above]
```

## 🔄 Phase

### What is Phase?

Alchemy has three execution phases that determine how infrastructure resources are handled:

1. **"up"** - Resources are created, updated, and deleted as necessary (default)
2. **"destroy"** - All resources in the stage are deleted and execution stops
3. **"read"** - Runs the program but never creates, updates, or deletes resources

### Phase Usage in This Project

```typescript
// alchemy.run.ts
const app = await alchemy("cloudflare-demo", {
  phase: process.env.PHASE as "up" | "destroy" | "read" || "up",
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: (scope) => new CloudflareStateStore(scope),
});
```

### Phase Examples

```bash
# Default: Deploy infrastructure (up phase)
bun run deploy

# Destroy all resources
PHASE=destroy bun run deploy

# Read existing resources (no changes)
PHASE=read bun run deploy

# Use specific stage with destroy phase
PHASE=destroy bun run deploy --stage prod
```

### Read Phase for Scripts

The read phase is useful for build scripts that need infrastructure properties:

```typescript
// scripts/build.ts
import { exec } from "alchemy/os";
import { website } from "../alchemy.run";

// Get infrastructure properties without making changes
const backendUrl = website.url;

// Use in build commands
await exec("bun run build:frontend", {
  BACKEND_URL: backendUrl,
});
```

```bash
# Execute with read phase
PHASE=read bun ./scripts/build.ts
```

## 🔐 Secret

### What are Secrets?

Secrets in Alchemy are sensitive values that require special handling to prevent exposure in logs, state files, or source code. Examples include:

- API keys and tokens
- Passwords and credentials
- Private certificates
- Connection strings with credentials

### Secret Usage in This Project

```typescript
// alchemy.run.ts
export const website = await BunSPA("website", {
  bindings: {
    // Secret binding - encrypted in state
    API_KEY: alchemy.secret(process.env.API_KEY || "demo-key"),
  },
});
```

### Encryption Password

Secrets are encrypted using a password provided when initializing the Alchemy app:

```typescript
const app = await alchemy("cloudflare-demo", {
  password: process.env.ALCHEMY_PASSWORD, // Required for secrets
});
```

### Secret Storage

When stored in state, secrets are automatically encrypted:

```json
{
  "props": {
    "API_KEY": {
      "@secret": "Tgz3e/WAscu4U1oanm5S4YXH..."
    }
  }
}
```

### Accessing Secrets in Workers

```typescript
// src/backend/server.ts
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Access secret through environment
    const apiKey = env.API_KEY;
    
    // Use in API calls
    const response = await fetch("https://api.example.com", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    
    return response;
  },
};
```

## 🔗 Bindings

### What are Bindings?

Bindings allow resources to connect to each other in a type-safe way. In Alchemy, bindings are most commonly used with Cloudflare Workers to give them access to:

- Environment variables (non-sensitive strings)
- Secrets (sensitive strings)
- Resources like KV Namespaces, Durable Objects, R2 Buckets, etc.

### Binding Types

#### 1. Strings (Non-sensitive)

```typescript
bindings: {
  STAGE: "prod",
  VERSION: "1.0.0",
  DEBUG_MODE: "true",
}
```

#### 2. Secrets (Sensitive)

```typescript
bindings: {
  API_KEY: alchemy.secret(process.env.API_KEY),
  DATABASE_PASSWORD: alchemy.secret(process.env.DATABASE_PASSWORD),
}
```

#### 3. Resources (Infrastructure)

```typescript
bindings: {
  DB: db,                    // D1Database
  STORAGE: storage,          // R2Bucket
  CACHE: cache,              // KVNamespace
  CHAT: ChatDurableObject,   // DurableObjectNamespace
  WORKFLOW: OnboardingWorkflow, // Workflow
}
```

### Bindings in This Project

```typescript
// alchemy.run.ts
export const website = await BunSPA("website", {
  bindings: {
    // Resource bindings
    DB: db,
    STORAGE: storage,
    JOBS: jobs,
    CACHE: cache,
    CHAT: ChatDurableObject,
    WORKFLOW: OnboardingWorkflow,
    
    // Secret binding
    API_KEY: alchemy.secret(process.env.API_KEY || "demo-key"),
  },
});
```

### Type-Safe Bindings

We use type-safe bindings to ensure compile-time type checking:

```typescript
// src/env.d.ts
import type { website } from "../alchemy.run";

export type WorkerEnv = typeof website.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends WorkerEnv {}
  }
}
```

```typescript
// src/backend/server.ts
import type { WorkerEnv } from "../env.d.ts";

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Type-safe access to bindings
    const value = await env.CACHE.get("key");
    const apiKey = env.API_KEY;
    const users = await env.DB.prepare("SELECT * FROM users").all();
    
    return new Response(JSON.stringify({ value, apiKey, users }));
  },
};
```

## 🏗️ Resource

### What is a Resource?

A Resource is a memoized async function that implements lifecycle handlers for three phases:

1. **create** - What to do when first creating the resource
2. **update** - What to do when updating a resource
3. **delete** - What to do when deleting a resource

### Resource Properties

#### Resource ID

Each resource has a unique ID within its scope:

```typescript
const db = await D1Database("db", { ... });  // "db" is the resource ID
const storage = await R2Bucket("storage", { ... });  // "storage" is the ID
```

#### Input Props

Resources accept input properties:

```typescript
interface D1DatabaseProps {
  name: string;
  adopt?: boolean;
}

const db = await D1Database("db", {
  name: "alchemy-demo-db",  // Input property
  adopt: true,              // Input property
});
```

#### Output Attributes

Resources return output attributes:

```typescript
console.log(db.name);        // Physical name in Cloudflare
console.log(db.id);          // Resource ID
console.log(db.createdAt);   // Creation timestamp
```

#### Physical Name

Resources have physical names in the infrastructure provider:

```typescript
// Explicit physical name
const db = await D1Database("db", {
  name: "my-database",  // Physical name
});

// Generated physical name (default)
const app = await alchemy("my-app");
const db = await D1Database("db");
console.log(db.name);  // "my-app-db-${stage}"
```

### Resources in This Project

This project uses nested scopes to organize resources by function:

#### Database Scope
```typescript
// alchemy.run.ts
await alchemy.run("database", async () => {
  const db = await D1Database("db", {
    name: "alchemy-demo-db",
    adopt: true,
  });
  
  // Share with other scopes
  resources.db = db;
});
```

#### Storage Scope
```typescript
await alchemy.run("storage", async () => {
  const storage = await R2Bucket("storage", {
    name: "alchemy-demo-storage",
    adopt: true,
  });
  
  const cache = await KVNamespace("cache", {
    adopt: true,
  });
  
  const mcpKv = await KVNamespace("mcp-kv", {
    adopt: true,
  });
  
  // Share with other scopes
  resources.storage = storage;
  resources.cache = cache;
  resources.mcpKv = mcpKv;
});
```

#### Compute Scope
```typescript
await alchemy.run("compute", async () => {
  const jobs = await Queue("jobs", {
    name: "alchemy-demo-jobs",
    adopt: true,
  });
  
  const ChatDurableObject = await DurableObjectNamespace("ChatDO", {
    className: "ChatRoom",
    scriptName: "website",
  });
  
  const OnboardingWorkflow = await Workflow("OnboardingWorkflow", {
    workflowName: "OnboardingWorkflow",
    className: "OnboardingWorkflow",
    scriptName: "website",
  });
  
  // Share with other scopes
  resources.jobs = jobs;
  resources.ChatDurableObject = ChatDurableObject;
  resources.OnboardingWorkflow = OnboardingWorkflow;
});
```

#### Application Resource
```typescript
// Main website application (uses resources from nested scopes)
export const website = await BunSPA("website", {
  frontend: "src/frontend/index.html",
  entrypoint: "src/backend/server.ts",
  bindings: {
    // Resources from nested scopes
    DB: resources.db,
    STORAGE: resources.storage,
    CACHE: resources.cache,
    JOBS: resources.jobs,
    CHAT: resources.ChatDurableObject,
    WORKFLOW: resources.OnboardingWorkflow,
    
    // Secret binding
    API_KEY: alchemy.secret(process.env.API_KEY || "demo-key"),
  },
});
```

#### Worker Configuration Options

```typescript
await Worker("api", {
  // Basic configuration
  name: "api-worker",              // Worker name (defaults to ${app}-${stage}-${id})
  entrypoint: "./src/api.ts",      // Main entrypoint for bundling
  format: "esm",                   // Module format: 'esm' (default) or 'cjs'
  
  // Compatibility
  compatibilityDate: "2025-09-13", // Workers runtime version
  compatibilityFlags: ["nodejs_compat"],
  compatibility: "node",           // Compatibility preset
  
  // Development
  adopt: true,                     // Adopt existing Worker if present
  dev: {
    port: 8787,                   // Local development port
    tunnel: true,                  // Create Cloudflare Tunnel
    remote: false,                 // Run locally vs in Cloudflare
  },
  
  // Bindings
  bindings: {
    KV_STORE: kvNamespace,         // KV Namespace binding
    STORAGE: r2Bucket,             // R2 bucket binding
    API_KEY: alchemy.secret("key"), // Secret binding
    STAGE: "prod",                 // Plain text binding
  },
  
  // Observability
  observability: { enabled: true }, // Enable worker logs
  sourceMap: true,                 // Upload source maps
  
  // Performance
  limits: {
    cpu_ms: 50_000,               // Max CPU time in ms
  },
  placement: {
    mode: "smart",                 // Smart placement optimization
  },
  
  // Advanced
  routes: ["api.example.com/*"],   // Route patterns
  domains: ["example.com"],        // Custom domains
  crons: ["0 0 * * *"],           // Scheduled triggers
  assets: {                       // Static assets
    path: "./public",
    run_worker_first: false,
  },
});
```

#### Database Resource

```typescript
// D1 Database for user and file storage
const db = await D1Database("db", {
  name: "alchemy-demo-db",
  adopt: true, // Adopt existing database if it exists
});
```

#### Storage Resources

```typescript
// R2 Bucket for file storage
const storage = await R2Bucket("storage", {
  name: "alchemy-demo-storage",
  adopt: true,
});

// KV Namespace for caching
const cache = await KVNamespace("cache", {
  name: "alchemy-demo-cache",
  adopt: true,
});
```

#### Compute Resources

```typescript
// Durable Object for real-time chat
const ChatDurableObject = await DurableObjectNamespace("ChatDO", {
  name: "ChatDO",
  className: "ChatRoom",
  scriptPath: "./src/backend/durable-object.ts",
});

// Workflow for orchestration
const OnboardingWorkflow = await Workflow("OnboardingWorkflow", {
  name: "OnboardingWorkflow",
  className: "OnboardingWorkflow",
  scriptPath: "./src/backend/workflow.ts",
});
```

#### Application Resource

```typescript
// BunSPA for full-stack application
export const website = await BunSPA("website", {
  frontend: "src/frontend/index.html",
  entrypoint: "src/backend/server.ts",
  bindings: {
    // Connect resources through bindings
    DB: db,                    // Resource binding
    STORAGE: storage,          // Resource binding
    CACHE: cache,              // Resource binding
    CHAT: ChatDurableObject,   // Resource binding
    WORKFLOW: OnboardingWorkflow, // Resource binding
    API_KEY: alchemy.secret(process.env.API_KEY || "demo-key"), // Secret binding
  },
});
```

### Resource Lifecycle

#### Create Phase

```bash
# Create all resources
bun run deploy
```

#### Update Phase

```bash
# Update resources (if configuration changed)
bun run deploy
```

#### Delete Phase

```bash
# Delete all resources
PHASE=destroy bun run deploy
```

### Resource Adoption

The `adopt: true` option allows resources to adopt existing infrastructure:

```typescript
const db = await D1Database("db", {
  name: "alchemy-demo-db",
  adopt: true, // Use existing database if it exists
});
```

This is useful for:
- Migrating existing infrastructure to Alchemy
- Sharing resources across stages
- Preventing accidental resource deletion

## 🔄 Integration Examples

### Complete Resource Example

```typescript
// alchemy.run.ts
import alchemy from "alchemy";
import { D1Database, R2Bucket, BunSPA } from "alchemy/cloudflare";

const app = await alchemy("my-app", {
  phase: process.env.PHASE || "up",
  password: process.env.ALCHEMY_PASSWORD,
});

// Create resources
const db = await D1Database("db", {
  name: "my-app-db",
  adopt: true,
});

const storage = await R2Bucket("storage", {
  name: "my-app-storage",
  adopt: true,
});

// Bind resources to application
export const website = await BunSPA("website", {
  frontend: "src/index.html",
  entrypoint: "src/worker.ts",
  bindings: {
    DB: db,                    // Resource binding
    STORAGE: storage,          // Resource binding
    API_KEY: alchemy.secret(process.env.API_KEY), // Secret binding
    VERSION: "1.0.0",          // String binding
  },
});

await app.finalize();
```

### Worker with Type-Safe Bindings

```typescript
// src/worker.ts
import type { WorkerEnv } from "../env.d.ts";

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Type-safe access to all bindings
    const data = await env.DB.prepare("SELECT * FROM users").all();
    const files = await env.STORAGE.list();
    const cached = await env.CACHE.get("config");
    
    return new Response(JSON.stringify({
      users: data.results,
      files: files.objects,
      config: cached,
      version: env.VERSION,
    }));
  },
};
```

## 🎯 Best Practices

### Phase Best Practices

1. **Use "up" for normal deployments** (default)
2. **Use "destroy" for cleanup** with specific stages
3. **Use "read" for build scripts** and CI/CD
4. **Always specify phase explicitly** in scripts

### Secret Best Practices

1. **Always use `alchemy.secret()`** for sensitive values
2. **Never commit secrets** to version control
3. **Use environment variables** for secret values
4. **Rotate secrets regularly** in production

### Binding Best Practices

1. **Use type-safe bindings** with env.d.ts
2. **Group related bindings** logically
3. **Use descriptive binding names**
4. **Prefer resource bindings** over hardcoded values

### Resource Best Practices

1. **Use meaningful resource IDs**
2. **Enable adoption** for existing resources
3. **Use consistent naming** conventions
4. **Document resource purposes** in comments

## 🔗 Further Reading

- [Alchemy Phase Documentation](https://alchemy.run/concepts/phase/)
- [Alchemy Secret Documentation](https://alchemy.run/concepts/secret/)
- [Alchemy Bindings Documentation](https://alchemy.run/concepts/bindings/)
- [Alchemy Resource Documentation](https://alchemy.run/concepts/resource/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
