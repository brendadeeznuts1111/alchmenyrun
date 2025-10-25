# Quick Start Guide

Get up and running with Alchemy Cloudflare Demo in 5 minutes.

## Step 1: Install Dependencies

```bash
bun install
```

## Step 2: Configure Environment

Update `.env` with a secure password:

```bash
ALCHEMY_PASSWORD=your-secure-password-here
```

## Step 3: Authenticate with Cloudflare

**Option A: OAuth (Recommended)**

```bash
# Configure profile (first time only)
bun alchemy configure

# Login to Cloudflare
bun alchemy login
```

This opens your browser to authenticate with Cloudflare using OAuth.

**Option B: API Token**

Create an API token at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens):

```bash
# Add to .env
echo "CLOUDFLARE_API_TOKEN=your-token-here" >> .env

# No login needed, deploy directly
bun alchemy deploy
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed auth setup.

## Step 4: Start Development Server

```bash
bun run dev
```

You should see:
- Frontend running at `http://localhost:3000`
- Backend API running via Miniflare
- All Cloudflare bindings available locally

## Step 5: Explore the Application

Open `http://localhost:3000` and try:

1. **Users Tab**: Create and view users (D1 Database)
2. **Files Tab**: Upload files to R2 storage
3. **Chat Tab**: Test real-time WebSocket chat (Durable Objects)
4. **Workflow Tab**: Trigger multi-step orchestration
5. **Cache Tab**: Test KV caching

## Step 6: Deploy to Production

```bash
bun run deploy
```

You'll receive live URLs:
- `https://website-prod.<your-account>.workers.dev`

### Stage-Based Deployment

Deploy to different environments:
```bash
# Production
bun alchemy deploy --stage prod

# Staging
bun alchemy deploy --stage staging
```

### CI/CD Deployment

Push to GitHub for automatic deployment:
```bash
git push origin main  # Deploys to production
```

See [CI_CD.md](./CI_CD.md) for GitHub Actions setup.

## Troubleshooting

### Port Already in Use

If port 3000 is busy, Alchemy will use the next available port.

### Cloudflare Authentication Failed

Run `bun alchemy login` again or check your Cloudflare account status.

### D1 Database Not Found

The database is automatically created on first deploy. In local dev, Miniflare creates a local D1 instance.

### Build Errors

Make sure all dependencies are installed:
```bash
bun install
```

## Next Steps

- Read the [README.md](./README.md) for detailed documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Explore `alchemy.run.ts` to understand the infrastructure
- Customize the frontend in `src/frontend/`
- Add new API routes in `src/backend/server.ts`

## Cleanup

To remove all Cloudflare resources:

```bash
bun run destroy
```

## Learn More

- [Alchemy Documentation](https://alchemy.run)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Drizzle ORM](https://orm.drizzle.team)
- [Bun Documentation](https://bun.sh/docs)

