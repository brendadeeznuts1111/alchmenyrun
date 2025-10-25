# Architecture Overview

## System Architecture

This application demonstrates a modern full-stack architecture using Cloudflare's edge computing platform and Alchemy's TypeScript-native Infrastructure as Code.

## Components

### Frontend (BunSPA)

- **Technology**: React + TypeScript
- **Build Tool**: Bun
- **Features**:
  - Hot Module Replacement (HMR)
  - Tailwind CSS for styling
  - Real-time WebSocket connections
  - File upload with progress tracking

### Backend (Cloudflare Workers)

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Language**: TypeScript
- **API Routes**:
  - `/api/health` - Health check
  - `/api/users` - User CRUD operations
  - `/api/upload` - File upload to R2
  - `/api/files/:id` - File retrieval
  - `/api/cache/:key` - KV cache operations
  - `/api/chat` - WebSocket upgrade
  - `/api/workflow/start` - Workflow trigger

### Data Layer

#### D1 Database (SQLite)
- **ORM**: Drizzle
- **Tables**:
  - `users` - User accounts
  - `files` - File metadata
- **Migrations**: Version-controlled SQL

#### R2 Storage
- File object storage
- Public and private file access
- Integration with Worker for direct serving

#### KV Namespace
- High-performance edge caching
- Key-value data storage
- Global read distribution

### Async Processing

#### Queue
- Job processing system
- Triggers:
  - User creation → welcome email job
  - File upload → processing job

#### Workflows
- Multi-step durable orchestration
- Ensures workflow completion
- Steps:
  1. Validate user data
  2. Create user profile
  3. Send welcome email
  4. Initialize settings

### Real-time Communication

#### Durable Objects
- WebSocket connections
- Shared state management
- Presence tracking
- Single instance per namespace

## Infrastructure as Code

### alchemy.run.ts

Defines all Cloudflare resources as TypeScript:

```typescript
// Resources are created as async functions
const db = await D1Database("db", { name: "demo-db" });
const storage = await R2Bucket("storage", { name: "demo-storage" });
const queue = await Queue("jobs", { name: "demo-jobs" });
const cache = await KVNamespace("cache", { name: "demo-cache" });
const chat = await DurableObject("ChatDO", { ... });
const workflow = await Workflow("OnboardingWorkflow", { ... });

// BunSPA combines frontend + backend
const website = await BunSPA("website", {
  frontend: "src/frontend/index.html",
  entrypoint: "src/backend/server.ts",
  bindings: { DB, STORAGE, JOBS, CACHE, CHAT, WORKFLOW }
});
```

### State Management

- **Local State**: Stored in `.alchemy/` directory
- **No External Service**: All state is local and inspectable
- **Version Control**: State files can be committed to git

## Data Flow

### User Creation Flow

1. Frontend → POST `/api/users`
2. Worker → Insert into D1
3. Worker → Send message to Queue
4. Queue → Process async job
5. Response → Return user object

### File Upload Flow

1. Frontend → POST `/api/upload` (FormData)
2. Worker → Upload to R2
3. Worker → Insert metadata into D1
4. Worker → Trigger Queue job
5. Queue → Process file (e.g., generate thumbnails)

### Chat Flow

1. Frontend → WebSocket upgrade request
2. Worker → Route to Durable Object
3. Durable Object → Accept connection
4. Durable Object → Broadcast to all clients
5. Frontend → Update UI

### Workflow Flow

1. Frontend → POST `/api/workflow/start`
2. Worker → Create workflow instance
3. Workflow → Execute steps sequentially
4. Each step → Call external services
5. Workflow → Complete or retry on failure

## Environment Variables

### Development

- `ALCHEMY_PASSWORD` - Encrypts secrets in state
- `BUN_PUBLIC_*` - Exposed to frontend

### Production

Secrets are managed via `alchemy.secret()`:

```typescript
API_KEY: alchemy.secret(process.env.API_KEY)
```

## Deployment

### Local Development

```bash
bun run dev
```

- Bun dev server for frontend
- Miniflare for Workers emulation
- Local D1 database
- Local R2 simulation

### Production Deployment

```bash
bun run deploy
```

- Builds and uploads to Cloudflare
- Creates/updates all resources
- Returns live URLs

### Cleanup

```bash
bun run destroy
```

- Removes all Cloudflare resources
- Deletes state files

## Security

- **Secrets**: Encrypted with ALCHEMY_PASSWORD
- **CORS**: Configured per route
- **Authentication**: Can be added via Workers Auth
- **Authorization**: Implement in Worker routes

## Monitoring

- Worker analytics via Cloudflare dashboard
- D1 query analytics
- R2 usage metrics
- Queue job tracking
- Workflow execution logs

## Scaling

- **Workers**: Auto-scales globally on Cloudflare edge
- **D1**: Horizontally distributed reads
- **R2**: Unlimited storage, pay-as-you-go
- **Queue**: Auto-scales with workload
- **Durable Objects**: Horizontal scaling by namespace

## Cost Optimization

- **Workers**: First 100k requests/day free
- **D1**: 5GB storage, 5M reads/day free
- **R2**: First 10GB storage/month free
- **KV**: 100k reads/day free
- **Queue**: 30k operations/day free

## Future Enhancements

- Add Cloudflare Auth integration
- Implement Workers AI for content generation
- Add D1 migrations automation
- Integrate Workers Analytics Engine
- Add live reload for Workflows
- Implement rate limiting
- Add monitoring dashboards

