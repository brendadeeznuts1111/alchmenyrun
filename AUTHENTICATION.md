# Cloudflare Authentication Guide

Complete guide to configuring Cloudflare authentication for Alchemy. Based on the [official Alchemy Cloudflare Auth guide](https://alchemy.run/guides/cloudflare/).

## Authentication Methods

Alchemy supports three authentication methods with Cloudflare:

1. **OAuth (Recommended)** - Short-lived access and refresh tokens
2. **API Token** - Scoped token with limited permissions
3. **Global API Key (Legacy)** - Global, highly permissive key (not recommended)

## Method 1: OAuth (Recommended)

OAuth provides the most secure authentication with short-lived tokens.

### Setup

1. **Configure Profile:**
   ```bash
   bun alchemy configure
   ```
   Select OAuth for Cloudflare when prompted.

2. **Login to Cloudflare:**
   ```bash
   bun alchemy login
   ```
   This opens your browser to authenticate with Cloudflare.

3. **Deploy:**
   ```bash
   bun alchemy deploy
   ```
   Alchemy automatically uses OAuth tokens from your profile.

### Using Multiple Profiles

Create multiple profiles for different accounts:

```bash
# Create profile for work account
bun alchemy configure --profile work

# Create profile for personal account
bun alchemy configure --profile personal
```

Deploy with specific profile:

```bash
# Deploy with work profile
bun alchemy deploy --profile work

# Deploy with personal profile
bun alchemy deploy --profile personal
```

### Profile Storage

OAuth tokens are stored in:
```
~/.alchemy/profiles/
├── default.json
├── work.json
└── personal.json
```

### Token Refresh

Refresh OAuth tokens when they expire:

```bash
bun alchemy login --profile work
```

## Method 2: API Token

API tokens provide scoped access to specific Cloudflare services.

### Creating an API Token

1. Go to [Cloudflare Dashboard → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)

2. Click **"Create Token"**

3. **Option A: Use Template**
   - Select "Edit Cloudflare Workers" template
   - Adjust permissions as needed

4. **Option B: Custom Token**
   Create custom token with these permissions:

   **Account Permissions:**
   - Account → Cloudflare Workers Scripts → Edit
   - Account → Account Settings → Read
   - Account → D1 → Edit
   - Account → R2 → Edit
   - Account → Workers KV Storage → Edit
   - Account → Workers Queues → Edit
   - Account → Durable Objects → Edit

   **Zone Permissions (if using custom domains):**
   - Zone → Workers Routes → Edit
   - Zone → DNS → Edit

5. Copy the token (shown only once!)

### Using API Token

**Method A: Environment Variable (Recommended)**

Add to `.env`:
```bash
CLOUDFLARE_API_TOKEN=your-api-token-here
```

Deploy:
```bash
bun alchemy deploy
```

**Method B: Inline**

```bash
CLOUDFLARE_API_TOKEN=your-token bun alchemy deploy
```

**Method C: In Code**

```typescript
import { Worker } from "alchemy/cloudflare";

await Worker("my-worker", {
  apiToken: alchemy.secret(process.env.MY_TOKEN),
  entrypoint: "./src/worker.ts",
});
```

⚠️ **Note:** Using `alchemy.secret()` requires setting `ALCHEMY_PASSWORD`.

### Utility: Create Cloudflare Token

Alchemy provides a CLI utility to create tokens:

```bash
# Create token from profile
bun alchemy util create-cloudflare-token

# Create "god" token with full access
bun alchemy util create-cloudflare-token --full
```

## Method 3: Global API Key (Legacy)

⚠️ **Not recommended.** Use OAuth or API Tokens instead.

Global API Keys have broad permissions and are less secure.

### Getting Global API Key

1. Go to [Cloudflare Dashboard → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Scroll to "Global API Key" section
3. Click "View" and verify your identity
4. Copy the key

### Using Global API Key

Requires both API key and email:

**Environment Variables:**
```bash
CLOUDFLARE_API_KEY=your-global-api-key
CLOUDFLARE_EMAIL=your-email@example.com
```

**Deploy:**
```bash
CLOUDFLARE_EMAIL=me@example.com CLOUDFLARE_API_KEY=key bun alchemy deploy
```

**In Code:**
```typescript
await Worker("my-worker", {
  apiKey: alchemy.secret(process.env.MY_GLOBAL_KEY),
  email: "me@example.com",
  entrypoint: "./src/worker.ts",
});
```

## Account ID

### Automatic Resolution

By default, Alchemy automatically resolves your account ID from:
1. Profile configuration
2. API key/token lookup

```bash
# Uses first account you have access to
bun alchemy deploy
```

⚠️ **Warning:** If your token has access to multiple accounts, Alchemy picks the first one arbitrarily.

### Manual Override

**Method A: Environment Variable**

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id bun alchemy deploy
```

**Method B: In Code**

```typescript
await Worker("my-worker", {
  accountId: "my-account-id",
  entrypoint: "./src/worker.ts",
});
```

### Finding Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Account ID is shown in the URL: `dash.cloudflare.com/{account-id}/`
4. Or find it in Workers & Pages → Overview → Account ID

## CI/CD Authentication

### GitHub Actions

For CI/CD, use API tokens (not OAuth):

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_EMAIL: ${{ secrets.CLOUDFLARE_EMAIL }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Setup:**
1. Create API token (see above)
2. Add secrets to GitHub:
   - Settings → Secrets → New repository secret
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_EMAIL` (if using Global API Key)
   - Add `CLOUDFLARE_ACCOUNT_ID` (optional)

### Other CI Systems

Same principle applies:
- Store tokens as secure environment variables
- Use API tokens, not OAuth
- Set account ID if needed

## Security Best Practices

### 1. Use OAuth When Possible
- Short-lived tokens
- Automatic refresh
- Better security

### 2. Scope API Tokens
- Only grant necessary permissions
- Use token templates
- Rotate tokens regularly

### 3. Protect Secrets
- Never commit tokens to git
- Use `.env` for local development
- Use secure CI/CD secrets
- Encrypt with `alchemy.secret()`

### 4. Separate Environments
- Use different tokens for dev/prod
- Use profiles for different accounts
- Isolate team member access

### 5. Monitor Token Usage
- Check Cloudflare audit logs
- Rotate compromised tokens immediately
- Review token permissions regularly

## Encryption Password

When using `alchemy.secret()`, you must set `ALCHEMY_PASSWORD`:

```bash
# .env
ALCHEMY_PASSWORD=your-secure-password-here
```

This encrypts secrets in state files.

**Generate secure password:**
```bash
openssl rand -base64 32
```

## Troubleshooting

### OAuth Tokens Expired

```bash
Error: OAuth tokens expired
```

**Solution:**
```bash
bun alchemy login --profile your-profile
```

### Invalid API Token

```bash
Error: Authentication error (code 10000)
```

**Solutions:**
1. Verify token is correct
2. Check token hasn't expired
3. Ensure token has required permissions
4. Try creating new token

### Multiple Accounts

```bash
Warning: Multiple accounts found, using first
```

**Solution:**
Set account ID explicitly:
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id bun alchemy deploy
```

### Permission Denied

```bash
Error: Permission denied (code 10003)
```

**Solutions:**
1. Check token permissions
2. Verify account ID is correct
3. Ensure you have access to the account

### Global API Key Requires Email

```bash
Error: Email required for Global API Key
```

**Solution:**
Set `CLOUDFLARE_EMAIL`:
```bash
CLOUDFLARE_EMAIL=you@example.com bun alchemy deploy
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | For API Token auth | Scoped API token |
| `CLOUDFLARE_API_KEY` | For Global Key auth | Global API key (legacy) |
| `CLOUDFLARE_EMAIL` | With Global Key | Account email |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Explicit account ID |
| `ALCHEMY_PASSWORD` | For secrets | Encrypts state secrets |

## Example Configurations

### Local Development (OAuth)

```bash
# Configure once
bun alchemy configure

# Login
bun alchemy login

# Deploy
bun alchemy dev
bun alchemy deploy
```

### Local Development (API Token)

```bash
# .env
CLOUDFLARE_API_TOKEN=your-token
ALCHEMY_PASSWORD=your-password

# Deploy
bun alchemy dev
bun alchemy deploy
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_EMAIL: ${{ secrets.CLOUDFLARE_EMAIL }}
  ALCHEMY_PASSWORD: ${{ secrets.ALCHEMY_PASSWORD }}
```

### Multi-Account Setup

```bash
# Work account
bun alchemy configure --profile work
bun alchemy login --profile work
bun alchemy deploy --profile work

# Personal account
bun alchemy configure --profile personal
bun alchemy login --profile personal
bun alchemy deploy --profile personal
```

## Quick Start

**For personal projects:**
```bash
bun alchemy configure  # Select OAuth
bun alchemy login
bun alchemy deploy
```

**For teams/CI:**
1. Create API token at [dash.cloudflare.com](https://dash.cloudflare.com/profile/api-tokens)
2. Add to `.env`: `CLOUDFLARE_API_TOKEN=your-token`
3. Deploy: `bun alchemy deploy`

## Resources

- [Official Alchemy Cloudflare Auth Guide](https://alchemy.run/guides/cloudflare/)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [Alchemy Profiles](https://alchemy.run/concepts/profiles/)
- [Alchemy Secrets](https://alchemy.run/concepts/secret/)

---

**Recommendation:** Use OAuth for local development and API Tokens for CI/CD.

