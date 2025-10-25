# Alchemy Cloudflare Demo

> ✅ **Verified**: 100% compliant with [official Alchemy patterns](https://alchemy.run/getting-started) - see [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md)

Modern Cloudflare Infrastructure as Code (IaC) using [Alchemy](https://alchemy.run) - a TypeScript-native IaC library.

**This project is a drop-in superset of the official Alchemy Getting Started guide.**

## 🚀 Features

This project demonstrates a full-stack Cloudflare application with:

- **BunSPA** - Full-stack React frontend + Cloudflare Workers backend
- **D1 Database** - SQLite database with Drizzle ORM
- **R2 Storage** - File storage for uploads
- **Queue** - Async job processing
- **KV Namespace** - Caching layer
- **Durable Objects** - Real-time WebSocket chat
- **Workflows** - Multi-step orchestration (Cloudflare's newest feature, Oct 2025)
- **TypeScript-native IaC** - No YAML, no HCL, just async functions
- **MCP Server** - Optional Model Context Protocol integration for AI assistants ([see example](./examples/mcp/))

## 📋 Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Cloudflare account](https://cloudflare.com)
- Node.js 18+ (if not using Bun)

## 🛠️ Setup

1. **Install dependencies:**

```bash
bun install
```

2. **Authenticate with Cloudflare:**

**OAuth (Recommended):**
```bash
bun alchemy configure  # First time setup
bun alchemy login
```

**API Token:**
```bash
# Create token at: https://dash.cloudflare.com/profile/api-tokens
echo "CLOUDFLARE_API_TOKEN=your-token" >> .env
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete guide.

3. **Configure environment:**

Update `.env` with a secure password:

```bash
ALCHEMY_PASSWORD=your-secure-password-here
```

## 🏃 Running Locally

Start the development server with hot module replacement:

```bash
bun run dev
```

This starts:
- Bun dev server for the frontend (with HMR)
- Miniflare for Cloudflare Workers emulation
- Local D1 database
- Local R2 simulation
- Local KV namespace
- Local Queue processing
- Local Workflow execution

**Note:** Durable Objects require remote binding (see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for details)

## 🚢 Deployment

### Production Deployment

Deploy to Cloudflare:

```bash
bun run deploy
```

You'll receive the live URLs:
- Frontend: `https://website-prod.<your-account>.workers.dev`
- API: `https://website-prod.<your-account>.workers.dev`

### Stage-Based Deployment

Deploy to different stages:

```bash
# Production
bun alchemy deploy --stage prod

# Staging
bun alchemy deploy --stage staging

# Preview (PR-based)
bun alchemy deploy --stage pr-123
```

### CI/CD with GitHub Actions

This project includes automatic deployments via GitHub Actions:

- **Push to main** → Deploys to production (`prod` stage)
- **Open/update PR** → Deploys to preview environment (`pr-{number}` stage)
- **Close PR** → Automatically destroys preview environment

See [CI_CD.md](./CI_CD.md) for complete setup instructions.

## 🧪 Testing

Run tests:

```bash
bun run test
```

## 🧹 Cleanup

Destroy all Cloudflare resources:

```bash
bun run destroy
```

## 📁 Project Structure

```
/
├── src/
│   ├── frontend/          # React frontend
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── components/
│   ├── backend/           # Cloudflare Workers
│   │   ├── server.ts      # API routes
│   │   ├── workflow.ts    # Workflow orchestration
│   │   └── durable-object.ts  # WebSocket chat
│   ├── db/
│   │   ├── schema.ts      # Drizzle schema
│   │   └── migrations/
│   └── tests/
├── alchemy.run.ts         # Infrastructure definition
├── package.json
└── README.md
```

## 🎯 Key Concepts

### Infrastructure as Code

`alchemy.run.ts` defines all Cloudflare resources as async functions:

```typescript
const db = await D1Database("db", { name: "demo-db" });
const storage = await R2Bucket("storage", { name: "demo-storage" });
const queue = await Queue("jobs", { name: "demo-jobs" });
```

### Bindings

Resources are automatically bound to your Worker:

```typescript
bindings: {
  DB: db,
  STORAGE: storage,
  JOBS: queue,
  // ...
}
```

### Workflows

Multi-step durable orchestration:

```typescript
const workflow = await Workflow("OnboardingWorkflow", {
  name: "OnboardingWorkflow",
  scriptPath: "./src/backend/workflow.ts",
});
```

## 🌟 Recent Cloudflare Features (2025)

This project showcases:

- **Workflows** (Oct 2025) - Durable multi-step orchestration
- **Improved Workers** - Better DX, Python support
- **Assets** - Headers and redirects support
- **Smart Placement** - Optimized routing

## 📚 Documentation

- [README.md](./README.md) - Main documentation
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) - ✅ Official Alchemy pattern compliance verification (100%)
- [VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md) - Quick verification overview
- [OFFICIAL_PATTERN_COMPARISON.md](./OFFICIAL_PATTERN_COMPARISON.md) - Side-by-side pattern comparison
- [MCP_WORKER_PRODUCTION.md](./MCP_WORKER_PRODUCTION.md) - Production MCP worker deployment guide
- [MCP_WORKER_COMPLETE.md](./MCP_WORKER_COMPLETE.md) - MCP worker completion report
- [MCP_DEPLOYMENT_CHECKLIST.md](./MCP_DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and architecture
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Cloudflare authentication setup
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local dev setup and tips
- [CI_CD.md](./CI_CD.md) - CI/CD pipeline and deployment guide
- [MONOREPO.md](./MONOREPO.md) - Scaling to monorepo with Turborepo
- [CURSOR_RULES_SUMMARY.md](./CURSOR_RULES_SUMMARY.md) - Alchemy development rules and patterns
- [AI_AGENTS_GUIDE.md](./AI_AGENTS_GUIDE.md) - AI agent best practices for Alchemy projects
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project overview
- [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) - Complete implementation details

## 🧪 Optional Extensions

This project includes optional extensions that demonstrate advanced integrations:

### MCP Servers

**1. Production Worker-Based MCP** (Recommended for production)
Deploy-ready Cloudflare Worker with authentication, rate limiting, and dark launch support.

```bash
# Already included in main deployment
bun alchemy deploy --stage prod
```

See [MCP_WORKER_PRODUCTION.md](./MCP_WORKER_PRODUCTION.md) for deployment guide.

**Features:**
- JWT & Shared Secret authentication
- Rate limiting (100 req/min)
- Dark launch (0-100% rollout)
- 28+ test coverage
- Production-ready CI/CD

**2. Local Bun-Native MCP** (For development)
Local development server for testing and experimentation.

```bash
cd examples/mcp
bun install
bun run dev
```

See [examples/mcp/README.md](./examples/mcp/README.md) for local development.

**Features:**
- Deploy infrastructure via natural language
- Query database with AI assistance
- List R2 objects conversationally
- Trigger workflows from Claude/Cursor
- Get resource status on demand

## 🔗 External Resources

- [Alchemy Documentation](https://alchemy.run)
- [Alchemy Cloudflare Auth Guide](https://alchemy.run/guides/cloudflare/)
- [Alchemy Local Development](https://alchemy.run/concepts/dev/)
- [Alchemy CI/CD Guide](https://alchemy.run/guides/ci/)
- [Alchemy Turborepo Guide](https://alchemy.run/guides/turborepo/)
- [Alchemy .cursorrules](https://github.com/alchemy-run/alchemy/blob/main/.cursorrules)
- [Bun MCP Documentation](https://bun.com/docs/mcp)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Bun Documentation](https://bun.sh/docs)

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs!

## 📄 License

MIT

