# CI/CD Guide

Complete guide to Continuous Integration and Deployment with Alchemy.

## Overview

This project uses GitHub Actions for CI/CD with Alchemy's stage-based deployment system. Based on the [official Alchemy CI guide](https://alchemy.run/guides/ci/), the workflow supports:

- **Production deployments** on push to `main`
- **Preview environments** for each pull request
- **Automatic cleanup** when PRs are closed
- **State management** with Cloudflare LiveStore

## GitHub Actions Workflow

### File: `.github/workflows/deploy.yml`

The workflow handles three scenarios:

1. **Push to main** → Deploy to production (`prod` stage)
2. **Open/update PR** → Deploy to preview environment (`pr-{number}` stage)
3. **Close PR** → Destroy preview environment

### Workflow Structure

```yaml
name: Deploy Application

on:
  push:
    branches:
      - main
  pull_request:
    types:
      - opened
      - reopened
      - synchronize
      - closed

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

env:
  STAGE: ${{ github.ref == 'refs/heads/main' && 'prod' || format('pr-{0}', github.event.number) }}
```

**Key Features:**
- **Concurrency control**: Prevents multiple deployments to same environment
- **Dynamic staging**: Automatically determines stage based on branch/PR
- **PR-based preview environments**: Each PR gets its own isolated environment

## Jobs

### 1. Deploy Job

Runs on push to main or PR open/update:

```yaml
jobs:
  deploy:
    if: ${{ github.event.action != 'closed' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install
      - name: Run tests
        run: bun run test
      - name: Deploy
        run: bun alchemy deploy --stage ${{ env.STAGE }}
        env:
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          ALCHEMY_STATE_TOKEN: ${{ secrets.ALCHEMY_STATE_TOKEN }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_EMAIL: ${{ secrets.CLOUDFLARE_EMAIL }}
          PULL_REQUEST: ${{ github.event.number }}
          GITHUB_SHA: ${{ github.sha }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**What it does:**
1. Checks out code
2. Sets up Bun runtime
3. Installs dependencies
4. Runs tests
5. Deploys to appropriate stage

### 2. Cleanup Job

Runs when PR is closed:

```yaml
  cleanup:
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'pull_request' && github.event.action == 'closed' }}
    permissions:
      id-token: write
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install
      - name: Destroy Preview Environment
        run: bun alchemy destroy --stage ${{ env.STAGE }}
        env:
          ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
          ALCHEMY_STATE_TOKEN: ${{ secrets.ALCHEMY_STATE_TOKEN }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_EMAIL: ${{ secrets.CLOUDFLARE_EMAIL }}
          PULL_REQUEST: ${{ github.event.number }}
```

**What it does:**
1. Checks out code
2. Sets up Bun runtime
3. Installs dependencies
4. Destroys the PR's preview environment

## Required Secrets

Configure these secrets in GitHub Settings → Secrets and variables → Actions:

### 1. ALCHEMY_PASSWORD
**Required**: Yes  
**Purpose**: Encrypts secrets in Alchemy state files

```bash
# Generate a secure password
openssl rand -base64 32
```

Add to GitHub secrets: `Settings → Secrets → New repository secret`

### 2. ALCHEMY_STATE_TOKEN (Optional but Recommended)
**Required**: No (uses local state if not set)  
**Purpose**: Stores state in Cloudflare LiveStore for team collaboration

**Setup:**
1. Create LiveStore in `alchemy.run.ts`:
   ```typescript
   import { LiveStore } from "alchemy/cloudflare";
   
   export const state = await LiveStore("state", {
     name: "my-app-state",
   });
   ```

2. Generate token:
   ```bash
   bun alchemy state token
   ```

3. Add to GitHub secrets

### 3. CLOUDFLARE_API_TOKEN
**Required**: Yes  
**Purpose**: Authenticates with Cloudflare API

**Setup:**
1. Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom token with:
   - Account → Cloudflare Workers Scripts → Edit
   - Account → Account Settings → Read
   - Account → D1 → Edit
   - Account → R2 → Edit
   - Account → Workers KV Storage → Edit
   - Account → Workers Queues → Edit
   - Account → Durable Objects → Edit
   - Zone → Workers Routes → Edit (if using custom domains)
   - Zone → DNS → Edit (if using custom domains)
4. Copy token and add to GitHub secrets

**Or use Alchemy utility:**
```bash
bun alchemy util create-cloudflare-token
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed guide.

### 4. CLOUDFLARE_EMAIL
**Required**: Yes  
**Purpose**: Your Cloudflare account email

Add your Cloudflare account email to GitHub secrets.

## Stage-Based Deployment

### Production Stage (`prod`)

Deployed on push to `main` branch:

```bash
# Triggered automatically by push to main
git push origin main
```

**Access:**
- URL: `https://website-prod.{account}.workers.dev`
- Stage: `prod`

### Preview Stages (`pr-{number}`)

Each PR gets an isolated preview environment:

```bash
# Triggered automatically when PR is opened/updated
# No manual action needed
```

**Access:**
- URL: `https://website-pr-123.{account}.workers.dev` (for PR #123)
- Stage: `pr-123`

**Lifecycle:**
1. PR opened → Preview environment created
2. PR updated → Preview environment updated
3. PR closed → Preview environment destroyed (automatic cleanup)

## State Management

### Local State (Default)

State files stored in `.alchemy/` directory:

```
.alchemy/
├── state/
│   ├── prod.json
│   └── pr-123.json
└── ...
```

**Pros:**
- Simple setup
- No additional configuration
- Works offline

**Cons:**
- Not suitable for team collaboration
- Requires committing state to git

### LiveStore (Recommended for Teams)

State stored in Cloudflare KV for team collaboration:

**Setup in `alchemy.run.ts`:**
```typescript
import { LiveStore } from "alchemy/cloudflare";

export const state = await LiveStore("state", {
  name: "my-app-state",
});
```

**Generate token:**
```bash
bun alchemy state token
```

**Add to CI:**
Set `ALCHEMY_STATE_TOKEN` secret in GitHub

**Pros:**
- Team collaboration
- No state in git
- Automatic conflict resolution
- Audit trail

**Cons:**
- Requires Cloudflare account
- Additional setup

## Testing in CI

Tests run before deployment:

```yaml
- name: Run tests
  run: bun run test
```

**Test Types:**
- Unit tests
- Integration tests with Miniflare
- E2E tests

**Failure Handling:**
- Tests must pass for deployment to succeed
- Failed tests block deployment
- Review logs in GitHub Actions

## Manual Deployment

Deploy manually from local machine:

```bash
# Deploy to production
bun alchemy deploy --stage prod

# Deploy to preview
bun alchemy deploy --stage pr-123

# Deploy to custom stage
bun alchemy deploy --stage staging
```

## Monitoring Deployments

### GitHub Actions UI

1. Go to repository → Actions tab
2. View workflow runs
3. Check job logs
4. Review deployment URLs

### Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages → Workers
3. View deployed workers by stage
4. Check analytics and logs

## Preview Environment URLs

After deployment, URLs are available in:

1. **GitHub Actions logs:**
   ```
   {
     url: "https://website-pr-123.{account}.workers.dev",
     apiUrl: "https://website-pr-123.{account}.workers.dev"
   }
   ```

2. **PR comments** (if configured):
   Alchemy can post deployment URLs to PR comments

3. **Cloudflare Dashboard:**
   Workers → {worker-name} → Settings

## Rollback

### Roll back production

```bash
# Deploy previous commit
git revert HEAD
git push origin main
```

### Roll back preview

```bash
# Force update PR with previous commit
git reset --hard HEAD~1
git push --force origin feature-branch
```

## Multi-Environment Setup

### Development → Staging → Production

Create multiple workflows:

**1. Preview environments (PRs):**
```yaml
# .github/workflows/preview.yml
env:
  STAGE: pr-${{ github.event.number }}
```

**2. Staging (develop branch):**
```yaml
# .github/workflows/staging.yml
on:
  push:
    branches: [develop]
env:
  STAGE: staging
```

**3. Production (main branch):**
```yaml
# .github/workflows/production.yml
on:
  push:
    branches: [main]
env:
  STAGE: prod
```

## Custom Domains

Add custom domains per stage in `alchemy.run.ts`:

```typescript
const website = await BunSPA("website", {
  frontend: "src/frontend/index.html",
  entrypoint: "src/backend/server.ts",
  domains: [
    // Production domain
    ...(process.env.STAGE === "prod" ? ["app.example.com"] : []),
    // Staging domain
    ...(process.env.STAGE === "staging" ? ["staging.example.com"] : []),
  ],
});
```

## Debugging CI Issues

### Deployment fails

1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Ensure Cloudflare account has necessary permissions
4. Check for resource conflicts

### Tests fail in CI

1. Review test logs
2. Ensure environment variables are set
3. Check Miniflare compatibility
4. Verify test timeouts

### State conflicts

1. Use LiveStore for team collaboration
2. Ensure `ALCHEMY_STATE_TOKEN` is set
3. Check state file permissions
4. Review state merge conflicts

## Best Practices

1. **Use LiveStore** for team collaboration
2. **Test before deploy** with comprehensive test suite
3. **Stage naming** follow consistent convention (`prod`, `staging`, `pr-{number}`)
4. **Preview environments** for all PRs
5. **Automatic cleanup** of preview environments
6. **Monitor deployments** in Cloudflare Dashboard
7. **Secure secrets** never commit secrets to git
8. **Document workflow** keep CI/CD docs updated

## Security

- **Secrets management**: Use GitHub Secrets
- **Token rotation**: Rotate tokens regularly
- **Permissions**: Use least privilege
- **Audit logs**: Monitor deployment history
- **State encryption**: Always set `ALCHEMY_PASSWORD`

## Resources

- [Official Alchemy CI Guide](https://alchemy.run/guides/ci/)
- [Alchemy State Management](https://alchemy.run/concepts/state/)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Example: Complete CI/CD Flow

1. **Developer creates PR:**
   - Pushes feature branch
   - Opens PR to main

2. **GitHub Actions triggers:**
   - Checkout code
   - Install dependencies
   - Run tests
   - Deploy to `pr-123` stage

3. **Preview environment created:**
   - URL: `https://website-pr-123.{account}.workers.dev`
   - All resources isolated from production

4. **PR reviewed and merged:**
   - GitHub Actions deploys to `prod` stage
   - Production updated

5. **PR closed:**
   - Cleanup job triggers
   - Preview environment destroyed
   - Resources cleaned up

---

**Status:** Production-ready CI/CD pipeline following [Alchemy best practices](https://alchemy.run/guides/ci/)

