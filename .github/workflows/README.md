# GitHub Actions Workflows

This directory contains two GitHub Actions workflows for CI/CD.

## Active Workflows

### alchemy.yml (✅ Recommended)
**Streamlined CLI + CI workflow** - Runs `alchemy.run.ts` directly

**Features:**
- Direct execution of infrastructure code
- Automatic stage computation
- Minimal environment variables
- Cleaner, more maintainable
- Matches local development experience

**Triggers:**
- Push to `main` → Deploys to `prod`
- Pull requests → Deploys to `pr-{number}`

**Required Secrets:**
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `ALCHEMY_PASSWORD`
- `PROD_URL` (optional, for health checks)

### deploy.yml (🔄 Legacy)
**Original workflow** - Uses Alchemy CLI commands

**Features:**
- Uses `bun alchemy deploy` commands
- More environment variables
- Includes MCP tests
- Separate cleanup job for PR close

**Triggers:**
- Push to `main` → Deploys to `prod`
- Pull requests → Deploys to `pr-{number}`
- PR close → Runs cleanup job

**Required Secrets:**
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `ALCHEMY_PASSWORD`
- `ALCHEMY_STATE_TOKEN`
- `CLOUDFLARE_EMAIL`
- Plus MCP secrets if using MCP features

## Migration Guide

### Switching to alchemy.yml

The new workflow is fully compatible. To migrate:

1. **Test locally first:**
   ```bash
   bun run alchemy:dev
   bun run deploy -- --stage test
   ```

2. **Update GitHub secrets:**
   - Ensure `CLOUDFLARE_ACCOUNT_ID` is set
   - Ensure `CLOUDFLARE_API_TOKEN` is set
   - Ensure `ALCHEMY_PASSWORD` is set
   - Optionally add `PROD_URL` for health checks

3. **Disable old workflow** (optional):
   ```bash
   # Rename to disable
   mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
   ```

4. **Test with a PR:**
   - Open a test PR
   - Verify `alchemy.yml` runs
   - Check deployment succeeds
   - Confirm stage is created

### Running Both Workflows

You can run both workflows simultaneously:
- Both will deploy to the same stages
- `alchemy.yml` is faster and simpler
- `deploy.yml` includes MCP tests
- No conflicts between them

### Key Differences

| Feature | alchemy.yml | deploy.yml |
|---------|-------------|------------|
| Execution | Direct `bun ./alchemy.run.ts` | Via `bun alchemy` CLI |
| Secrets | 3-4 required | 7+ required |
| Lines of code | ~45 | ~86 |
| MCP tests | No | Yes |
| Cleanup job | No (Alchemy auto-handles) | Separate job |
| Stage naming | Computed in workflow | Env var |

## Workflow Files

### alchemy.yml Structure
```yaml
name: Alchemy
on: [push to main, pull_request]

jobs:
  deploy:
    - Checkout
    - Setup Bun
    - Install dependencies
    - Compute stage name
    - Build CSS
    - Deploy via bun ./alchemy.run.ts
    - Health check (prod only)
```

### deploy.yml Structure
```yaml
name: Deploy Application
on: [push to main, pull_request (open/sync/close)]

jobs:
  deploy:
    - Checkout
    - Setup Bun
    - Install dependencies
    - Run tests
    - Run MCP tests
    - Deploy via bun alchemy deploy
  
  cleanup: (on PR close)
    - Checkout
    - Setup Bun
    - Install dependencies
    - Destroy stage
```

## Stage Naming

### alchemy.yml
```bash
if PR: pr-{number}
if main: prod
else: personal
```

### deploy.yml
```bash
if PR: pr-{number}
if main: prod
```

## Health Checks

### alchemy.yml
```yaml
- name: Health check (prod only)
  if: stage == 'prod'
  run: curl -f ${{ secrets.PROD_URL }}/api/health
```

### deploy.yml
No health check included

## Recommendations

### For New Projects
✅ Use **alchemy.yml**
- Simpler setup
- Fewer secrets
- Direct execution
- Better debugging

### For Existing Projects
🔄 Keep **deploy.yml** if:
- You need MCP tests in CI
- You have many environment variables
- You use `ALCHEMY_STATE_TOKEN`

✅ Migrate to **alchemy.yml** if:
- You want simpler CI
- You don't need MCP tests in CI
- You want faster builds

### For Maximum Compatibility
✨ Run **both** workflows:
- No conflicts
- Gradual migration
- Test new workflow before removing old

## Troubleshooting

### alchemy.yml issues

**Problem**: Stage not computed correctly
```yaml
# Check logs in "Compute stage" step
# Verify event type and ref
```

**Problem**: Health check fails
```yaml
# Ensure PROD_URL secret is set
# Test manually: curl https://your-url/api/health
```

### deploy.yml issues

**Problem**: Too many environment variables
```yaml
# Only set the ones you actually use
# Remove unused secrets from workflow
```

**Problem**: Cleanup not running
```yaml
# Check PR is actually closed
# Verify cleanup job triggers
```

## Next Steps

1. Review [CLI_CI_SETUP.md](../../CLI_CI_SETUP.md) for full guide
2. Test workflows with a PR
3. Monitor deployment logs
4. Set up notifications for failures
5. Document your team's chosen workflow

## Support

- **Alchemy Docs**: https://alchemy.run
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Project Issues**: https://github.com/brendadeeznuts1111/alchmenyrun/issues

