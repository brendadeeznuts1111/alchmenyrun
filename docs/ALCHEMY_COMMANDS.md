# Alchemy Commands Reference

Quick reference for Alchemy CLI commands used in this project.

## Core Commands

### 1. Read-Only Mode (Dry-Run)
Check infrastructure without making changes:

```bash
bun alchemy run
```

**Use cases:**
- Verify infrastructure definition
- Check for syntax errors
- Validate before deploying

**Note:** Requires existing state or deployed resources.

### 2. Local Development

**Standard dev mode:**
```bash
bun alchemy dev
```

**Watch mode (auto-reload):**
```bash
bun alchemy dev --watch
```

**Custom stage:**
```bash
bun alchemy dev --stage my-feature
```

### 3. Deploy

**Default stage (uses $USER):**
```bash
bun alchemy deploy
```

**Production stage:**
```bash
bun alchemy deploy --stage prod
```

**Custom stage:**
```bash
bun alchemy deploy --stage staging
```

### 4. Destroy

**Default stage:**
```bash
bun alchemy destroy
```

**Specific stage:**
```bash
bun alchemy destroy --stage prod
```

## Stage Management

According to the [official Alchemy guide](https://alchemy.run/concepts/apps-and-stages/#recommended-setup), this project uses:

1. **Personal Stage** - Default `$USER` for local development
2. **Pull Request Stage** - `pr-${number}` for PR previews (via CI)
3. **Production Stage** - `prod` for main branch (via CI)

## Project Scripts

### Development
```bash
bun run dev              # Start dev server
bun run dev --watch      # Watch mode
```

### Deploy
```bash
bun run deploy           # Deploy to Cloudflare
bun run deploy --stage prod  # Deploy to production
```

### Testing
```bash
bun run test             # Run all tests
bun run test:integration # Run integration tests
```

### Database
```bash
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
```

## Environment Variables

Required in `.env`:
- `ALCHEMY_PASSWORD` - Encrypts secrets in state
- `CLOUDFLARE_API_TOKEN` - Cloudflare authentication (or use OAuth)
- `MCP_SHARED_SECRET` - MCP authentication secret
- `MCP_JWT_SECRET` - JWT signing secret

## See Also

- [Authentication Guide](./AUTHENTICATION.md)
- [Authentication Cheat Sheet](./AUTHENTICATION_CHEATSHEET.md)
- [Setup Checklist](./SETUP_CHECKLIST.md)
- [Official Alchemy Docs](https://alchemy.run)

