# Cloudflare Provider for Alchemy

This provider enables you to deploy and manage Cloudflare infrastructure using Alchemy's TypeScript-native Infrastructure as Code framework.

## Resources

### Website
Deploys a full-stack application to Cloudflare Workers with D1 database, R2 storage, KV cache, and optional Durable Objects.

```typescript
import { Website } from "alchemy/cloudflare";

const website = await Website("my-app", {
  name: "my-app",
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend",
  database: true,  // D1 database
  storage: true,   // R2 bucket  
  cache: true,     // KV namespace
  chat: false,     // Durable Object for WebSocket chat
  workflow: false, // Cloudflare Workflows
});
```

### D1Database
Creates and manages Cloudflare D1 SQL databases.

```typescript
import { D1Database } from "alchemy/cloudflare";

const database = await D1Database("my-db", {
  name: "my-database",
  migrationsPath: "./migrations",
});
```

### R2Bucket
Creates and manages Cloudflare R2 object storage buckets.

```typescript
import { R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("my-storage", {
  name: "my-bucket",
});
```

### KVNamespace
Creates and manages Cloudflare KV key-value storage namespaces.

```typescript
import { KVNamespace } from "alchemy/cloudflare";

const kv = await KVNamespace("my-cache", {
  name: "my-kv-namespace",
});
```

### DurableObjectNamespace
Creates and manages Durable Object namespaces for stateful applications.

```typescript
import { DurableObjectNamespace } from "alchemy/cloudflare";

const chatDO = await DurableObjectNamespace("chat", {
  name: "ChatDO",
  className: "ChatRoom",
  scriptPath: "./src/chat/durable-object.ts",
});
```

### Queue
Creates and manages Cloudflare Queues for asynchronous message processing.

```typescript
import { Queue } from "alchemy/cloudflare";

const queue = await Queue("my-queue", {
  name: "my-queue",
});
```

### Workflow
Creates and manages Cloudflare Workflows for multi-step orchestration.

```typescript
import { Workflow } from "alchemy/cloudflare";

const workflow = await Workflow("my-workflow", {
  name: "MyWorkflow",
  definitionPath: "./src/workflows/definition.ts",
});
```

## Features

- **TypeScript Native**: Full type safety and IntelliSense support
- **Local Development**: Built-in Miniflare support for local testing
- **Hot Reload**: Automatic reloading during development
- **Database Migrations**: Integrated Drizzle ORM migrations
- **Asset Optimization**: Automatic CSS/JS bundling and minification
- **Environment Management**: Separate stages for development and production
- **Preview Deployments**: Automatic preview URLs for pull requests

## Quick Start

1. **Install Dependencies**
   ```bash
   bun i
   ```

2. **Configure Environment**
   ```bash
   # Cloudflare credentials
   export CLOUDFLARE_ACCOUNT_ID=your_account_id
   export CLOUDFLARE_API_TOKEN=your_api_token
   
   # Alchemy configuration
   export ALCHEMY_PASSWORD=your_password
   export ALCHEMY_STATE_TOKEN=your_token
   ```

3. **Start Development**
   ```bash
   bun run alchemy:dev
   ```

4. **Deploy to Production**
   ```bash
   bun run deploy:prod
   ```

## API Design

This provider follows Alchemy's API design principles:

- **Minimal Abstraction**: Thin wrappers around Cloudflare's REST APIs
- **Explicit Path Construction**: API paths built explicitly at call sites
- **Direct HTTP Status Handling**: Status codes checked directly
- **Explicit JSON Parsing**: Responses parsed explicitly where needed
- **Public Properties**: All API properties exposed publicly
- **Minimal Error Transformation**: Original error details preserved

## Examples

### Full-Stack Application
```typescript
import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";

const app = await alchemy("my-fullstack-app");

// Deploy a complete application
const website = await Website("app", {
  name: "my-fullstack-app",
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend/dist",
  database: true,
  storage: true,
  cache: true,
  chat: true,  // Enable real-time chat
});

console.log(`Application deployed at: ${website.url}`);
await app.finalize();
```

### Database-First Setup
```typescript
import alchemy from "alchemy";
import { D1Database, Website } from "alchemy/cloudflare";

const app = await alchemy("my-db-app");

// Create database first
const database = await D1Database("db", {
  name: "my-app-db",
  migrationsPath: "./migrations",
});

// Then deploy app with database binding
const website = await Website("app", {
  name: "my-db-app",
  scriptPath: "./src/backend/server.ts",
  database: database,  // Explicit database binding
});

console.log(`Database: ${database.name}`);
console.log(`Website: ${website.url}`);
await app.finalize();
```

### Multi-Environment Setup
```typescript
import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";

const app = await alchemy("my-app");

const devWebsite = await Website("app", {
  name: "my-app-dev",
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend",
  stage: "dev",  // Development stage
});

const prodWebsite = await Website("app", {
  name: "my-app-prod", 
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend",
  stage: "prod",  // Production stage
});

console.log(`Dev: ${devWebsite.url}`);
console.log(`Prod: ${prodWebsite.url}`);
await app.finalize();
```

## Testing

The provider includes comprehensive tests following Alchemy's testing best practices:

```bash
# Run all tests
bun test

# Run integration tests
bun test:integration

# Run specific test
bun vitest run ./src/tests/integration.test.ts -t "should create and deploy website"
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.

## License

Apache-2.0 - see [LICENSE](../LICENSE) for details.
