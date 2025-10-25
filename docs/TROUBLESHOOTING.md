# Troubleshooting Guide

Common issues and solutions when working with Alchemy and Cloudflare.

## Installation Issues

### Bun Not Found

```bash
command not found: bun
```

**Solution:** Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Dependencies Installation Failed

```bash
error: Could not resolve module
```

**Solution:** Clear cache and reinstall:
```bash
rm -rf node_modules bun.lock
bun install
```

## Authentication Issues

### Cloudflare Login Failed

```bash
Error: Authentication failed
```

**Solutions:**
1. Re-authenticate with OAuth:
   ```bash
   bun alchemy login
   ```
2. Or use API token:
   ```bash
   echo "CLOUDFLARE_API_TOKEN=your-token" >> .env
   ```
3. Check Cloudflare account status
4. Verify OAuth tokens in `~/.alchemy/profiles/`

### API Token Issues

```bash
Error: Invalid API token
```

**Solutions:**
1. Generate new API token at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Use "Edit Cloudflare Workers" template
3. Ensure token has required permissions:
   - Workers Scripts → Edit
   - D1 → Edit
   - R2 → Edit
   - KV Storage → Edit
   - Queues → Edit
   - Durable Objects → Edit
4. Add to `.env`: `CLOUDFLARE_API_TOKEN=your-token`
5. Or use Alchemy utility:
   ```bash
   bun alchemy util create-cloudflare-token
   ```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete auth guide.

## Development Server Issues

### Port Already in Use

```bash
Error: Port 3000 is already in use
```

**Solution:** Alchemy automatically uses next available port. Check terminal output for actual port.

### Dev Server Won't Start

```bash
Error: Failed to start development server
```

**Solutions:**
1. Check `.env` file exists with `ALCHEMY_PASSWORD`
2. Verify `alchemy.run.ts` syntax
3. Clear Alchemy cache:
   ```bash
   rm -rf .alchemy
   bun run dev
   ```

### Hot Reload Not Working

**Solution:** Ensure HMR is enabled in `src/frontend/main.tsx`:
```typescript
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

## Database Issues

### D1 Database Not Found

```bash
Error: D1Database "demo-db" not found
```

**Solutions:**
1. Local dev: Database auto-creates on first run
2. Production: Deploy first with `bun run deploy`
3. Clear state: `rm -rf .alchemy && bun run dev`

### Migration Errors

```bash
Error: Migration failed
```

**Solutions:**
1. Check SQL syntax in `src/db/migrations/`
2. Verify Drizzle schema matches migrations
3. Delete local DB and restart: `rm -rf .alchemy/d1-databases`

### Drizzle Type Errors

```bash
Error: Property 'users' does not exist
```

**Solution:** Regenerate Drizzle types:
```bash
bun run db:generate
```

## Durable Objects Issues

### WebSocket Connection Failed

```bash
Error: Failed to connect to Durable Object
```

**Solutions:**
1. **Deploy Durable Object first:**
   ```bash
   bun run deploy
   ```
2. Verify remote binding in `alchemy.run.ts`:
   ```typescript
   dev: { remote: true }
   ```
3. Check DO is deployed in Cloudflare Dashboard

### DO Class Not Found

```bash
Error: Durable Object class 'ChatRoom' not found
```

**Solutions:**
1. Verify class export in `src/backend/durable-object.ts`
2. Check `scriptPath` in `alchemy.run.ts`
3. Redeploy: `bun run deploy`

## R2 Storage Issues

### File Upload Failed

```bash
Error: Failed to upload to R2
```

**Solutions:**
1. Check file size limits
2. Verify R2 bucket exists (auto-created in dev)
3. Check CORS headers in Worker

### File Not Found

```bash
Error: R2 object not found
```

**Solutions:**
1. Verify file was uploaded successfully
2. Check key matches in database and R2
3. Inspect local R2: `.alchemy/r2-buckets/`

## Queue Issues

### Queue Job Not Processing

```bash
Warning: Queue consumer not running locally
```

**Note:** According to [Alchemy docs](https://alchemy.run/concepts/dev/), local Workers can push to remote queues but cannot consume from them.

**Solutions:**
1. For local testing: Check job was enqueued with logs
2. For full testing: Deploy and test in production
3. Consider using remote binding:
   ```typescript
   dev: { remote: true }
   ```

## Workflow Issues

### Workflow Won't Start

```bash
Error: Failed to start workflow
```

**Solutions:**
1. Check workflow class exports
2. Verify `scriptPath` in `alchemy.run.ts`
3. Review workflow step definitions

### Workflow Step Failed

```bash
Error: Workflow step 'create-profile' failed
```

**Solutions:**
1. Check step function logic
2. Verify async operations complete
3. Add error handling in workflow steps

## Build Issues

### TypeScript Errors

```bash
Error: Type 'X' is not assignable to type 'Y'
```

**Solutions:**
1. Check TypeScript version: `bun typescript --version`
2. Clear cache: `rm -rf node_modules && bun install`
3. Verify `tsconfig.json` settings

### Build Failed

```bash
Error: Build failed with 1 error
```

**Solutions:**
1. Check for syntax errors
2. Verify all imports resolve
3. Run linter: `bun run lint`

## Deployment Issues

### Deploy Failed

```bash
Error: Deployment failed
```

**Solutions:**
1. Check authentication: `bun alchemy login`
2. Verify Cloudflare account has required permissions
3. Check for resource limits
4. Review error message in terminal

### Resource Already Exists

```bash
Error: Resource "demo-db" already exists
```

**Solutions:**
1. This is usually OK - resource will be updated
2. If problematic, destroy and redeploy:
   ```bash
   bun run destroy
   bun run deploy
   ```

### State File Conflicts

```bash
Error: State file conflict
```

**Solutions:**
1. Pull latest state from git
2. Or reset state: `rm -rf .alchemy && bun run deploy`

## CORS Issues

### CORS Error in Browser

```bash
Access to fetch blocked by CORS policy
```

**Solution:** Add CORS headers in `src/backend/server.ts`:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

## Performance Issues

### Slow Local Development

**Solutions:**
1. Reduce number of remote bindings
2. Use local emulation where possible
3. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`

### Large Bundle Size

**Solutions:**
1. Check for unnecessary dependencies
2. Use dynamic imports
3. Enable code splitting

## Testing Issues

### Tests Won't Run

```bash
Error: Failed to run tests
```

**Solutions:**
1. Install test dependencies: `bun install`
2. Check vitest config
3. Verify test files are in `src/tests/`

### Miniflare Errors in Tests

```bash
Error: Miniflare initialization failed
```

**Solutions:**
1. Update Miniflare: `bun update miniflare`
2. Check test environment setup
3. Verify mock bindings

## Environment Variable Issues

### Environment Variables Not Found

```bash
Error: process.env.ALCHEMY_PASSWORD is undefined
```

**Solutions:**
1. Create `.env` file in project root
2. Add required variables
3. Restart dev server

### Frontend Can't Access Backend URL

**Solutions:**
1. Use `getBackendUrl()` utility
2. Verify `bunfig.toml` has `env='BUN_PUBLIC_*'`
3. Prefix frontend vars with `BUN_PUBLIC_`

## Cloudflare Dashboard Issues

### Resources Not Showing

**Solutions:**
1. Verify deployment succeeded
2. Check correct Cloudflare account
3. Wait a few seconds for propagation

### Workers Not Accessible

**Solutions:**
1. Check Worker is deployed
2. Verify routes are configured
3. Check for deployment errors

## Getting Help

If you're still stuck:

1. **Check Logs:**
   ```bash
   # Dev server logs
   bun run dev
   
   # Deployment logs
   bun run deploy --verbose
   ```

2. **Community Support:**
   - [Alchemy GitHub Issues](https://github.com/alchemy-run/alchemy/issues)
   - [Cloudflare Community](https://community.cloudflare.com/)
   - [Alchemy Discord](https://discord.gg/alchemy)

3. **Documentation:**
   - [Alchemy Docs](https://alchemy.run)
   - [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
   - [Drizzle ORM Docs](https://orm.drizzle.team)

4. **Debug Mode:**
   ```bash
   DEBUG=* bun run dev
   ```

## Common Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `Authentication failed` | Not logged in to Cloudflare | Run `bun alchemy login` |
| `Resource not found` | Resource not deployed | Run `bun run deploy` |
| `Port in use` | Port already taken | Alchemy auto-selects new port |
| `CORS policy` | Missing CORS headers | Add CORS headers to Worker |
| `D1Database not found` | Database not created | Deploy or restart dev |
| `WebSocket failed` | DO not deployed | Deploy with `bun run deploy` |
| `Type error` | TypeScript mismatch | Check types, regenerate |
| `Build failed` | Syntax/import error | Check error message, fix code |

