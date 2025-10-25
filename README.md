# Alchemy Cloudflare Demo

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
git clone https://github.com/your-org/alchmenyrun.git
cd alchmenyrun

# Install dependencies
bun i
```

### Configuration

1. **Configure Alchemy Profile**
   ```bash
   bun alchemy configure
   ```

2. **Login to Cloudflare**
   ```bash
   bun alchemy login
   ```

3. **Set Environment Variables**
   
   Create a `.env` file:
   ```bash
   # Cloudflare Configuration
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_API_TOKEN=your_api_token_here
   
   # Alchemy Configuration
   ALCHEMY_PASSWORD=your_encryption_password
   ALCHEMY_STATE_TOKEN=your_state_token
   ```

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
- **[Contributing Guide](./CONTRIBUTING.md)** - Development guidelines

## 🔄 Development Workflow

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
- `bun run deploy` – Deploy to personal stage
- `bun run deploy:prod` – Deploy main branch to production
- `bun run destroy` – Clean up all resources
- `bun run build` – Build frontend assets
- `bun run check` – Type-check and lint
- `bun run format` – Format code with oxfmt
- `bun test` – Run test suite

## 🏗️ Architecture

This demo follows Alchemy's architecture principles:

- **TypeScript Native**: Full type safety and IntelliSense
- **Minimal Abstraction**: Thin wrappers around Cloudflare APIs
- **Explicit Configuration**: Clear, declarative infrastructure
- **Local Development**: Miniflare for local testing
- **Environment Isolation**: Separate dev/prod stages

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | Yes |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Yes |
| `ALCHEMY_PASSWORD` | Encryption password | Yes |
| `ALCHEMY_STATE_TOKEN` | State management token | Yes |

### Alchemy Configuration

The infrastructure is defined in `alchemy.run.ts`:

```typescript
import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-demo", {
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const website = await Website("app", {
  name: "cloudflare-demo-website",
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend",
  database: true,
  storage: true,
  cache: true,
  chat: true,
  workflow: true,
});

await app.finalize();
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
- Review [existing issues](https://github.com/your-org/alchmenyrun/issues)
- Join our [Discord community](https://discord.gg/jwKw8dBJdN)
- Create a [new issue](https://github.com/your-org/alchmenyrun/issues/new)

---

Built with ❤️ using [Alchemy](https://alchemy.run) - TypeScript-native Infrastructure as Code
