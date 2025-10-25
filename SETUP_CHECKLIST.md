# Setup Checklist

Quick checklist to get your Alchemy project up and running.

## ✅ Current Status

- [x] Alchemy CLI installed (v0.76.1)
- [x] Project dependencies installed
- [x] `alchemy.run.ts` configured
- [x] `.gitignore` properly configured
- [x] Authentication documentation added
- [ ] Cloudflare authentication configured
- [ ] Environment variables set up
- [ ] First deployment completed

---

## 🚀 Quick Setup (Choose One Method)

### Method 1: OAuth (Recommended for Local Development)

```bash
# Step 1: Configure Alchemy with OAuth
bun alchemy configure

# Step 2: Login to Cloudflare
bun alchemy login

# Step 3: Create .env file with password
echo "ALCHEMY_PASSWORD=$(openssl rand -base64 32)" > .env

# Step 4: Optional - Add additional secrets
echo "MCP_SHARED_SECRET=$(openssl rand -base64 32)" >> .env
echo "MCP_JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Step 5: Start development
bun run dev
```

### Method 2: API Token (Recommended for CI/CD)

```bash
# Step 1: Get your API token from Cloudflare Dashboard
# https://dash.cloudflare.com/profile/api-tokens

# Step 2: Create .env file
cat > .env << EOF
ALCHEMY_PASSWORD=$(openssl rand -base64 32)
CLOUDFLARE_API_TOKEN=your-token-here
MCP_SHARED_SECRET=$(openssl rand -base64 32)
MCP_JWT_SECRET=$(openssl rand -base64 32)
EOF

# Step 3: Start development
bun run dev
```

---

## 📋 Required Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ALCHEMY_PASSWORD` | ✅ Yes | Encrypts secrets in state | - |
| `CLOUDFLARE_API_TOKEN` | Conditional | For API token auth | - |
| `CLOUDFLARE_API_KEY` | Conditional | For global key auth | - |
| `CLOUDFLARE_EMAIL` | Conditional | With global key | - |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Pin specific account | Auto-detect |
| `MCP_SHARED_SECRET` | Optional | MCP auth secret | - |
| `MCP_JWT_SECRET` | Optional | MCP JWT signing | - |
| `ENVIRONMENT` | Optional | Environment name | `production` |

---

## 🔍 Verification Steps

### 1. Check Alchemy Configuration

```bash
# Check if profiles exist
ls ~/.alchemy/profiles/

# List configured profiles (if supported in future versions)
bun alchemy configure --list
```

### 2. Test Authentication

```bash
# Try deploying (will fail if not authenticated)
bun alchemy deploy --dry-run
```

### 3. Verify Environment Variables

```bash
# Check .env file exists
test -f .env && echo "✅ .env exists" || echo "❌ .env missing"

# Source and check variables
source .env
echo "Password set: ${ALCHEMY_PASSWORD:+yes}"
echo "API Token set: ${CLOUDFLARE_API_TOKEN:+yes}"
```

---

## 🎯 Next Steps After Setup

1. **Start Development**
   ```bash
   bun run dev
   ```

2. **Deploy to Production**
   ```bash
   bun run deploy
   ```

3. **Run Tests**
   ```bash
   bun run test
   ```

4. **Access Your Application**
   - Frontend: `https://website-prod.<account>.workers.dev`
   - MCP Server: `https://mcp-server.<account>.workers.dev`

---

## 🆘 Troubleshooting

### Authentication Issues

**Error: No authentication configured**
```bash
# Configure OAuth
bun alchemy configure
bun alchemy login
```

**Error: Invalid API token**
```bash
# Create new token at https://dash.cloudflare.com/profile/api-tokens
# Update .env with new token
```

### Missing Environment Variables

**Error: ALCHEMY_PASSWORD required**
```bash
# Generate secure password
echo "ALCHEMY_PASSWORD=$(openssl rand -base64 32)" > .env
```

### Port Already in Use

**Error: Port 3000 already in use**
```bash
# Alchemy will automatically use next available port
# Or specify custom port in alchemy.run.ts
```

---

## 📚 Additional Resources

- [Authentication Guide](./AUTHENTICATION.md) - Detailed auth setup
- [Authentication Cheat Sheet](./AUTHENTICATION_CHEATSHEET.md) - Quick reference
- [Quick Start Guide](./QUICKSTART.md) - 5-minute setup
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

---

## ✅ Ready to Deploy?

Once all checks pass, you're ready to deploy:

```bash
bun run deploy
```

You'll get URLs for:
- Frontend application
- MCP server (if configured)
- API endpoints

Happy deploying! 🚀

