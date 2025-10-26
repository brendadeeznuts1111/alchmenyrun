# Alchemy Infrastructure Kit

> Batteries-included infrastructure toolkit for Cloudflare + Alchemy

[![Alchemy](https://img.shields.io/badge/alchemy-%5E0.76.1-green.svg)](https://www.npmjs.com/package/alchemy)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

## Packages

### `@alch/tunnel` v1.0.0
Cloudflare Tunnel resource with enterprise features:
- **Tunnel Management** - Create, update, and delete Cloudflare Tunnels
- **Prometheus Metrics** - Comprehensive metrics export for monitoring
- **Graceful Shutdown** - Clean termination with configurable grace periods
- **Zero-Downtime Reload** - Seamless configuration updates
- **DNS Automation** - Automatically create CNAME records for ingress hostnames

📚 [Documentation](./packages/@alch/tunnel/README.md) | [CHANGELOG](./packages/@alch/tunnel/CHANGELOG.md)

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

### `@alch/blocks`
Reusable infrastructure building blocks (coming soon):
- **ChatBlock** - WebSocket chat rooms with Durable Objects
- **JobQueue** - Async job processing
- **ScheduledTask** - CRON job scheduling
- **CacheBlock** - KV cache with worker

### `@alch/cli`
Code generation and scaffolding tools (coming soon):
- Resource scaffolding
- Template system
- Project generators

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
packages/@alch/
├─ tunnel/          – Cloudflare Tunnel resource (v1.0.0) ✅
├─ bun-runtime/     – Native Bun APIs (Shell, Test, Build, Package) ✅
├─ mcp-server/      – MCP server for AI integration ✅
├─ blocks/          – Reusable infrastructure blocks 🔄
└─ cli/             – Code generation and scaffolding 📋
```

## Version Compatibility

| Package | Version | Alchemy | Status |
|---------|---------|---------|--------|
| `@alch/tunnel` | 1.0.0 | ^0.76.1 | ✅ Stable |
| `@alch/bun-runtime` | - | ^0.76.1 | ✅ Beta |
| `@alch/mcp-server` | - | ^0.76.1 | ✅ Beta |
| `@alch/blocks` | - | ^0.76.1 | 🔄 Development |
| `@alch/cli` | - | ^0.76.1 | 📋 Planned |

## Contributing

This is an evolving toolkit. Each slice is designed to be:
- **Minimal** - Small, focused PRs
- **Functional** - Working code from day one
- **Composable** - Mix and match components
- **Documented** - Clear examples and use cases

## Documentation

- **[@alch/tunnel](./packages/@alch/tunnel/README.md)** - Cloudflare Tunnel resource guide
- **[Alchemy Framework](https://alchemy.run/docs)** - Official Alchemy documentation
- **[Cloudflare Docs](https://developers.cloudflare.com/)** - Cloudflare platform documentation

## License

MIT - see [LICENSE](../LICENSE) for details
