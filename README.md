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
- **Preview Deployments** - 🚀 Automatic PR previews with live URLs in comments
- **GitHub Integration** - Automated repository management and webhooks for CI/CD
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

Copy the example environment file and update with your values:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```bash
# Required
ALCHEMY_PASSWORD=your-secure-password-here

# Optional: GitHub Integration
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

**GitHub Token Setup (Optional):**
If you want to enable GitHub integration:
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Create a new Personal Access Token (classic)
3. Select scopes: `repo`, `workflow`, `admin:repo_hook`
4. Copy the token to your `.env` file

## 🏃 Running Locally

Start the development server with hot module replacement:

```bash
# Direct Alchemy CLI (recommended)
bun run alchemy:dev

# Or with CSS build
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
- Auto-reload on file changes

**Note:** Durable Objects require remote binding (see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for details)

## 🚢 Deployment

### Quick Deploy

Deploy to Cloudflare with automatic stage detection:

```bash
# Deploy to personal stage
bun run deploy

# Deploy to production
bun run deploy:prod

# Deploy to specific stage with adoption
bun run deploy -- --stage staging --adopt
```

You'll receive the live URLs:
- Frontend: `https://website-{stage}.<your-account>.workers.dev`
- API: `https://website-{stage}.<your-account>.workers.dev/api`

### Stage-Based Deployment

Deploy to different stages:

```bash
# Personal/development
bun run deploy -- --stage $USER

# Staging
bun run deploy -- --stage staging

# Production
bun run deploy:prod

# PR preview
bun run deploy -- --stage pr-123
```

### CI/CD with GitHub Actions

This project includes **automatic preview deployments**:

- **Push to main** → Deploys to `prod` stage
- **Open PR** → Deploys to `pr-{number}` stage + posts preview URL
- **Update PR** → Redeploys and updates comment
- **Close PR** → Automatic cleanup

Every PR gets a live preview URL posted automatically! 🎉

**Example PR Comment:**
```markdown
## 🚀 Preview Deployed
**🌐 Website:** https://website-pr-42.your-account.workers.dev
**📡 API:** https://website-pr-42.your-account.workers.dev/api
Built from commit `abc123d`
```

**Required GitHub Secrets:**
- `ALCHEMY_PASSWORD` - Encryption password (`openssl rand -base64 32`)
- `ALCHEMY_STATE_TOKEN` - Cloudflare API token with D1 permissions
- `CLOUDFLARE_API_TOKEN` - Main Cloudflare API token
- `CLOUDFLARE_EMAIL` - Your Cloudflare account email

See [PREVIEW_DEPLOYMENTS.md](./PREVIEW_DEPLOYMENTS.md) and [SECRETS_SETUP.md](./SECRETS_SETUP.md) for complete setup.

## 🧪 Testing

Run tests:

```bash
bun run test
```

## 🧹 Cleanup

Destroy Cloudflare resources:

```bash
# Destroy current stage
bun run destroy

# Destroy specific stage
bun run destroy -- --stage pr-123

# Destroy personal stage
bun run destroy -- --stage $USER
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

### GitHub Integration

Manage GitHub repositories and webhooks directly from your infrastructure code:

```typescript
// Create a GitHub repository
const repo = await GitHub("demo-repo", {
  name: "alchemy-cloudflare-demo",
  description: "Demo repository managed by Alchemy",
  private: false,
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});

// Register a webhook to receive GitHub events
const webhook = await RepositoryWebhook("deploy-webhook", {
  repository: repo.fullName,
  events: ["push", "pull_request"],
  url: `${website.apiUrl}/api/github/webhook`,
  contentType: "json",
  secret: alchemy.secret(process.env.GITHUB_WEBHOOK_SECRET),
  token: alchemy.secret(process.env.GITHUB_TOKEN),
});
```

**Use Cases:**
- **Automated Deployments**: Trigger Cloudflare Worker deployments on push to main
- **Preview Environments**: Create preview deployments for pull requests
- **CI/CD Integration**: Connect GitHub Actions with Cloudflare Workers
- **Repository Management**: Create, configure, and manage repositories as code

The webhook endpoint (`/api/github/webhook`) in your Worker receives GitHub events and can:
- Trigger Cloudflare Workflows for deployment pipelines
- Process push events to deploy to production
- Handle pull request events to create preview environments
- Log and track repository activity

## 🌟 Recent Cloudflare Features (2025)

This project showcases:

- **Workflows** (Oct 2025) - Durable multi-step orchestration
- **Improved Workers** - Better DX, Python support
- **Assets** - Headers and redirects support
- **Smart Placement** - Optimized routing

## 📚 Documentation

- [README.md](./README.md) - Main documentation
- [PREVIEW_DEPLOYMENTS.md](./PREVIEW_DEPLOYMENTS.md) - 🚀 Automatic PR preview deployments guide
- [SECRETS_SETUP.md](./SECRETS_SETUP.md) - Complete GitHub secrets setup walkthrough
- [CLI_CI_SETUP.md](./CLI_CI_SETUP.md) - CLI + CI workflow setup and usage guide
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Complete setup verification checklist
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [GITHUB_INTEGRATION.md](./GITHUB_INTEGRATION.md) - GitHub integration setup and CI/CD guide (🚧 scaffold ready)
- [GITHUB_INTEGRATION_SUMMARY.md](./GITHUB_INTEGRATION_SUMMARY.md) - Implementation summary and status
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Complete testing guide for GitHub integration
- [VERIFICATION_REPORT.md](./VERIFICATION_REPORT.md) - ✅ Official Alchemy pattern compliance verification (100%)
- [VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md) - Quick verification overview
- [OFFICIAL_PATTERN_COMPARISON.md](./OFFICIAL_PATTERN_COMPARISON.md) - Side-by-side pattern comparison
- [MCP_WORKER_PRODUCTION.md](./MCP_WORKER_PRODUCTION.md) - Production MCP worker deployment guide
- [MCP_WORKER_COMPLETE.md](./MCP_WORKER_COMPLETE.md) - MCP worker completion report
- [MCP_DEPLOYMENT_CHECKLIST.md](./MCP_DEPLOYMENT_CHECKLIST.md) - Deployment checklist
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and architecture
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Cloudflare authentication setup
- [AUTHENTICATION_CHEATSHEET.md](./AUTHENTICATION_CHEATSHEET.md) - Quick auth reference guide
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

# Verified! ✅
