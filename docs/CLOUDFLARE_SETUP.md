# Cloudflare Setup Guide

## Required Secrets

Before deploying, you need to add these Cloudflare secrets to GitHub:

### Already Added ✅
- `MCP_SHARED_SECRET` - MCP authentication secret
- `MCP_JWT_SECRET` - JWT signing secret

### Still Need to Add ⚠️

1. **CLOUDFLARE_API_TOKEN**
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Permissions needed:
     - Account: Cloudflare Workers:Edit
     - Zone: Page Rules:Edit
     - Account: Workers KV Storage:Edit
     - Account: D1:Edit

2. **CLOUDFLARE_EMAIL**
   - Your Cloudflare account email

3. **CLOUDFLARE_ACCOUNT_ID**
   - Find at: https://dash.cloudflare.com/
   - Right sidebar → Account ID

4. **CLOUDFLARE_KV_NAMESPACE_ID**
   - Create KV namespace for state store:
   ```bash
   wrangler kv:namespace create "ALCHEMY_STATE"
   ```
   - Copy the `id` from the output

5. **ALCHEMY_PASSWORD** (if using encrypted state)
   - Set any secure password

6. **ALCHEMY_STATE_TOKEN** (if using cloud state store)
   - Generate authentication token

## Quick Setup Commands

```bash
# Add Cloudflare API token
gh secret set CLOUDFLARE_API_TOKEN -b"your-token-here"

# Add Cloudflare email
gh secret set CLOUDFLARE_EMAIL -b"your-email@example.com"

# Add Cloudflare account ID
gh secret set CLOUDFLARE_ACCOUNT_ID -b"your-account-id"

# Create KV namespace and add ID
wrangler kv:namespace create "ALCHEMY_STATE"
gh secret set CLOUDFLARE_KV_NAMESPACE_ID -b"your-namespace-id"
```

## Verification

```bash
# List all secrets
gh secret list

# Should see:
# - MCP_SHARED_SECRET ✅
# - MCP_JWT_SECRET ✅
# - CLOUDFLARE_API_TOKEN ✅
# - CLOUDFLARE_EMAIL ✅
# - CLOUDFLARE_ACCOUNT_ID ✅
# - CLOUDFLARE_KV_NAMESPACE_ID ✅
```

Once all secrets are added, push to trigger deployment:

```bash
git add .
git commit -m "feat: Add Cloudflare state store configuration"
git push origin main
```

