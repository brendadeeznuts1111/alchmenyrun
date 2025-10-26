# Alchemy Infrastructure Kit

**Phase 2: Batteries-included infrastructure toolkit for Cloudflare + Alchemy**

## Packages

### `@alch/bun-runtime`
Bun-native runtime utilities for infrastructure automation:
- **BunShell** - Execute shell commands
- **BunTest** - Run tests with Bun
- **BunBuild** - Bundle TypeScript/JavaScript
- **BunPackage** - Package management

### `@alch/mcp-server`
Model Context Protocol (MCP) server that exposes infrastructure as AI-accessible tools:
- Expose any resource as an MCP tool
- Connect Claude Desktop or other AI assistants
- Execute infrastructure commands through natural language

## Quick Start

### 1. Run MCP Server

Connect Claude Desktop to your infrastructure:

```bash
bun run mcp:claude
```

Then configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "alchemy-infra": {
      "command": "bun",
      "args": ["run", "mcp:claude"],
      "cwd": "/path/to/alchmenyrun"
    }
  }
}
```

### 2. Use in Your Code

```typescript
import { BunShell, BunTest, BunBuild } from "@alch/bun-runtime";
import { createMCPServer } from "@alch/mcp-server";

// Define resources
const resources = {
  build: BunBuild("./src/index.ts", "./dist"),
  test: BunTest(),
  lint: BunShell("lint", "bun run format:check"),
};

// Expose via MCP
const server = createMCPServer(resources);
```

## Available Scripts

```bash
# Start MCP server for Claude Desktop
bun run mcp:claude

# Test all kit packages
bun run kit:test

# Build all kit packages
bun run kit:build
```

## Roadmap

### ✅ Slice 1: Bun Runtime + MCP (Current)
- [x] Bun-native Shell, Test, Build, Package
- [x] MCP server skeleton
- [x] Claude Desktop integration

### 🔄 Slice 2: Reusable Blocks (Next)
- [ ] `@alch/blocks` - ChatBlock, JobQueue, ScheduledTask
- [ ] Typed building blocks for common patterns
- [ ] One-line resource creation

### 📋 Slice 3: CLI Generators
- [ ] `@alch/cli` - Scaffolding and code generation
- [ ] `alchemy generate resource <name>`
- [ ] Template system

### 🚀 Future
- [ ] Multi-region deployment blocks
- [ ] Monitoring and observability blocks
- [ ] Testing utilities and fixtures
- [ ] Documentation generator

## Architecture

```
packages/
├─ @alch/bun-runtime     – Native Bun APIs (Shell, Test, Build, Package)
├─ @alch/mcp-server      – MCP server for AI integration
├─ @alch/blocks          – Reusable infrastructure blocks (coming soon)
└─ @alch/cli             – Code generation and scaffolding (coming soon)
```

## Contributing

This is an evolving toolkit. Each slice is designed to be:
- **Minimal** - Small, focused PRs
- **Functional** - Working code from day one
- **Composable** - Mix and match components
- **Documented** - Clear examples and use cases

## License

MIT
