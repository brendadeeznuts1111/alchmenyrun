# Phase 2: Infrastructure Kit Roadmap

**Goal**: Transform the demo into a batteries-included "infra kit" that's `git clone && bun install && alchemy deploy` ready.

## Vision

Turn Alchemy + Cloudflare into a composable toolkit with:
- **Native Bun runtimes** (Shell, Test, Build, Package)
- **MCP integration** (Model-Context-Protocol) for AI assistants
- **Reusable building blocks** (Queues, CRON, DOs, R2, D1, KV)
- **One-command scaffolding** (`alchemy generate resource`)

## Progress

### ✅ Slice 1: Bun Runtime + MCP Server (PR #16)

**Status**: Open, ready for review

**Packages**:
- `@alch/bun-runtime` - Native Bun APIs (Shell, Test, Build, Package)
- `@alch/mcp-server` - MCP server exposing infrastructure as AI tools

**Features**:
- Execute shell commands with `BunShell`
- Run tests with `BunTest`
- Bundle code with `BunBuild`
- Manage packages with `BunPackage`
- Claude Desktop integration via MCP

**Scripts**:
```bash
bun run mcp:claude   # Start MCP server
bun run kit:test     # Test all packages
bun run kit:build    # Build all packages
```

**Review Checklist**:
- [x] `bun install` finishes without cycles
- [x] `bun run kit:build` → dist folders created
- [ ] `bun run kit:test` → all green
- [ ] `bun run mcp:claude` → starts without error
- [ ] Claude Desktop integration works
- [ ] `alchemy deploy --profile prod` passes

---

### 📋 Slice 2: Reusable Blocks (PR #17 - Next)

**Branch**: `feat/blocks`

**Package**: `@alch/blocks`

**Building Blocks**:
```typescript
import { ChatBlock, JobQueue, ScheduledTask, CacheBlock } from "@alch/blocks";

// WebSocket chat with Durable Object
const { worker, room } = ChatBlock("support");

// Job queue for async processing
const emails = JobQueue("emails");

// Scheduled task (CRON)
const cleanup = ScheduledTask("cleanup", "0 4 * * *", "src/cron/cleanup.ts");

// KV cache with worker
const { kv, worker: cache } = CacheBlock("api-cache");
```

**Templates**:
- `templates/blocks/chat/` - WebSocket chat worker + DO
- `templates/blocks/queue/` - Queue worker
- `templates/blocks/cron/` - CRON handler
- `templates/blocks/cache/` - Cache worker

**Usage**:
One-line resource creation with sensible defaults and automatic wiring.

---

### 📋 Slice 3: CLI Generators (PR #18 - Future)

**Branch**: `feat/cli-generators`

**Package**: `@alch/cli`

**Commands**:
```bash
# Generate resources
alchemy generate resource my-queue
alchemy generate block chat-room
alchemy generate workflow onboarding
alchemy generate cron nightly-cleanup

# Scaffold from templates
alchemy scaffold full-stack my-app
alchemy scaffold worker-do my-worker
alchemy scaffold mcp-bridge my-bridge
```

**Features**:
- Template-based code generation
- Interactive prompts for configuration
- Automatic file scaffolding
- Type-safe resource creation

---

## Target Repository Structure

```
<kit-root>
├─ packages/
│  ├─ @alch/bun-runtime     – Native Bun Shell, Test, Build, Package
│  ├─ @alch/mcp-server      – MCP server exposing CF resources
│  ├─ @alch/blocks          – Typed building blocks (Queue, Cron, DO, etc.)
│  └─ @alch/cli             – Code generation and scaffolding
├─ templates/
│  ├─ worker-do-chat        – WebSocket chat (already built)
│  ├─ worker-mcp-bridge     – Minimal MCP bridge worker
│  ├─ full-stack            – Worker + Vite + DO + D1 + R2
│  └─ blocks/               – Block templates
├─ examples/
│  ├─ simple-chat/          – Minimal chat example
│  ├─ mcp-client-claude.md  – Claude Desktop setup
│  └─ full-stack-app/       – Complete app example
└─ alchemy.config.ts        – Single deploy for whole mono-repo
```

---

## Design Principles

### 1. **Minimal PRs**
Each slice is small, focused, and reviewable in < 10 minutes.

### 2. **Functional from Day One**
Every PR ships working code with examples and tests.

### 3. **Composable**
Mix and match components. No forced patterns.

### 4. **Well-Documented**
Clear examples, use cases, and integration guides.

### 5. **Type-Safe**
Full TypeScript support with inference.

---

## Success Metrics

### Phase 2 Complete When:
- [ ] All 3 slices merged
- [ ] `bun create @alch/kit my-app` works
- [ ] Claude Desktop can control infrastructure
- [ ] 5+ reusable blocks available
- [ ] CLI generates resources from templates
- [ ] Documentation covers all use cases

### Long-Term Goals:
- **Multi-region deployment** blocks
- **Monitoring and observability** blocks
- **Testing utilities** and fixtures
- **Documentation generator** from code
- **Community templates** repository

---

## Timeline

- **Slice 1** (Current): Bun Runtime + MCP Server
- **Slice 2** (Next): Reusable Blocks
- **Slice 3** (After): CLI Generators
- **v2.0**: Full kit release with templates and examples

---

## Contributing

Each slice follows the same pattern:
1. Create feature branch
2. Implement package with tests
3. Add documentation and examples
4. Create PR with review checklist
5. Merge and iterate

**Current Status**: Slice 1 in review, Slice 2 spec ready to code! 🚀
