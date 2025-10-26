# Alchemy Profiles Guide

Complete guide to managing credentials and configurations with Alchemy profiles.

> **Official Documentation**: [alchemy.run/concepts/profiles](https://alchemy.run/concepts/profiles.md)

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Profile Management](#profile-management)
3. [Using Profiles](#using-profiles)
4. [Configuration Files](#configuration-files)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## 🎯 Overview

### What are Profiles?

**Profiles** provide a simple way to manage credentials for cloud providers without juggling multiple `.env` files or separate login commands.

### Key Features

- ✅ **Local Storage**: Stored in `~/.alchemy` directory
- ✅ **Similar to AWS**: Behaves like [AWS profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- ✅ **Multiple Accounts**: Manage credentials for different accounts
- ✅ **Secure**: Credentials stored separately from configuration
- ✅ **Flexible**: Use per-resource, per-app, or globally

### Profile Structure

```
~/.alchemy/
├── config.json                          # Profile configurations (no secrets)
└── credentials/
    ├── default/
    │   └── cloudflare.json             # Default profile credentials
    └── prod/
        └── cloudflare.json             # Prod profile credentials
```

---

## 🔧 Profile Management

### 1. Configure Profile

Create or update a profile configuration:

```bash
# Configure default profile
alchemy configure

# Configure named profile
alchemy configure --profile prod
```

**What it does:**
- Creates/updates `~/.alchemy/config.json`
- Stores provider settings (account ID, auth method, scopes)
- **No sensitive data** stored here

### 2. Login

Authenticate and store credentials:

```bash
# Login to default profile
alchemy login

# Login to named profile
alchemy login --profile prod
```

**What it does:**
- Creates/updates `~/.alchemy/credentials/{profile}/{provider}.json`
- Stores access tokens, refresh tokens
- **Sensitive data** stored here

💡 **Tip**: Start your day with `alchemy login` to refresh credentials.

### 3. Logout

Clear profile credentials:

```bash
# Logout of default profile
alchemy logout

# Logout of named profile
alchemy logout --profile prod
```

**What it does:**
- Deletes credentials file
- Keeps configuration intact

---

## 🚀 Using Profiles

### Command Line

#### Deploy with Profile

```bash
# Use default profile
alchemy deploy

# Use named profile
alchemy deploy --profile prod

# Use profile for specific command
alchemy dev --profile staging
alchemy destroy --profile dev
```

#### Environment Variables

```bash
# Override profile globally
ALCHEMY_PROFILE=prod alchemy deploy

# Override specific provider
CLOUDFLARE_PROFILE=prod alchemy deploy
```

### In Code

#### Per-Resource Profile

```typescript
import { Worker } from "alchemy/cloudflare";

const worker = await Worker("my-worker", {
  profile: "prod", // Use prod profile for this resource
});
```

#### Global Profile (All Resources)

```typescript
const app = await alchemy("my-app", {
  profile: "prod" // All resources use prod profile
});

const worker = await Worker("api", { /* ... */ });
const db = await D1Database("database", { /* ... */ });
// Both use prod profile
```

#### Dynamic Profile Selection

```typescript
const profile = process.env.STAGE === "prod" ? "prod" : "default";

const app = await alchemy("my-app", { profile });
```

---

## 📁 Configuration Files

### config.json

Location: `~/.alchemy/config.json`

**Contains**: Profile configurations (no secrets)

```json
{
  "version": 1,
  "profiles": {
    "default": {
      "cloudflare": {
        "method": "oauth",
        "metadata": {
          "id": "<account-id>",
          "name": "<account-name>"
        },
        "scopes": [
          "account:read",
          "user:read",
          "workers:write"
        ]
      }
    },
    "prod": {
      "cloudflare": {
        "method": "api-token",
        "metadata": {
          "id": "<prod-account-id>",
          "name": "<prod-account-name>"
        }
      }
    }
  }
}
```

**Fields:**
- `method`: Authentication method (`oauth` or `api-token`)
- `metadata`: Account information
- `scopes`: OAuth scopes (for oauth method)

### credentials/{profile}/{provider}.json

Location: `~/.alchemy/credentials/{profile}/{provider}.json`

**Contains**: Provider credentials (sensitive)

```json
{
  "type": "oauth",
  "access": "<access-token>",
  "refresh": "<refresh-token>",
  "expires": 1758577621359
}
```

**Fields:**
- `type`: Credential type
- `access`: Access token
- `refresh`: Refresh token
- `expires`: Expiration timestamp

⚠️ **Security**: Never commit these files to version control!

---

## ✅ Best Practices

### 1. Use Named Profiles for Environments

```bash
# Development
alchemy configure --profile dev
alchemy login --profile dev

# Staging
alchemy configure --profile staging
alchemy login --profile staging

# Production
alchemy configure --profile prod
alchemy login --profile prod
```

### 2. Default Profile for Personal Development

```bash
# Personal development uses default profile
alchemy configure
alchemy login
alchemy deploy
```

### 3. Environment-Based Profile Selection

```typescript
// alchemy.run.ts
const getProfile = () => {
  const stage = process.env.STAGE;
  
  switch (stage) {
    case "prod":
      return "prod";
    case "staging":
      return "staging";
    default:
      return "default"; // Personal/dev
  }
};

const app = await alchemy("my-app", {
  profile: getProfile()
});
```

### 4. Separate Accounts for Production

```bash
# Development account (default profile)
alchemy configure
# Account ID: dev-account-123

# Production account (prod profile)
alchemy configure --profile prod
# Account ID: prod-account-456
```

### 5. Regular Credential Refresh

```bash
# Add to daily routine
alchemy login
alchemy login --profile prod
```

### 6. Document Profile Requirements

```typescript
/**
 * Deploy to production
 * 
 * Requirements:
 * - Production profile must be configured
 * - Run: alchemy configure --profile prod
 * - Run: alchemy login --profile prod
 * 
 * Usage: STAGE=prod bun ./alchemy.run.ts
 */
```

---

## 🎨 Examples

### Example 1: Multi-Environment Setup

```bash
# Setup profiles
alchemy configure --profile dev
alchemy configure --profile staging
alchemy configure --profile prod

# Login to all
alchemy login --profile dev
alchemy login --profile staging
alchemy login --profile prod
```

```typescript
// alchemy.run.ts
const stage = process.env.STAGE ?? "dev";
const profileMap = {
  dev: "dev",
  staging: "staging",
  prod: "prod"
};

const app = await alchemy("my-app", {
  profile: profileMap[stage],
  stage
});
```

**Deploy:**
```bash
STAGE=dev bun ./alchemy.run.ts     # Uses dev profile
STAGE=staging bun ./alchemy.run.ts # Uses staging profile
STAGE=prod bun ./alchemy.run.ts    # Uses prod profile
```

### Example 2: Mixed Profile Usage

```typescript
// Most resources use app-level profile
const app = await alchemy("my-app", {
  profile: "default"
});

// Standard resources
const api = await Worker("api", { /* ... */ });
const db = await D1Database("database", { /* ... */ });

// Shared resource uses different profile
const sharedCache = await KVNamespace("shared-cache", {
  profile: "shared", // Different account
});
```

### Example 3: CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Alchemy
        run: |
          # Configure profile from secrets
          alchemy configure --profile prod
          
      - name: Login
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: alchemy login --profile prod
        
      - name: Deploy
        run: alchemy deploy --profile prod
```

### Example 4: Package.json Scripts

```json
{
  "scripts": {
    "deploy": "alchemy deploy",
    "deploy:staging": "alchemy deploy --profile staging",
    "deploy:prod": "alchemy deploy --profile prod",
    "login": "alchemy login",
    "login:all": "alchemy login && alchemy login --profile staging && alchemy login --profile prod",
    "configure:staging": "alchemy configure --profile staging",
    "configure:prod": "alchemy configure --profile prod"
  }
}
```

### Example 5: Profile Validation

```typescript
// scripts/validate-profile.ts
const profile = process.env.ALCHEMY_PROFILE ?? "default";

try {
  // Try to read credentials
  const credPath = `~/.alchemy/credentials/${profile}/cloudflare.json`;
  const creds = await Bun.file(credPath).json();
  
  if (Date.now() > creds.expires) {
    console.error(`❌ Credentials expired for profile: ${profile}`);
    console.log(`Run: alchemy login --profile ${profile}`);
    process.exit(1);
  }
  
  console.log(`✅ Profile ${profile} is valid`);
} catch (error) {
  console.error(`❌ Profile ${profile} not found or invalid`);
  console.log(`Run: alchemy configure --profile ${profile}`);
  console.log(`Run: alchemy login --profile ${profile}`);
  process.exit(1);
}
```

---

## 🔒 Security Considerations

### 1. Never Commit Credentials

```gitignore
# .gitignore
.alchemy/credentials/
```

### 2. Use OAuth for Personal Development

```bash
# OAuth is more secure than API tokens
alchemy configure
# Select: OAuth
```

### 3. Use API Tokens for CI/CD

```bash
# API tokens are better for automation
alchemy configure --profile prod
# Select: API Token
```

### 4. Rotate Credentials Regularly

```bash
# Logout and login to refresh
alchemy logout --profile prod
alchemy login --profile prod
```

### 5. Limit Profile Scopes

```json
{
  "scopes": [
    "account:read",
    "user:read",
    "workers:write"
    // Only necessary scopes
  ]
}
```

---

## 🐛 Troubleshooting

### Profile Not Found

```bash
# Error: Profile 'prod' not found

# Solution: Configure the profile
alchemy configure --profile prod
```

### Credentials Expired

```bash
# Error: Credentials expired

# Solution: Login again
alchemy login --profile prod
```

### Wrong Account

```bash
# Error: Resource not found in account

# Solution: Check profile configuration
cat ~/.alchemy/config.json
# Verify account ID matches
```

### Permission Denied

```bash
# Error: Insufficient permissions

# Solution: Check scopes in config.json
# Re-configure with correct scopes
alchemy configure --profile prod
```

---

## 📊 Profile Comparison

| Aspect | Default Profile | Named Profile |
|--------|----------------|---------------|
| **Setup** | `alchemy configure` | `alchemy configure --profile name` |
| **Login** | `alchemy login` | `alchemy login --profile name` |
| **Deploy** | `alchemy deploy` | `alchemy deploy --profile name` |
| **Use Case** | Personal dev | Specific environments |
| **Account** | Personal/dev | Staging/prod/shared |

---

## 🔗 Related Documentation

- **Execution Phases**: [docs/EXECUTION_PHASES.md](./EXECUTION_PHASES.md)
- **Naming Strategy**: [docs/NAMING_STRATEGY.md](./NAMING_STRATEGY.md)
- **Scopes**: [docs/SCOPES_GUIDE.md](./SCOPES_GUIDE.md)

---

## 📝 Summary

### Quick Reference

```bash
# Configure
alchemy configure [--profile name]

# Login
alchemy login [--profile name]

# Logout
alchemy logout [--profile name]

# Deploy with profile
alchemy deploy --profile name
ALCHEMY_PROFILE=name alchemy deploy
```

### Key Takeaways

1. **Profiles** manage credentials without `.env` files
2. **Default profile** for personal development
3. **Named profiles** for different environments/accounts
4. **Secure storage** in `~/.alchemy` directory
5. **Flexible usage** - per-resource, per-app, or global

---

**Last Updated**: October 26, 2025  
**Alchemy Version**: 0.76.1+  
**Status**: ✅ Production-ready patterns
