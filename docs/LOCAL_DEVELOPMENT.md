# Local Development Guide

## Overview

This project uses Alchemy's local development mode with Miniflare for Cloudflare Workers emulation. All resources run locally with full binding support.

## Starting Development Server

```bash
bun run dev
```

This command starts:
- **Bun dev server** for frontend (with HMR at `http://localhost:3000`)
- **Miniflare** for Cloudflare Workers emulation
- **Local D1 database** (SQLite)
- **Local R2 storage** (file system)
- **Local KV namespace** (in-memory)
- **Local Queue** processing
- **Local Workflow** execution

## Resource Emulation

### Local vs Remote Bindings

According to [Alchemy's documentation](https://alchemy.run/concepts/dev/), resources support different modes:

| Resource | Local Emulation | Remote Binding |
|----------|----------------|----------------|
| D1Database | ✅ | ✅ |
| R2Bucket | ✅ | ✅ |
| KVNamespace | ✅ | ✅ |
| Queue | ✅ | ✅ |
| DurableObject | ❌ | ✅ |
| Workflow | ✅ | ❌ |
| Worker | ✅ | ✅ |

### Using Remote Bindings

To use deployed resources instead of local emulation, set `dev.remote: true`:

```typescript
const kv = await KVNamespace("cache", {
  name: "demo-cache",
  dev: {
    remote: true,  // Use deployed KV instead of local
  },
});
```

**Note:** Durable Objects require remote binding in development (no local emulation).

## BunSPA Integration

BunSPA provides automatic integration:

1. **Frontend:** Bun's native dev server with hot module reloading
2. **Backend:** Alchemy dev runs your Worker locally with full binding support
3. **Environment Variables:** `BUN_PUBLIC_*` variables are automatically exposed to frontend

### Frontend Access to Backend

Use the `getBackendUrl()` utility:

```typescript
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

const apiUrl = getBackendUrl();
fetch(`${apiUrl}/api/users`);
```

This automatically:
- Uses `BUN_PUBLIC_BACKEND_URL` in development
- Falls back to current origin in production

## Hot Module Replacement

Add to your main entry file for HMR:

```typescript
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

## Environment Variables

### Development

Create `.env`:
```bash
ALCHEMY_PASSWORD=your-secure-password
API_KEY=demo-key
```

### Frontend Variables

Prefix with `BUN_PUBLIC_*` to expose to frontend:
```bash
BUN_PUBLIC_API_URL=http://localhost:8787
BUN_PUBLIC_BACKEND_URL=http://localhost:8787
```

Configure `bunfig.toml`:
```toml
[serve.static]
env='BUN_PUBLIC_*'
```

## Database Migrations

### Apply Migrations Locally

Migrations are automatically applied when starting dev server. The D1 database is stored locally in `.alchemy/` directory.

### Manual Migration

```bash
bun scripts/init-db.ts
```

## Testing with Local Resources

Run tests with local emulation:

```bash
bun run test
```

Vitest uses Miniflare to emulate Cloudflare Workers environment.

## Debugging

### Worker Logs

Console logs from your Worker appear in the terminal where `bun run dev` is running.

### Frontend Debugging

Open browser DevTools while running the dev server.

### Database Inspection

Local D1 database is stored in `.alchemy/` directory. You can inspect it with SQLite tools:

```bash
sqlite3 .alchemy/d1-databases/demo-db.sqlite
```

## Limitations

According to [Alchemy's documentation](https://alchemy.run/concepts/dev/):

⚠️ **Local Workers can push to remote queues, but cannot consume from them**
⚠️ **Hyperdrive support is experimental**
⚠️ **Container bindings with `dev: { remote: true }` cannot be used as local bindings**
⚠️ **You may see "Connection refused" errors when containers start - these can be ignored**

### Durable Objects

Durable Objects **do not support local emulation**. They require remote binding:

```typescript
const chat = await DurableObject("ChatDO", {
  name: "ChatDO",
  className: "ChatRoom",
  scriptPath: "./src/backend/durable-object.ts",
  dev: {
    remote: true,  // Required for Durable Objects
  },
});
```

**To test Durable Objects locally:**
1. Deploy the Durable Object: `bun run deploy`
2. Run dev server with remote binding
3. The dev server will use the deployed DO

## Ports

Default ports:
- **Frontend:** `3000` (Bun dev server)
- **Backend API:** `8787` (Miniflare)

Alchemy will use next available port if default is busy.

## File Watching

Alchemy automatically watches for changes:
- **Frontend files:** Bun provides HMR
- **Backend files:** Miniflare restarts on changes
- **Infrastructure:** Alchemy reconciles on `alchemy.run.ts` changes

## Common Issues

### Port Already in Use

```bash
Error: Port 3000 is already in use
```

Alchemy will automatically use the next available port.

### D1 Database Not Found

Database is automatically created on first run. If issues persist:
1. Delete `.alchemy/` directory
2. Restart dev server

### CORS Errors

Ensure CORS headers are set in your Worker:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

### WebSocket Connection Failed

For Durable Objects, ensure you've deployed them first:

```bash
bun run deploy
```

Then run dev with remote binding.

## Performance

Local development with Miniflare is fast:
- **Hot reload:** < 100ms
- **Worker startup:** < 50ms
- **D1 queries:** < 5ms (local SQLite)
- **R2 operations:** < 10ms (local filesystem)

## Production Parity

Local environment closely matches production:
- Same Worker runtime (V8 isolates)
- Same D1 database (SQLite)
- Same R2 APIs
- Same KV APIs
- Same Queue APIs

**Differences:**
- Local D1 is not geo-replicated
- Local R2 is filesystem-based
- Durable Objects require remote binding

## Next Steps

1. Start dev server: `bun run dev`
2. Open browser: `http://localhost:3000`
3. Make changes and see live updates
4. Deploy when ready: `bun run deploy`

## Resources

- [Alchemy Local Development](https://alchemy.run/concepts/dev/)
- [Miniflare Documentation](https://miniflare.dev/)
- [Cloudflare Workers Local Development](https://developers.cloudflare.com/workers/testing/local-development/)

