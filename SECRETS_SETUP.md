# GitHub Secrets Setup Guide

Complete guide for setting up GitHub Actions secrets for preview deployments.

## 🔐 Required Secrets

You need **4 secrets** for preview deployments to work:

| Secret | Purpose | Used For |
|--------|---------|----------|
| `ALCHEMY_PASSWORD` | Encrypts sensitive data | `alchemy.secret()` calls |
| `ALCHEMY_STATE_TOKEN` | State storage in D1 | Deployment state tracking |
| `CLOUDFLARE_API_TOKEN` | Main API access | Creating/updating resources |
| `CLOUDFLARE_EMAIL` | Account identification | API authentication |

## 📝 Step-by-Step Setup

### 1. ALCHEMY_PASSWORD

**Purpose**: Encrypts secrets used in `alchemy.secret()`

**How to Generate**:
```bash
openssl rand -base64 32
```

**Example Output**:
```
k7X9mN2pQ4vR8sT1wY6zB3cF5gJ0hK4lM8nP2qR5t
```

**Add to GitHub**:
1. Go to: https://github.com/brendadeeznuts1111/alchmenyrun/settings/secrets/actions
2. Click "New repository secret"
3. Name: `ALCHEMY_PASSWORD`
4. Value: Paste the generated string
5. Click "Add secret"

---

### 2. ALCHEMY_STATE_TOKEN

**Purpose**: Allows Alchemy to store deployment state in Cloudflare D1

**How to Create**:

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Click "Use template" next to "Edit Cloudflare Workers"
4. Under "Permissions", add:
   - Account → D1 → Edit
   - Account → Workers Scripts → Edit
5. Click "Continue to summary"
6. Click "Create Token"
7. **Copy the token immediately** (you won't see it again)

**Required Permissions**:
```
Account → D1 → Edit
Account → Workers Scripts → Edit
Account → Workers KV Storage → Edit (optional, if using KV)
```

**Add to GitHub**:
1. Go to: https://github.com/brendadeeznuts1111/alchmenyrun/settings/secrets/actions
2. Click "New repository secret"
3. Name: `ALCHEMY_STATE_TOKEN`
4. Value: Paste your Cloudflare API token
5. Click "Add secret"

---

### 3. CLOUDFLARE_API_TOKEN

**Purpose**: Main token for creating and managing Cloudflare resources

**How to Create**:

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Click "Use template" next to "Edit Cloudflare Workers"
4. Under "Permissions", ensure you have:
   - Account → Workers Scripts → Edit
   - Account → D1 → Edit
   - Account → R2 → Edit
   - Account → Workers KV Storage → Edit
   - Account → Queues → Edit
   - Account → Durable Objects → Edit (if using)
5. Under "Account Resources":
   - Include → Your account
6. Under "Zone Resources" (if using custom domains):
   - Include → Specific zone → Your domain
7. Click "Continue to summary"
8. Click "Create Token"
9. **Copy the token**

**Required Permissions**:
```
Account → Workers Scripts → Edit
Account → D1 → Edit
Account → R2 → Edit
Account → Workers KV Storage → Edit
Account → Queues → Edit
```

**Add to GitHub**:
1. Go to: https://github.com/brendadeeznuts1111/alchmenyrun/settings/secrets/actions
2. Click "New repository secret"
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: Paste your Cloudflare API token
5. Click "Add secret"

---

### 4. CLOUDFLARE_EMAIL

**Purpose**: Your Cloudflare account email for authentication

**How to Get**:
1. The email you use to log into Cloudflare
2. Or find at: https://dash.cloudflare.com/profile

**Example**:
```
your-email@example.com
```

**Add to GitHub**:
1. Go to: https://github.com/brendadeeznuts1111/alchmenyrun/settings/secrets/actions
2. Click "New repository secret"
3. Name: `CLOUDFLARE_EMAIL`
4. Value: Your Cloudflare email
5. Click "Add secret"

---

## ✅ Verification

### Check All Secrets Are Set

1. Go to: https://github.com/brendadeeznuts1111/alchmenyrun/settings/secrets/actions
2. Verify you see all 4 secrets:
   - ✅ `ALCHEMY_PASSWORD`
   - ✅ `ALCHEMY_STATE_TOKEN`
   - ✅ `CLOUDFLARE_API_TOKEN`
   - ✅ `CLOUDFLARE_EMAIL`

### Test Deployment

```bash
# 1. Create a test branch
git checkout -b test/preview-setup

# 2. Make a small change
echo "# Test" >> README.md

# 3. Commit and push
git add README.md
git commit -m "test: verify preview deployments"
git push origin test/preview-setup

# 4. Open PR
gh pr create --title "Test Preview Deployment"

# 5. Wait 2-3 minutes
# 6. Check Actions tab for workflow run
# 7. Look for PR comment with preview URL
```

### Test Tokens Locally

```bash
# Test CLOUDFLARE_API_TOKEN
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN"

# Expected output:
{
  "success": true,
  "messages": [],
  "result": {
    "status": "active"
  }
}

# Test ALCHEMY_STATE_TOKEN (same command)
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_ALCHEMY_STATE_TOKEN"
```

---

## 🔄 Token Management

### Rotating Tokens

**When to Rotate**:
- Every 90 days (recommended)
- After team member leaves
- If token is compromised
- If permissions change

**How to Rotate**:

1. **Create new token** (follow steps above)
2. **Update GitHub secret**:
   - Settings → Secrets → Edit secret
   - Paste new token
   - Save
3. **Test with a PR**
4. **Revoke old token** in Cloudflare dashboard

### Token Expiration

**Check Expiration**:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Look for `expires_on` in response.

**Set Expiration** (recommended):
- 90 days for development
- 365 days for production
- Never expire only for critical automation

---

## 🐛 Troubleshooting

### "Invalid token" Error

**Problem**: Workflow fails with "Invalid token" or "Unauthorized"

**Solutions**:
1. Verify token is not expired
2. Check token has correct permissions
3. Ensure token is for correct account
4. Recreate token with all required permissions

### "Cannot create D1 database" Error

**Problem**: `ALCHEMY_STATE_TOKEN` doesn't have D1 permissions

**Solution**:
1. Edit token in Cloudflare dashboard
2. Add: Account → D1 → Edit
3. Save and update GitHub secret

### "Email mismatch" Error

**Problem**: Email doesn't match Cloudflare account

**Solution**:
1. Verify `CLOUDFLARE_EMAIL` matches your Cloudflare account
2. Check for typos
3. Update secret if needed

### "Rate limit exceeded" Error

**Problem**: Too many API requests

**Solutions**:
1. Wait a few minutes
2. Check for multiple workflows running
3. Use `--adopt` flag to avoid recreating resources

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

❌ **DON'T**:
```bash
# Bad - secrets in code
export CLOUDFLARE_API_TOKEN="abc123..."
git add .
git commit -m "add token"
```

✅ **DO**:
```bash
# Good - secrets in GitHub
# Set via: Settings → Secrets → Actions
```

### 2. Use Minimal Permissions

Only grant permissions your workflow actually needs:

```
✅ Workers Scripts: Edit  (required)
✅ D1: Edit              (required)
✅ R2: Edit              (if using R2)
❌ DNS: Edit             (not needed)
❌ Logs: Read            (not needed)
```

### 3. Separate Tokens

Use different tokens for different purposes:

```
ALCHEMY_STATE_TOKEN → Just D1 access
CLOUDFLARE_API_TOKEN → Workers, R2, KV, etc.
```

### 4. Monitor Token Usage

Check Cloudflare dashboard:
- API Tokens → Your token → Last used
- Look for unexpected usage
- Revoke if suspicious

### 5. Enable Notifications

Set up alerts for:
- Failed deployments
- Token expiration
- Unusual API usage

---

## 📋 Quick Reference

### All Required Values

```bash
# Generate password
openssl rand -base64 32

# Get email
# Your Cloudflare login email

# Get account ID
# From dashboard URL: dash.cloudflare.com/{account-id}/

# Create state token
# Cloudflare Dashboard → API Tokens → Create Token
# Template: Edit Cloudflare Workers + D1 Edit

# Create API token  
# Cloudflare Dashboard → API Tokens → Create Token
# Template: Edit Cloudflare Workers + all resource types
```

### GitHub Secrets URL

```
https://github.com/brendadeeznuts1111/alchmenyrun/settings/secrets/actions
```

### Cloudflare API Tokens URL

```
https://dash.cloudflare.com/profile/api-tokens
```

---

## 🎓 Next Steps

After setting up secrets:

1. ✅ Test with a PR
2. ✅ Verify preview comment appears
3. ✅ Check preview URL works
4. ✅ Document tokens in password manager
5. ✅ Set calendar reminder to rotate in 90 days

---

## 📚 Resources

- **Cloudflare API Tokens**: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Alchemy State Store**: https://alchemy.run/guides/cloudflare-state-store
- **Token Permissions**: https://developers.cloudflare.com/fundamentals/api/reference/permissions/

---

## ✨ Summary

Setting up secrets is a one-time process:

1. **Generate** `ALCHEMY_PASSWORD` (30 seconds)
2. **Create** `ALCHEMY_STATE_TOKEN` (2 minutes)
3. **Create** `CLOUDFLARE_API_TOKEN` (2 minutes)
4. **Find** `CLOUDFLARE_EMAIL` (10 seconds)
5. **Add** all to GitHub (2 minutes)

**Total time: ~7 minutes**

Once set up, preview deployments work automatically forever! 🎉

