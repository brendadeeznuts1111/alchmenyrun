# Alchemy Cloudflare Demo

[![CI Matrix](https://github.com/brendadeeznuts1111/alchmenyrun/actions/workflows/ci-matrix.yml/badge.svg)](https://github.com/brendadeeznuts1111/alchmenyrun/actions/workflows/ci-matrix.yml)
[![Release Feed](https://img.shields.io/badge/rss-releases-orange)](https://github.com/brendadeeznuts1111/alchmenyrun/releases.atom)

A comprehensive Cloudflare infrastructure demo built with Alchemy, showcasing TypeScript-native Infrastructure as Code with Workers, D1 database, R2 storage, KV cache, Durable Objects, and Workflows.

**Live Demo**: https://cloudflare-demo-website-prod.utahj4754.workers.dev

## 🚀 Quick Start

### Prerequisites

1. **Install Bun**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Cloudflare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Get your Account ID from the dashboard

### Installation

```bash
# Clone the repository
git clone https://github.com/brendadeeznuts1111/alchmenyrun.git
cd alchmenyrun

# Install dependencies
bun i
```

### Configuration

1. **Configure Alchemy Profile**
   ```bash
   bun alchemy configure
   ```
   
   This will create a profile configuration in `~/.alchemy/config.json`

2. **Login to Cloudflare**
   ```bash
   bun alchemy login
   ```
   
   This will store your Cloudflare credentials securely in `~/.alchemy/credentials/default/cloudflare.json`

3. **Set Environment Variables (Optional)**
   
   Create a `.env` file for local development:
   ```bash
   # Alchemy Configuration (optional - can use profiles)
   ALCHEMY_PASSWORD=your_encryption_password
   
   # Override profile if needed
   # ALCHEMY_PROFILE=prod
   # CLOUDFLARE_PROFILE=prod
   ```

**Note**: Alchemy profiles are the recommended way to manage credentials. They're stored locally in `~/.alchemy/` and behave similarly to AWS profiles. Environment variables are only needed for the encryption password and profile overrides.

### Development

```bash
# Start development server with hot reload
bun run alchemy:dev
```

Your application will be available locally with live updates as you edit your code.

### Deployment

```bash
# Deploy to your personal stage
bun run deploy

# Deploy to production (main branch)
bun run deploy:prod
```

## 📁 Project Structure

```
├── src/
│   ├── backend/           # Cloudflare Worker code
│   │   ├── server.ts      # Main worker entrypoint
│   │   ├── durable-object.ts # Durable Object for chat
│   │   └── workflow.ts    # Workflow definitions
│   ├── frontend/          # React frontend application
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Frontend entrypoint
│   ├── tests/             # Test files following Alchemy patterns
│   │   ├── integration.test.ts
│   │   ├── unit.test.ts
│   │   └── util.ts
│   ├── db/               # Database schema and utilities
│   │   ├── schema.ts     # Drizzle ORM schema
│   │   └── index.ts      # Database utilities
│   └── mcp/              # Model Context Protocol implementation
├── docs/                 # Comprehensive documentation
│   ├── cloudflare.md     # Provider documentation
│   └── guides/           # Getting started guides
├── scripts/              # Helper scripts
│   └── pre-commit.sh     # Pre-commit automation
├── alchemy.run.ts        # Infrastructure definition
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🛠️ Features

### Infrastructure Components

- **Cloudflare Workers**: Serverless compute at the edge
- **D1 Database**: SQLite database with Drizzle ORM
- **R2 Storage**: Object storage for file uploads
- **KV Cache**: Key-value storage for caching
- **Durable Objects**: Stateful compute for real-time features
- **Workflows**: Orchestration for multi-step processes

### Application Features

- **Real-time Chat**: WebSocket-based chat with Durable Objects
- **File Upload/Download**: R2 storage integration
- **User Management**: CRUD operations with D1 database
- **Caching Layer**: KV storage for performance
- **API Endpoints**: RESTful API with proper error handling
- **React Frontend**: Modern UI with Tailwind CSS

## 🧪 Testing

Follows Alchemy's testing best practices:

```bash
# Run all tests
bun test

# Run integration tests
bun test:integration

# Run specific test
bun vitest ./src/tests/integration.test.ts -t "should create and deploy website"

# Run tests in watch mode
bun test:watch
```

## 📚 Documentation

- **[Provider Documentation](./docs/cloudflare.md)** - Complete resource reference
- **[Getting Started Guide](./docs/guides/cloudflare.md)** - Step-by-step tutorial
- **[Concepts Guide](./docs/concepts.md)** - Phase, Secret, Bindings, and Resources
- **[Profiles Guide](./docs/profiles.md)** - Managing credentials with Alchemy profiles
- **[Contributing Guide](./CONTRIBUTING.md)** - Development guidelines

## 🔄 Development Workflow

🔥 **Perfect development workflow locked in!**

### ⚡ **Your 3-Step Process**

```bash
# 1️⃣ Development
bun run alchemy:dev  # Code → hot reload → test

# 2️⃣ Before commit  
bun format           # Auto-fix formatting
bun run test         # Verify all tests pass

# 3️⃣ Ship it
git commit -m "feat: new feature"  # Pre-commit hook validates
git push origin feature           # PR → preview URL
```

### 🎯 **What Makes This Flow Powerful**

- **Instant Feedback**: Hot reload shows changes immediately
- **Zero Friction**: Pre-commit hook handles all validation
- **Safety Net**: Tests and formatting enforced automatically  
- **Preview Isolation**: Every PR gets its own infrastructure
- **Production Ready**: Merge → deploy → cleanup automatically

### 🚀 **You're Ready To Build**

Your stack is:
- ✅ **Alchemy-compliant** (follows official guidelines exactly)
- ✅ **Fully scoped** (database → storage → compute hierarchy)
- ✅ **Type-safe** (complete TypeScript coverage)
- ✅ **Auto-tested** (comprehensive test suite)
- ✅ **Production-ready** (zero-downtime deployments)

**Start building!** 🚀

### Adding Features

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Implement the feature**
   - Add backend API endpoints in `src/backend/`
   - Create frontend components in `src/frontend/`
   - Write tests in `src/tests/`
   - Update documentation in `docs/`

3. **Test your changes**
   ```bash
   bun format          # Fix formatting
   bun test            # Run tests
   bun check           # Type-check and lint
   ```

4. **Submit a pull request**
   - Automatic preview URL will be created
   - Tests will run in CI
   - Review and merge to deploy

### Scripts

- `bun run alchemy:dev` – Hot-reload local development
- `bun run deploy` – Deploy to personal stage (up phase)
- `bun run deploy:prod` – Deploy main branch to production (up phase)
- `bun run deploy:read` – Read infrastructure properties without changes (read phase)
- `bun run destroy` – Clean up all resources (destroy phase)
- `bun run destroy:prod` – Clean up production resources (destroy phase)
- `bun run build` – Build frontend assets
- `bun run check` – Type-check and lint
- `bun run format` – Format code with oxfmt
- `bun test` – Run test suite

### Phase Examples

```bash
# Normal deployment (up phase)
bun run deploy

# Read infrastructure without changes (read phase)
bun run deploy:read

# Destroy all resources (destroy phase)
bun run destroy

# Use specific stage with phase
PHASE=destroy bun run deploy --stage prod
```

## 🏗️ Architecture

This demo follows Alchemy's architecture principles and recommended setup:

### Alchemy Scope System

This project implements Alchemy's hierarchical scope system for optimal resource organization, isolation, and cleanup. The scope system provides:

- **Hierarchical Isolation**: Application → Stage → Nested → Resource scopes
- **Automatic Cleanup**: Garbage collection of orphaned resources
- **Distributed Locking**: Safe concurrent CI/CD deployments
- **State Management**: Conflict-resistant state files with versioning
- **Test Isolation**: Automatic cleanup for testing environments

#### Scope Hierarchy

```
cloudflare-demo (Application Scope)
├── $USER/ (Stage Scope - your username)
│   ├── database/ (Nested Scope) - Data storage resources
│   │   └── D1 Database
│   ├── storage/ (Nested Scope) - File and object storage
│   │   ├── R2 Bucket
│   │   └── KV Namespaces (cache + MCP)
│   ├── compute/ (Nested Scope) - Processing and workflows
│   │   ├── Queue
│   │   ├── Durable Objects
│   │   └── Workflows
│   └── website (Resource) - Main application
└── prod/ (Stage Scope - production)
    └── [same structure as above]
```

#### Key Features

- **Resource Isolation**: Each scope maintains separate state and resources
- **Automatic Finalization**: `await app.finalize()` cleans up orphaned resources
- **Concurrent Safety**: Distributed locking prevents CI job conflicts
- **State Backup**: Automatic versioning of state files
- **Test Support**: `alchemy.test()` provides isolated test environments

📖 **[Complete Scope System Documentation](./docs/guides/ALCHEMY_SCOPES.md)**

### Apps & Stages

This project uses the recommended Alchemy Apps & Stages pattern:

- **App**: `cloudflare-demo` - Contains all infrastructure resources
- **Stages**: Isolated environments for different purposes
  - **Personal Stage**: Each developer's personal environment (`$USER`)
  - **Pull Request Stage**: Preview environments for PRs (`pr-123`)
  - **Production Stage**: Production environment (`prod`)

### Stage Management

```bash
# Personal development (uses your username)
bun run alchemy:dev    # Development server
bun run deploy        # Deploy to your stage

# Production
bun run deploy:prod   # Deploy to production

# Pull Request (automatic)
bun run deploy --stage pr-123  # Deploy to PR stage

# Cleanup
bun run destroy       # Clean up your stage
bun run destroy:prod  # Clean up production
```

### Resource Naming

Resources are automatically named with the pattern: `${app}-${stage}-${id}`

- Example: `cloudflare-demo-website-username` (personal stage)
- Example: `cloudflare-demo-website-prod` (production stage)

### Alchemy Principles

- **TypeScript Native**: Full type safety and IntelliSense
- **Minimal Abstraction**: Thin wrappers around Cloudflare APIs
- **Explicit Configuration**: Clear, declarative infrastructure
- **Local Development**: Miniflare for local testing
- **Environment Isolation**: Separate stages for different purposes

## 🔧 Configuration

### Profiles

Alchemy profiles manage credentials without `.env` files:

```bash
# Configure profile
alchemy configure [--profile name]

# Login
alchemy login [--profile name]

# Deploy with profile
alchemy deploy --profile prod
```

**Profile Storage**: `~/.alchemy/`
- `config.json` - Profile settings (no secrets)
- `credentials/{profile}/{provider}.json` - Credentials (sensitive)

See [docs/PROFILES_GUIDE.md](./docs/PROFILES_GUIDE.md) for details.

### Execution Phases

Three modes for running infrastructure:

| Phase | Purpose | Usage |
|-------|---------|-------|
| `up` | Deploy (default) | `bun ./alchemy.run.ts` |
| `destroy` | Tear down | `PHASE=destroy bun ./alchemy.run.ts` |
| `read` | Access only | `PHASE=read bun ./alchemy.run.ts` |

**Read phase example**:
```bash
# Build frontend with infrastructure URLs
PHASE=read bun ./scripts/build-frontend.ts
```

See [docs/EXECUTION_PHASES.md](./docs/EXECUTION_PHASES.md) for details.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PHASE` | Execution phase (`up`/`destroy`/`read`) | `up` |
| `STAGE` | Deployment stage | `$USER` |
| `ALCHEMY_PROFILE` | Profile to use | `default` |
| `CLOUDFLARE_PROFILE` | Cloudflare-specific profile | `default` |

### Infrastructure Definition

`alchemy.run.ts` defines all resources:

```typescript
const phase = (process.env.PHASE as "up" | "destroy" | "read") ?? "up";
const stage = process.env.STAGE ?? process.env.USER ?? "dev";

const app = await alchemy("cloudflare-demo", {
  phase,
  stage,
  profile: process.env.ALCHEMY_PROFILE ?? "default"
});

// Resources use automatic naming: ${app}-${resource}-${stage}
export const website = await Worker("website", {
  script: "./src/backend/server.ts"
});

await app.finalize();
```

### Common Patterns

```bash
# Deploy to dev
bun run deploy

# Deploy to prod
STAGE=prod bun run deploy

# Destroy dev
PHASE=destroy bun run deploy

# Read infrastructure
PHASE=read bun run deploy

# Use specific profile
alchemy deploy --profile prod
```

## 🚀 Deployment

### Preview Deployments

- Push to feature branch → Automatic preview URL
- Test changes in isolated environment
- Preview URL posted as PR comment

### Production Deployment

- Merge to main branch → Automatic production deployment
- Uses `prod` stage for production resources
- Zero-downtime deployments

## 🧹 Cleanup

```bash
# Remove development resources
bun run destroy

# Remove production resources
bun run destroy:prod
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for detailed guidelines.

### Before Contributing

1. Read the [Contributing Guide](./CONTRIBUTING.md)
2. Follow Alchemy's [testing best practices](./CONTRIBUTING.md#testing-best-practices)
3. Use the [pre-commit script](./scripts/pre-commit.sh)
4. Ensure all tests pass

## 📄 License

Apache-2.0 - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- [Alchemy Documentation](https://alchemy.run)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers)
- [Drizzle ORM](https://orm.drizzle.team)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

## 💡 Need Help?

- Check our [documentation](./docs/)
- Review [existing issues](https://github.com/brendadeeznuts1111/alchmenyrun/issues)
- Join our [Discord community](https://discord.gg/jwKw8dBJdN)
- Create a [new issue](https://github.com/brendadeeznuts1111/alchmenyrun/issues/new)

---

🚀 **Go build!**  
Your repo is a **Cloudflare-Bun-SPA rocket**—just:

```bash
bun run alchemy:dev   # start coding
```

Everything else happens automatically.  
Happy shipping!
