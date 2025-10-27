# 🔑 Alchemy Profile System Guide

**Version:** 2.0  
**Last Updated:** 2025-10-27  
**Status:** Production Ready

---

## 📋 Quick Reference

The profile system is the single source of truth for cloud credentials.  
One directory, `~/.alchemy`, holds **configuration** (non-secret) and  
**credentials** (short-lived secrets).  
Everything else—CLI flags, env vars, resource-level overrides—are just convenience aliases that resolve back to these two files.

### File Layout
```
~/.alchemy
├─ config.json               // { profile → auth_method, scopes, … }
└─ credentials
   └─ <profile>
      └─ <provider>.json     // { access_token, expires_at }
```

### Surface Area
| Command | Effect |
|---------|--------|
| `alchemy configure --profile P` | create / update `config.json` entry |
| `alchemy login --profile P` | obtain token, write `credentials/P/<provider>.json` |
| `alchemy logout --profile P` | delete `credentials/P` tree |
| `alchemy profile validate` | *planned* – exit 0 if config + non-expired creds exist |

### Resolution Order (highest → lowest)
1. **Resource-level override**<br>`Worker("x", { profile: "prod" })` 
2. **Global `alchemy.run.ts` override**<br>`await alchemy("app", { profile: "prod" })` 
3. **CLI flag**<br>`alchemy deploy --profile prod` 
4. **Env var**<br>`ALCHEMY_PROFILE=prod` 
5. **Fallback**<br>`default` 

### Stage / Profile Hygiene
*Stages* isolate resources (logical fence).  
*Profiles* isolate credentials (security gate).  
The two dimensions are orthogonal:  
a PR stage may be **deployed** with the `ci` profile and **read** by the `prod` profile during binding—no collision.

### CI/CD Contract
- CI must export `ALCHEMY_PROFILE=ci` and inject the matching secret (`CLOUDFLARE_API_TOKEN`) into the job.  
- The `ci` profile is **read-only** except for `workers:write` and `kv:write`; it cannot touch `prod` D1 or R2.  
- A one-line pre-step guarantees the profile is present:
  ```yaml
      - run: alchemy profile validate   # fails fast if token missing / expired
  ```

### Local Development
`alchemy dev` implicitly uses the `default` profile and the `$USER` stage.  
No configuration is required on first clone.

### Planned Enhancements
See [Issue #43](https://github.com/brendadeeznuts1111/alchmenyrun/issues/43) for tracking:
1. Auto-refresh in `deploy` when `expires_at < now()`.
2. `alchemy profile rotate` – re-key without logout.
3. Per-provider credential plugins (AWS SSO, GCP ADC).

---

## 📋 Detailed Overview

The Alchemy Profile System is a secure, flexible mechanism for managing cloud provider credentials across multiple stages and projects. By centralizing configuration and secrets in the `~/.alchemy` directory, it eliminates the need for manual environment variable management or separate login files, akin to AWS profiles.

**Key Benefits:**
- ✅ Centralized credential management
- ✅ Secure credential isolation
- ✅ Multi-provider support
- ✅ Stage-aware authentication
- ✅ Least-privilege access control

---

## 🏗️ Profile Architecture

### File Structure

```
~/.alchemy/
├── config.json                    # Non-sensitive configuration
└── credentials/
    ├── default/
    │   └── cloudflare.json       # Credentials for default profile
    ├── prod/
    │   └── cloudflare.json       # Credentials for prod profile
    └── ci/
        └── cloudflare.json       # Credentials for CI profile
```

### Two-File System

#### 1. `~/.alchemy/config.json` (Configuration)

**Purpose:** Stores non-sensitive metadata

**Contents:**
- Authentication method (OAuth, API token)
- Permission scopes
- Provider settings

**Example:**
```json
{
  "profiles": {
    "prod": {
      "provider": "cloudflare",
      "auth_method": "api-token",
      "scopes": ["workers:write", "d1:read", "kv:write"]
    },
    "ci": {
      "provider": "cloudflare",
      "auth_method": "api-token",
      "scopes": ["workers:write", "d1:write", "kv:write", "r2:write"]
    }
  }
}
```

#### 2. `~/.alchemy/credentials/<profile>/<provider>.json` (Credentials)

**Purpose:** Stores sensitive credentials with expiration

**Contents:**
- Access tokens
- Refresh tokens
- Expiration timestamps

**Example:**
```json
{
  "access_token": "xyz123...",
  "refresh_token": "abc456...",
  "expires_at": "2025-11-01T00:00:00Z",
  "created_at": "2025-10-27T00:00:00Z"
}
```

**Security Features:**
- Short-lived credentials (24-48 hours)
- Automatic expiration tracking
- Secure file permissions (600)
- No credentials in version control

---

## 🔧 Configuration and Management

### Command Reference

| Command | Purpose | Example | File Impact |
|---------|---------|---------|-------------|
| `alchemy configure` | Creates/updates profile metadata | `alchemy configure --profile prod` | Updates `~/.alchemy/config.json` |
| `alchemy login` | Fetches/stores credentials | `alchemy login --profile prod` | Writes to `credentials/prod/<provider>.json` |
| `alchemy logout` | Clears credentials | `alchemy logout --profile prod` | Removes `credentials/prod/<provider>.json` |
| `alchemy profile validate` | Validates profile configuration | `alchemy profile validate --profile prod` | Read-only check |
| `alchemy profile refresh` | Refreshes expired credentials | `alchemy profile refresh --profile prod` | Updates credentials |

### Setup Workflow

#### 1. Configure Profile

```bash
# Configure production profile
alchemy configure --profile prod \
  --provider cloudflare \
  --auth api-token \
  --scopes workers:write,d1:write,kv:write

# Configure CI profile
alchemy configure --profile ci \
  --provider cloudflare \
  --auth api-token \
  --scopes workers:write,d1:write,kv:write,r2:write

# Configure read-only profile
alchemy configure --profile readonly \
  --provider cloudflare \
  --auth oauth \
  --scopes account:read,workers:read
```

#### 2. Login to Profile

```bash
# Login to production (OAuth flow)
alchemy login --profile prod
# Opens browser for OAuth authorization

# Login to CI (API token prompt)
alchemy login --profile ci
# Prompts for API token input

# Login to default profile
alchemy login
# Uses 'default' profile implicitly
```

#### 3. Validate Profile

```bash
# Validate profile configuration
alchemy profile validate --profile prod

# Output:
# ✅ Profile 'prod' configuration valid
# ✅ Credentials present and not expired
# ✅ Required scopes: workers:write, d1:write, kv:write
# ✅ Provider: cloudflare
```

#### 4. Refresh Credentials

```bash
# Manually refresh expired credentials
alchemy profile refresh --profile prod

# Auto-refresh during deployment
alchemy deploy --stage prod --profile prod
# Automatically refreshes if expired
```

---

## 🎯 Profile Selection and Scope

Profiles define the identity and permissions for managing cloud resources. They can be set at three levels of granularity (highest to lowest priority):

### 1. Global Application Scope (Highest Priority)

Set in `alchemy.run.ts` to apply a profile to all resources in an application.

```typescript
// alchemy.run.ts
await alchemy("my-app", {
  profile: "prod"  // All resources use 'prod' profile
});

// All resources created in this app use prod credentials
const db = await D1Database("my-db");
const kv = await KVNamespace("my-kv");
const worker = await Worker("my-worker");
```

### 2. Individual Resource Scope

Override global or CLI settings for a specific resource.

```typescript
// alchemy.run.ts
await alchemy("my-app", {
  profile: "default"  // Default for most resources
});

// But this specific worker uses prod credentials
const worker = await Worker("critical-worker", {
  profile: "prod"  // Only this worker uses 'prod' profile
});

// This database uses readonly credentials
const db = await D1Database("analytics-db", {
  profile: "readonly"
});
```

### 3. CLI or Environment Variable Scope (Standard Usage)

Specify profiles via CLI flags or environment variables.

**CLI Flag:**
```bash
alchemy deploy --profile prod
```

**Global Environment Variable:**
```bash
ALCHEMY_PROFILE=prod alchemy deploy
```

**Provider-Specific Environment Variable:**
```bash
CLOUDFLARE_PROFILE=prod alchemy deploy
```

**Priority Order:**
```
Resource Scope > Application Scope > CLI Flag > Env Var > Default Profile
```

---

## 🔄 Integration with Stage-Based Workflow

Profiles provide the **"Who"** (credentials and permissions) for the **"Where"** (stages) and **"What"** (resources) in the Alchemy workflow.

### Workflow Matrix

| Workflow Phase | Profile | Stage | Resources | Commands |
|----------------|---------|-------|-----------|----------|
| **Local Dev / Sandbox** | `default` | `$USER` | Miniflare (emulated) | `alchemy dev` |
| **CI/CD / PR Preview** | `ci` | `pr-XXX` | Real cloud (isolated) | `alchemy deploy --profile ci --stage pr-123` |
| **Production** | `prod` | `prod` | Real cloud (stable) | `alchemy deploy --profile prod --stage prod` |
| **Monitoring** | `readonly` | `prod` | Read-only access | `PHASE=read alchemy run --profile readonly --stage prod` |

### Security and Separation

**Stage Isolation (Logical Fence):**
- Stages (`$USER`, `pr-XXX`, `prod`) provide resource isolation
- Each stage has completely separate D1 databases, KV namespaces, R2 buckets

**Profile Isolation (Security Gate):**
- Profiles ensure credential separation
- `prod` profile credentials cannot be used in `pr-XXX` stages
- Prevents unauthorized access even if stage names are misused

**Example:**
```bash
# This works - ci profile can access pr-123 stage
alchemy deploy --profile ci --stage pr-123

# This fails - ci profile cannot access prod stage
alchemy deploy --profile ci --stage prod
# Error: Profile 'ci' not authorized for stage 'prod'

# This works - prod profile can access prod stage
alchemy deploy --profile prod --stage prod
```

---

## 🛡️ Security Best Practices

### 1. Principle of Least Privilege

**Configure minimal scopes per profile:**

```bash
# Production: Only what's needed
alchemy configure --profile prod \
  --scopes workers:write,d1:write,kv:write

# CI: Broader for testing
alchemy configure --profile ci \
  --scopes workers:write,d1:write,kv:write,r2:write,pages:write

# Monitoring: Read-only
alchemy configure --profile readonly \
  --scopes account:read,workers:read,d1:read
```

### 2. Credential Rotation

**Automate credential refresh:**

```typescript
// Auto-refresh in alchemy.run.ts
await alchemy("my-app", {
  profile: "prod",
  autoRefreshCredentials: true  // Refresh if expired
});
```

**Manual refresh:**
```bash
# Refresh before deployment
alchemy profile refresh --profile prod
alchemy deploy --stage prod --profile prod
```

### 3. CI/CD Secrets

**Store credentials securely in GitHub Secrets:**

```yaml
# .github/workflows/deploy.yml
env:
  CLOUDFLARE_PROFILE: ci
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Never commit credentials:**
```gitignore
# .gitignore
.alchemy/credentials/
*.token
*.key
```

### 4. Profile Validation

**Validate before deployment:**

```bash
# In CI/CD pipeline
alchemy profile validate --profile ci || exit 1
alchemy deploy --stage pr-${{ github.event.pull_request.number }} --profile ci
```

---

## 💡 Practical Examples

### Example 1: Developer Workflow

```bash
# One-time setup
alchemy configure --profile default --provider cloudflare --auth oauth
alchemy login

# Daily development
alchemy dev  # Uses 'default' profile implicitly

# Deploy to personal stage
alchemy deploy --stage $USER  # Uses 'default' profile

# Clean up
alchemy destroy --stage $USER
```

### Example 2: CI/CD Workflow

```yaml
# .github/workflows/pr-preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate CI profile
        run: alchemy profile validate --profile ci
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Deploy preview
        run: alchemy deploy --stage pr-${{ github.event.pull_request.number }} --profile ci
        env:
          CLOUDFLARE_PROFILE: ci
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Destroy preview
        run: alchemy destroy --stage pr-${{ github.event.pull_request.number }} --profile ci --force
        env:
          CLOUDFLARE_PROFILE: ci
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Example 3: Production Deployment

```bash
# One-time production setup
alchemy configure --profile prod \
  --provider cloudflare \
  --auth api-token \
  --scopes workers:write,d1:write,kv:write

alchemy login --profile prod
# Enter production API token

# Deploy to production
alchemy profile validate --profile prod
alchemy deploy --stage prod --profile prod

# Verify deployment
PHASE=read alchemy run --stage prod --profile prod
```

### Example 4: Multi-Profile Application

```typescript
// alchemy.run.ts
await alchemy("my-app", {
  profile: "default"  // Default for most resources
});

// Critical worker uses production credentials
const criticalWorker = await Worker("payment-processor", {
  profile: "prod",
  // ... other config
});

// Analytics database uses read-only credentials
const analyticsDb = await D1Database("analytics", {
  profile: "readonly",
  // ... other config
});

// Development resources use default profile
const devWorker = await Worker("dev-worker");
const devDb = await D1Database("dev-db");
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Expired Credentials

**Symptom:**
```
Error: Credentials for profile 'prod' have expired
```

**Solution:**
```bash
alchemy login --profile prod
# Or
alchemy profile refresh --profile prod
```

#### 2. Missing Profile

**Symptom:**
```
Error: Profile 'ci' not found
```

**Solution:**
```bash
alchemy configure --profile ci --provider cloudflare --auth api-token
alchemy login --profile ci
```

#### 3. Permission Errors

**Symptom:**
```
Error: Insufficient permissions for workers:write
```

**Solution:**
```bash
# Check current scopes
alchemy profile validate --profile prod

# Reconfigure with correct scopes
alchemy configure --profile prod --scopes workers:write,d1:write,kv:write
alchemy login --profile prod
```

#### 4. Profile Not Authorized for Stage

**Symptom:**
```
Error: Profile 'ci' not authorized for stage 'prod'
```

**Solution:**
```bash
# Use correct profile for stage
alchemy deploy --stage prod --profile prod  # Not ci
```

---

## 📚 Related Documentation

- [Alchemy Workflow Primer](../alchemy-workflow-primer.md) - Stage-based workflow overview
- [Alchemy CLI Reference](../alchemy-cli-reference.md) - Complete CLI documentation
- [Stage Management Guide](./stage-management.md) - Managing stages and environments
- [CI/CD Integration](./ci-cd-integration.md) - Automating deployments
- [Security Best Practices](./security-best-practices.md) - Securing your infrastructure

---

## 🔗 Related RFCs

- [ALC-RFC-001: tgk Core Control Plane](../../docs/ALC-RFC-001-tgk-core.md) - Automation principles
- [ALC-RFC-002: Telegram Forum Polish](../../docs/ALC-RFC-002-forum-polish.md) - Governance automation
- [ALC-RFC-004: Advanced Governance](../../docs/ALC-RFC-004-advanced-governance.md) - Enterprise governance

---

## ❓ FAQ

### Q: What's the difference between a profile and a stage?
**A:** A **profile** defines WHO (credentials/permissions), while a **stage** defines WHERE (environment/resources). You use profiles to authenticate to stages.

### Q: Can I use multiple profiles in one deployment?
**A:** Yes! Set different profiles at the resource level:
```typescript
const worker1 = await Worker("w1", { profile: "prod" });
const worker2 = await Worker("w2", { profile: "ci" });
```

### Q: How often do credentials expire?
**A:** Typically 24-48 hours for OAuth tokens. API tokens don't expire but should be rotated regularly.

### Q: Can I share profiles across team members?
**A:** No, profiles are local to `~/.alchemy` on each machine. Use CI/CD secrets for shared credentials.

### Q: What happens if I deploy with an expired profile?
**A:** Alchemy will detect the expiration and prompt you to run `alchemy login` or auto-refresh if configured.

---

## 🚀 Next Steps

1. **Set up your profiles:**
   ```bash
   alchemy configure --profile default
   alchemy login
   ```

2. **Test with a deployment:**
   ```bash
   alchemy deploy --stage $USER
   ```

3. **Configure CI/CD:**
   - Add `CLOUDFLARE_API_TOKEN` to GitHub Secrets
   - Create `ci` profile in workflows

4. **Implement security:**
   - Use least-privilege scopes
   - Rotate credentials regularly
   - Validate profiles before deployment

---

**🎉 Your profiles are now configured for secure, isolated deployments!**

For questions or issues, see [Troubleshooting](#-troubleshooting) or open an issue on GitHub.
