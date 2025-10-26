# @alch/cli

**CLI generators for Alchemy infrastructure**

Scaffold infrastructure resources from templates with a single command.

## Installation

```bash
# Global installation
bun add -g @alch/cli

# Or use via bun link for development
cd packages/@alch/cli
bun link
```

## Usage

```bash
alchemy-kit generate <type> <name>
alchemy-kit g <type> <name>          # shorthand
```

### Types

- **resource** - Generic Cloudflare Worker
- **block** - Reusable building block (chat, queue, etc.)
- **workflow** - Durable Workflow
- **cron** - Scheduled task handler

## Examples

### Generate a Worker

```bash
alchemy-kit generate resource hello
# Creates: src/resources/hello/worker.ts
```

### Generate a Chat Block

```bash
alchemy-kit g block chat-room
# Creates: src/blocks/chat-room/do.ts
#          src/blocks/chat-room/worker.ts
```

### Generate a Workflow

```bash
alchemy-kit generate workflow onboarding
# Creates: src/workflows/onboarding/workflow.ts
```

### Generate a CRON Job

```bash
alchemy-kit g cron nightly-cleanup
# Creates: src/crons/nightly-cleanup/handler.ts
```

## How It Works

1. **Copies templates** from `templates/<type>/` to your project
2. **Replaces placeholders** - `__NAME__` becomes your resource name
3. **Creates directory structure** - `src/<type>s/<name>/`
4. **Ready to deploy** - Generated code works out of the box

## Templates

### Resource Template
- `worker.ts` - Basic Cloudflare Worker

### Block Template (Chat)
- `do.ts` - Durable Object with WebSocket support
- `worker.ts` - Worker that routes to the DO

### Workflow Template
- `workflow.ts` - Multi-step workflow with state management

### CRON Template
- `handler.ts` - Scheduled task handler

## Help

```bash
alchemy-kit help
alchemy-kit --help
alchemy-kit -h
```

## Next Steps

After generating a resource:

1. Edit the generated files
2. Add to your `alchemy.run.ts`
3. Deploy: `alchemy deploy --profile dev`

## License

MIT
