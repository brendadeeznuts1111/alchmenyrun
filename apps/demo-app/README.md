# My Alchemy App

A production-ready app built with [Alchemy.run](https://github.com/brendadeeznuts1111/alchmenyrun).

## Quick Start

```bash
# Install dependencies
bun install

# Start local dev server
bun run dev

# Deploy to production
bun run deploy
```

## Architecture

This app uses Alchemy blocks:
- **ChatBlock** - Real-time API with WebSocket rooms
- **JobQueue** - Background job processing
- **CacheBlock** - KV storage for caching
- **BunBuild** - Frontend bundling

## Development

```bash
# Run tests
bun test

# Build for production
bun run build
```

## Learn More

- [Alchemy Documentation](https://github.com/brendadeeznuts1111/alchmenyrun/tree/main/docs)
- [Block Reference](https://github.com/brendadeeznuts1111/alchmenyrun/tree/main/docs/BLOCKS.md)
