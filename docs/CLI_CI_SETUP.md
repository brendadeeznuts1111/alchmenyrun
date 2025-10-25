# CLI + CI Setup Guide

This project uses a streamlined CLI + CI workflow that runs `alchemy.run.ts` directly, providing the same experience locally and in GitHub Actions.

## 🎯 Overview

The setup provides:
- **Local development**: `bun run alchemy:dev` with hot-reload
- **One-shot deploy**: `bun run deploy` with stage support
- **GitHub Actions**: Automatic PR previews and production deploys
- **Unified experience**: Same commands work locally and in CI

## 📦 Package Scripts

### Development
```bash
# Hot-reload local infrastructure (Miniflare)
bun run alchemy:dev

# Alternative: Build CSS + start dev server
bun run dev
```

### Deployment
```bash
# Deploy to personal stage (default: $USER)
bun run deploy

# Deploy to specific stage
bun run deploy -- --stage staging

# Deploy to production
bun run deploy:prod

# Deploy with adoption (skip resource creation if exists)
bun run deploy -- --stage $USER --adopt
```

### Cleanup
```bash
# Destroy current stage resources
bun run destroy

# Destroy specific stage
bun run destroy -- --stage pr-123
```

### Other Commands
```bash
# Build CSS only
bun run build:css

# Run tests
bun run test

# Test webhook
bun run test:webhook https://your-worker.workers.dev/api/github/webhook

# Database operations
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
```

## 🔧 How It Works

### Local Execution
When you run `bun ./alchemy.run.ts`, Bun:
1. Parses command-line arguments (`--stage`, `--adopt`, `--destroy`)
2. Executes your infrastructure code
3. Connects to Cloudflare APIs
4. Creates/updates/deletes resources as needed

### Hot Reload (`--watch`)
The `alchemy:dev` script uses `bun --watch`:
```bash
bun --watch ./alchemy.run.ts --dev
```
- Watches for file changes
- Automatically restarts on save
- Passes `--dev` flag to enable local Miniflare emulation

### Stage Management
Stages isolate environments:
```bash
# Personal development
bun ./alchemy.run.ts --stage nolarose

# Pull request preview
bun ./alchemy.run.ts --stage pr-42

# Production
bun ./alchemy.run.ts --stage prod
```

Each stage creates separate Cloudflare resources with unique names.

## 🚀 GitHub Actions Workflow

### Automatic Stage Naming

The `.github/workflows/alchemy.yml` workflow automatically computes stage names:

| Trigger | Stage Name | Example |
|---------|-----------|---------|
| Push to `main` | `prod` | Production deployment |
| Pull request | `pr-{number}` | `pr-42` |
| Other branches | `personal` | Personal/dev stage |

### Workflow Steps

1. **Checkout**: Clone the repository
2. **Setup Bun**: Install latest Bun runtime
3. **Install**: `bun install --frozen-lockfile`
4. **Compute stage**: Determine stage name from context
5. **Build CSS**: Run Tailwind CSS build
6. **Deploy**: Execute `bun ./alchemy.run.ts --stage {computed} --adopt`
7. **Health check**: (prod only) Verify deployment health

### Environment Variables

The workflow automatically sets:
```yaml
env:
  ALCHEMY_PROFILE: default
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🔐 Required GitHub Secrets

### Mandatory Secrets

1. **`CLOUDFLARE_ACCOUNT_ID`**
   - Your Cloudflare account ID
   - Find at: https://dash.cloudflare.com/
   - Format: `abc123def456...`

2. **`CLOUDFLARE_API_TOKEN`**
   - API token with Edit permissions
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Required scopes:
     - Workers Scripts: Edit
     - D1: Edit
     - R2: Edit
     - KV: Edit
     - Queues: Edit
     - Durable Objects: Edit

3. **`ALCHEMY_PASSWORD`**
   - Encryption password for secrets
   - Generate: `openssl rand -base64 32`
   - Used by `alchemy.secret()`

### Optional Secrets

4. **`PROD_URL`** (optional)
   - Production worker URL for health checks
   - Example: `https://website-prod.your-account.workers.dev`
   - Only used for prod health checks

5. **`GITHUB_TOKEN`** (automatic)
   - Automatically provided by GitHub Actions
   - No setup needed
   - Used for GitHub integrations

6. **`MCP_SHARED_SECRET`** (optional)
   - MCP server authentication secret
   - Only needed if using MCP features

7. **`MCP_JWT_SECRET`** (optional)
   - JWT signing secret for MCP
   - Only needed if using MCP features

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to: **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value
5. Click **Add secret**

## 🧪 Testing Locally

### Quick Test
```bash
# 1. Deploy to personal stage
bun run deploy -- --stage $USER --adopt

# 2. Verify deployment
curl https://website-$USER.your-account.workers.dev/api/health

# 3. Clean up
bun run destroy -- --stage $USER
```

### Full Development Flow
```bash
# 1. Start dev server
bun run dev

# 2. Make changes to alchemy.run.ts or src/

# 3. Watch auto-reload in terminal

# 4. Test locally at http://localhost:8788

# 5. Deploy when ready
bun run deploy -- --stage dev
```

## 📋 Migration from Old Workflow

If you were using the old `deploy.yml` workflow:

### What Changed
| Old | New |
|-----|-----|
| `bun alchemy dev` | `bun run alchemy:dev` |
| `bun alchemy deploy --stage prod` | `bun run deploy:prod` |
| `bun alchemy destroy --stage pr-1` | `bun run destroy -- --stage pr-1` |

### Benefits
- ✅ Direct execution of `alchemy.run.ts`
- ✅ No CLI dependency confusion
- ✅ Simpler, more explicit scripts
- ✅ Better control over arguments
- ✅ Same commands work locally and in CI

### Breaking Changes
None! The new scripts are fully compatible. You can use both workflows simultaneously during migration.

## 🔍 Troubleshooting

### Local Development Issues

**Problem**: `bun run alchemy:dev` doesn't watch changes

**Solution**: Ensure you're using Bun 1.0+
```bash
bun --version  # Should be >= 1.0.0
bun upgrade
```

**Problem**: `Cannot find module './alchemy.run.ts'`

**Solution**: Run from project root
```bash
cd /path/to/alchmenyrun
bun run alchemy:dev
```

### Deployment Issues

**Problem**: `CLOUDFLARE_API_TOKEN` not found

**Solution**: Ensure secrets are set correctly
```bash
# For local deployment, add to .env
echo "CLOUDFLARE_API_TOKEN=your-token" >> .env

# For CI, check GitHub secrets
```

**Problem**: `process.env.ALCHEMY_PASSWORD` is undefined

**Solution**: Set password in environment
```bash
# Local
export ALCHEMY_PASSWORD="your-secure-password"

# Or in .env
echo "ALCHEMY_PASSWORD=your-secure-password" >> .env
```

### CI/CD Issues

**Problem**: Workflow fails on `bun install`

**Solution**: Delete `node_modules` and regenerate lockfile
```bash
rm -rf node_modules bun.lock
bun install
git add bun.lock
git commit -m "Update bun.lock"
```

**Problem**: Stage name not computed correctly

**Solution**: Check workflow logs for stage computation step
```yaml
- name: Compute stage
  id: stage
  run: |
    echo "Computed stage: ${{ steps.stage.outputs.name }}"
```

**Problem**: Health check fails for prod

**Solution**: Ensure `PROD_URL` secret is set and correct
```bash
# Test manually first
curl https://website-prod.your-account.workers.dev/api/health
```

## 🎓 Best Practices

### Local Development
1. **Use personal stages**: `bun run deploy -- --stage $USER`
2. **Always adopt**: Add `--adopt` to avoid recreating resources
3. **Clean up**: Destroy personal stages when done
4. **Test before pushing**: Deploy to personal stage first

### CI/CD
1. **Use PR previews**: Every PR gets isolated environment
2. **Review before merge**: Check PR preview before merging to main
3. **Monitor production**: Set up alerts for prod health checks
4. **Rotate secrets**: Update API tokens periodically

### Stage Naming
1. **Use consistent names**: `prod`, `staging`, `pr-{number}`
2. **Avoid spaces**: Use hyphens or underscores
3. **Keep it short**: Stage name affects resource names
4. **Document stages**: Maintain list of active stages

### Resource Management
1. **Use `--adopt`**: Prevents duplicate resources
2. **Clean up PR stages**: Workflow auto-destroys on PR close
3. **Monitor quotas**: Check Cloudflare usage regularly
4. **Use stages for isolation**: Don't share resources across stages

## 📊 Workflow Comparison

### Old Workflow (deploy.yml)
```yaml
- name: Deploy
  run: bun alchemy deploy --stage ${{ env.STAGE }}
  env:
    ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
    ALCHEMY_STATE_TOKEN: ${{ secrets.ALCHEMY_STATE_TOKEN }}
    # ... many more env vars
```

### New Workflow (alchemy.yml)
```yaml
- name: Deploy
  run: bun ./alchemy.run.ts --stage ${{ steps.stage.outputs.name }} --adopt
  env:
    ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    # Minimal required env vars
```

**Benefits**:
- ✅ 50% fewer lines
- ✅ 70% fewer environment variables
- ✅ Direct script execution
- ✅ Clearer intent
- ✅ Easier to debug

## 🔗 Resources

- [Alchemy Documentation](https://alchemy.run)
- [Bun CLI Reference](https://bun.sh/docs/cli)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)

## 📝 Example Commands

### Development
```bash
# Start local dev server
bun run alchemy:dev

# In another terminal, test endpoints
curl http://localhost:8788/api/health
```

### Staging Deployment
```bash
# Deploy to staging
bun run deploy -- --stage staging

# Test staging
curl https://website-staging.your-account.workers.dev/api/health

# Clean up
bun run destroy -- --stage staging
```

### Production Deployment
```bash
# Deploy to prod (via git push)
git push origin main

# Or manually
bun run deploy:prod

# Verify
curl https://website-prod.your-account.workers.dev/api/health
```

### PR Preview
```bash
# Automatic on PR open
# View at: https://website-pr-42.your-account.workers.dev

# Manual test of PR stage
bun run deploy -- --stage pr-42 --adopt
```

## 🎉 Summary

This CLI + CI setup provides:
- **Unified commands**: Same locally and in CI
- **Automatic stages**: PR previews, prod deploys
- **Minimal config**: Just 3 required secrets
- **Fast feedback**: Hot reload, quick deploys
- **Clean isolation**: Stages prevent conflicts

You're now ready to develop, deploy, and iterate with confidence! 🚀

