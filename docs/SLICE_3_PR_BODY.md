🚀 **Phase 2: Infrastructure Kit - Slice 3 (FINAL)**

CLI generators for scaffolding infrastructure from templates.

## New Package: `@alch/cli`

### Commands

```bash
# Generate resources
alchemy-kit generate resource hello
alchemy-kit g block chat-room          # shorthand
alchemy-kit generate workflow onboarding
alchemy-kit g cron nightly-cleanup
```

### What It Does

1. **Scaffolds from templates** - Copies template files to your project
2. **Replaces placeholders** - `__NAME__` → your resource name
3. **Creates directory structure** - `src/{type}s/{name}/`
4. **Ready to deploy** - Generated code works out of the box

## Usage

### Install

```bash
cd packages/@alch/cli
bun link
```

### Generate Resources

```bash
# Generic worker
alchemy-kit generate resource hello
# → src/resources/hello/worker.ts

# Chat block
alchemy-kit g block chat-room
# → src/blocks/chat-room/do.ts
# → src/blocks/chat-room/worker.ts

# Workflow
alchemy-kit generate workflow onboarding
# → src/workflows/onboarding/workflow.ts

# CRON job
alchemy-kit g cron nightly
# → src/crons/nightly/handler.ts
```

### Deploy

```bash
cd src/resources/hello
alchemy deploy --profile dev
```

## Templates Included

- ✅ **resource** - Generic Cloudflare Worker
- ✅ **block/chat** - WebSocket chat with Durable Object
- ✅ **block/queue** - Queue consumer worker
- ✅ **workflow** - Durable Workflow
- ✅ **cron** - Scheduled task handler

## Help Text

```bash
alchemy-kit help
```

```
alchemy-kit - Infrastructure code generator

Usage:
  alchemy-kit generate <type> <name>
  alchemy-kit g <type> <name>          (shorthand)

Types:
  resource   - Generic Cloudflare Worker
  block      - Reusable building block (chat, queue, etc.)
  workflow   - Durable Workflow
  cron       - Scheduled task handler

Examples:
  alchemy-kit generate resource hello
  alchemy-kit g block chat-room
  alchemy-kit generate workflow onboarding
  alchemy-kit g cron nightly-cleanup
```

## Phase 2 Complete! 🎉

With this PR, the infrastructure kit is **feature-complete**:

✅ **Slice 1**: Bun Runtime + MCP Server  
✅ **Slice 2**: Reusable Blocks  
✅ **Slice 3**: CLI Generators  

## What's Next

- Polish documentation
- Publish to npm as `@alch/*` packages
- Create `bun create @alch/kit` template
- Community templates repository

**The kit is ready to ship!** 🚀
