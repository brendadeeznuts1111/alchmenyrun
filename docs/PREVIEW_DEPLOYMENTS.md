# Preview Deployments Guide

This guide explains how to use Alchemy's automatic preview deployments with PR comments.

## 🎯 Overview

Every pull request automatically gets:
- ✅ Isolated `pr-{number}` stage deployment
- ✅ Live preview URL posted as PR comment
- ✅ Auto-update on every push to the PR
- ✅ Automatic cleanup when PR closes

## 🚀 What You Get

When you open a PR, GitHub Actions will:

1. **Deploy** to `pr-{number}` stage
2. **Post** a comment with preview URLs:

```markdown
## 🚀 Preview Deployed

Your changes have been deployed to a preview environment:

**🌐 Website:** https://website-pr-42.your-account.workers.dev
**📡 API:** https://website-pr-42.your-account.workers.dev/api

Built from commit `abc123d`

---
🤖 This comment updates automatically with each push.
```

3. **Update** the comment on every new push
4. **Clean up** all resources when PR closes

## 📋 Setup Requirements

### 1. GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `ALCHEMY_PASSWORD` | Encryption password | `openssl rand -base64 32` |
| `ALCHEMY_STATE_TOKEN` | Cloudflare API token for state store | Create with D1 write permissions |
| `CLOUDFLARE_API_TOKEN` | Main Cloudflare API token | Edit permissions on Workers/D1/R2/KV |
| `CLOUDFLARE_EMAIL` | Email for Cloudflare account | Your Cloudflare account email |

### 2. State Store Token

The `ALCHEMY_STATE_TOKEN` needs special permissions:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. **Add D1 permissions**: Account → D1 → Edit
5. Copy the token to `ALCHEMY_STATE_TOKEN` secret

### 3. Repository Permissions

Ensure the workflow has PR write permissions (already configured in `deploy.yml`):

```yaml
permissions:
  contents: read
  pull-requests: write
```

## 🔧 How It Works

### Infrastructure Code (`alchemy.run.ts`)

```typescript
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";

// Use Cloudflare D1 for state storage
const app = await alchemy("cloudflare-demo", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

// ... your resources ...

// Post preview comment if running in PR
if (process.env.PULL_REQUEST) {
  await GitHubComment("preview-comment", {
    owner: "brendadeeznuts1111",
    repository: "alchmenyrun",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `Preview URL: ${website.url}`,
  });
}
```

### Workflow (`deploy.yml`)

```yaml
env:
  STAGE: ${{ github.ref == 'refs/heads/main' && 'prod' || format('pr-{0}', github.event.number) }}

jobs:
  deploy:
    # Deploy on push and PR open/update
    if: github.event.action != 'closed'
    env:
      PULL_REQUEST: ${{ github.event.number }}
      GITHUB_SHA: ${{ github.sha }}
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  cleanup:
    # Destroy on PR close
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
```

## 🎬 Usage

### Opening a PR

```bash
# 1. Create a branch
git checkout -b feature/my-changes

# 2. Make your changes
echo "console.log('new feature')" >> src/backend/server.ts

# 3. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/my-changes

# 4. Open PR
gh pr create --title "Add new feature" --body "Description"
```

**Result**: Within 2-3 minutes:
- ✅ Workflow runs
- ✅ Preview deployed to `pr-{number}` stage
- ✅ Comment appears with preview URL
- ✅ You can test your changes live

### Updating a PR

```bash
# 1. Make more changes
echo "console.log('update')" >> src/backend/server.ts

# 2. Commit and push
git add .
git commit -m "feat: update feature"
git push origin feature/my-changes
```

**Result**:
- ✅ Workflow runs again
- ✅ Preview redeployed
- ✅ Comment updated with new commit hash
- ✅ Same URL, updated code

### Closing a PR

```bash
# Merge and close
gh pr merge

# Or just close
gh pr close
```

**Result**:
- ✅ Cleanup workflow runs
- ✅ All `pr-{number}` resources destroyed
- ✅ No manual cleanup needed

## 🏗️ Stage Architecture

### Stage Naming

| Trigger | Stage Name | Resources |
|---------|-----------|-----------|
| PR #42 | `pr-42` | `website-pr-42`, `db-pr-42`, etc. |
| Push to main | `prod` | `website-prod`, `db-prod`, etc. |

### Resource Isolation

Each stage is completely isolated:

```
PR #1:
  ├── website-pr-1.workers.dev
  ├── db-pr-1 (D1 database)
  ├── storage-pr-1 (R2 bucket)
  └── cache-pr-1 (KV namespace)

PR #2:
  ├── website-pr-2.workers.dev
  ├── db-pr-2 (D1 database)
  ├── storage-pr-2 (R2 bucket)
  └── cache-pr-2 (KV namespace)

Production:
  ├── website-prod.workers.dev
  ├── db-prod (D1 database)
  ├── storage-prod (R2 bucket)
  └── cache-prod (KV namespace)
```

## 📊 Comment Examples

### Initial Deploy

```markdown
## 🚀 Preview Deployed

Your changes have been deployed to a preview environment:

**🌐 Website:** https://website-pr-42.brendadeeznuts1111.workers.dev
**📡 API:** https://website-pr-42.brendadeeznuts1111.workers.dev/api

Built from commit `abc123d`

---
🤖 This comment updates automatically with each push.
```

### After Update

```markdown
## 🚀 Preview Deployed

Your changes have been deployed to a preview environment:

**🌐 Website:** https://website-pr-42.brendadeeznuts1111.workers.dev
**📡 API:** https://website-pr-42.brendadeeznuts1111.workers.dev/api

Built from commit `def456e`

---
🤖 This comment updates automatically with each push.
```

**Note**: The comment gets edited in-place, not recreated.

## 🔍 Monitoring

### View Deployment Status

```bash
# In GitHub UI
Actions → Deploy Application → Latest run

# Or via CLI
gh run list --workflow=deploy.yml
gh run view <run-id>
```

### Check Preview URL

```bash
# From PR comment, or construct manually
curl https://website-pr-42.your-account.workers.dev/api/health
```

### View Logs

```bash
# Cloudflare dashboard
wrangler tail website-pr-42

# Or in dashboard: Workers & Pages → website-pr-42 → Logs
```

## 🐛 Troubleshooting

### Comment Not Appearing

**Problem**: PR opened but no comment posted

**Solutions**:
1. Check workflow ran successfully (Actions tab)
2. Verify `GITHUB_TOKEN` has permissions
3. Check `pull-requests: write` permission in workflow
4. Verify `PULL_REQUEST` env var is set

```bash
# Test locally
export PULL_REQUEST=42
export GITHUB_SHA=abc123
bun alchemy deploy --stage pr-42
```

### State Store Errors

**Problem**: `Error: Cannot initialize state store`

**Solutions**:
1. Verify `ALCHEMY_STATE_TOKEN` is set
2. Check token has D1 write permissions
3. Ensure token is not expired

```bash
# Test token
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $ALCHEMY_STATE_TOKEN"
```

### Cleanup Not Running

**Problem**: PR closed but resources not destroyed

**Solutions**:
1. Check cleanup job ran (Actions tab)
2. Verify workflow has `closed` trigger
3. Manually destroy if needed:

```bash
bun alchemy destroy --stage pr-42
```

### Multiple Comments

**Problem**: New comment on each push instead of updating

**Solution**: Alchemy automatically updates by resource ID. If you see duplicates:
1. Delete old comments manually
2. Next push will use the newest one

## 🎓 Best Practices

### 1. Test in Preview First

Always test changes in preview before merging:

```bash
# 1. Open PR
gh pr create

# 2. Wait for preview
# 3. Test preview URL
curl https://website-pr-42.workers.dev/api/health

# 4. Verify changes work
# 5. Then merge
gh pr merge
```

### 2. Clean Up Old PRs

Close stale PRs to free resources:

```bash
# List open PRs
gh pr list

# Close old ones
gh pr close <number>
```

### 3. Use Meaningful Branch Names

Branch names help identify previews:

```bash
# Good
git checkout -b feature/user-auth
git checkout -b fix/memory-leak

# Less clear
git checkout -b test
git checkout -b asdf
```

### 4. Add Preview Link to PR Description

Template for PR description:

```markdown
## Changes
- Added user authentication
- Fixed memory leak

## Preview
<!-- Comment will appear below with preview URL -->

## Testing
1. Visit preview URL
2. Test login flow
3. Check memory usage
```

## 📈 Costs

### Cloudflare Resources

Preview deployments use Cloudflare free tier:
- **Workers**: 100,000 requests/day (free)
- **D1**: 5 GB storage (free)
- **R2**: 10 GB storage (free)
- **KV**: 1 GB storage (free)

Multiple PRs = multiple stages, but still within free tier for typical development.

### GitHub Actions

- **Minutes**: 2,000/month (free for public repos)
- **Storage**: Minimal (just npm cache)

Typical deployment: ~2-3 minutes per run.

## 🔗 Resources

- **Alchemy State Store Guide**: https://alchemy.run/guides/cloudflare-state-store
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Cloudflare State Store**: Uses D1 for deployment state
- **GitHubComment Resource**: https://alchemy.run/providers/github

## 📝 Example Workflow

### Full Development Flow

```bash
# 1. Create feature branch
git checkout -b feature/new-api

# 2. Make changes
vim src/backend/server.ts

# 3. Test locally
bun run alchemy:dev

# 4. Commit and push
git add .
git commit -m "feat: add new API endpoint"
git push origin feature/new-api

# 5. Open PR
gh pr create --title "Add new API endpoint"

# 6. Wait for preview deployment (2-3 min)

# 7. Test preview
curl https://website-pr-42.workers.dev/api/new-endpoint

# 8. Request review
gh pr ready

# 9. After approval, merge
gh pr merge

# 10. PR closes, cleanup runs automatically
```

## 🎉 Summary

Preview deployments provide:
- ✅ **Isolation**: Each PR has its own environment
- ✅ **Visibility**: URLs posted directly to PRs
- ✅ **Automation**: Deploy on push, cleanup on close
- ✅ **Zero config**: Just add secrets once
- ✅ **Free**: Uses Cloudflare free tier

You can now review code with live previews before merging to production! 🚀

