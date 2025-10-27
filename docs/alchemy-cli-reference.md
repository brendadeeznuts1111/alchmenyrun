# 🛠️ Alchemy CLI Reference

**Version:** 2.0  
**Last Updated:** 2025-10-27  
**Status:** Production Ready

---

## 📋 Overview

The Alchemy Command Line Interface (CLI) is the primary tool for managing your Infrastructure-as-Code (IaC) defined in TypeScript. It provides a complete lifecycle management system for cloud resources across different stages and environments.

---

## 🚀 Core Lifecycle Commands

### 1. `alchemy deploy` (Create/Update Resources)

**Purpose:** Provision and manage cloud resources by comparing desired state (your code) with actual deployed state.

**Usage:**
```bash
alchemy deploy [options]
```

**Options:**

| Option | Purpose | Default | Example |
|--------|---------|---------|---------|
| `--stage <name>` | Specifies the isolated environment to deploy to | `$USER` | `--stage prod` |
| `--profile <name>` | Specifies credentials to use for authorization | `default` | `--profile ci` |
| `--watch` | Enables continuous deployment on file changes | `false` | `--watch` |
| `--adopt` | Brings existing unmanaged resources under Alchemy control | `false` | `--adopt` |
| `--force` | Forces update plan even if no changes detected | `false` | `--force` |

**Examples:**
```bash
# Deploy to personal sandbox (default)
alchemy deploy

# Deploy to production stage
alchemy deploy --stage prod

# Deploy to PR preview with CI profile
alchemy deploy --stage pr-123 --profile ci

# Continuous deployment with watch mode
alchemy deploy --stage dev --watch

# Adopt existing Cloudflare resources
alchemy deploy --adopt

# Force deployment even without changes
alchemy deploy --force
```

**Behavior:**
1. Reads `alchemy.run.ts` (desired state)
2. Compares with current deployed state
3. Calculates required changes
4. Applies changes atomically
5. Updates state files

---

### 2. `alchemy dev` (Local Development & Hot Reloading)

**Purpose:** Run application locally with hot reloading for rapid development iteration.

**Usage:**
```bash
alchemy dev [options]
```

**Key Features:**

| Feature | Description | Runtime Implication |
|---------|-------------|---------------------|
| **Local Simulation** | Runs code in local runtime (Miniflare) | Uses Bun/tsx/Node with `--watch` flag |
| **Resource Context** | Aware of defined resources | Can use `dev: { remote: true }` for real cloud resources |
| **Hot Reloading** | Instant feedback on code changes | Automatic restart on file changes |

**Options:**

| Option | Purpose | Default |
|--------|---------|---------|
| `--stage <name>` | Stage context for resource binding | `$USER` |
| `--profile <name>` | Profile for remote resource access | `default` |
| `--port <number>` | Local server port | `8080` |

**Examples:**
```bash
# Start local development server
alchemy dev

# Dev with specific stage context
alchemy dev --stage alice

# Dev with remote resources
alchemy dev --profile prod  # Uses real cloud resources marked with dev: { remote: true }

# Dev on custom port
alchemy dev --port 3000
```

**Typical Workflow:**
```bash
# Terminal 1: Start dev server
alchemy dev

# Terminal 2: Make changes
vim src/worker.ts
# Hot reload happens automatically

# Browser: http://localhost:8080
# See changes instantly
```

---

### 3. `alchemy destroy` (Delete Resources)

**Purpose:** Remove all resources associated with a specific application and stage.

**Usage:**
```bash
alchemy destroy [options]
```

**⚠️ CRITICAL:** This command permanently deletes cloud resources!

**Options:**

| Option | Purpose | Required | Example |
|--------|---------|----------|---------|
| `--stage <name>` | Stage to destroy | **Recommended** | `--stage pr-123` |
| `--profile <name>` | Profile for authorization | No | `--profile ci` |
| `--force` | Skip confirmation prompts | No | `--force` |

**Examples:**
```bash
# Destroy PR preview (with confirmation)
alchemy destroy --stage pr-123

# Destroy with CI profile (auto-confirm in CI)
PHASE=destroy alchemy deploy --stage pr-123 --profile ci

# Force destroy without prompts
alchemy destroy --stage dev --force

# Destroy personal sandbox
alchemy destroy --stage $USER
```

**Safety Features:**
- Requires explicit stage specification (best practice)
- Confirmation prompt in interactive mode
- State file backup before deletion
- Atomic operation (all or nothing)

**CI/CD Usage:**
```yaml
# .github/workflows/cleanup.yml
- name: Destroy PR preview
  run: PHASE=destroy bun ./alchemy.run.ts --stage pr-${{ github.event.pull_request.number }}
```

---

### 4. `alchemy run` (Read-Only Execution)

**Purpose:** Execute Alchemy program without applying changes (read-only mode).

**Usage:**
```bash
alchemy run [options]
```

**Use Cases:**
- Query resource state
- Run utility scripts
- Inspect output variables
- Validate configuration
- Generate reports

**Options:**

| Option | Purpose | Example |
|--------|---------|---------|
| `--stage <name>` | Stage to query | `--stage prod` |
| `--profile <name>` | Profile for access | `--profile readonly` |
| `--watch` | Continuously re-run on changes | `--watch` |

**Examples:**
```bash
# Read current state
PHASE=read alchemy run

# Query production resources
PHASE=read alchemy run --stage prod

# Continuous monitoring
PHASE=read alchemy run --stage prod --watch

# Generate resource report
PHASE=read bun ./alchemy.run.ts > resources.json
```

**Typical Usage:**
```typescript
// alchemy.run.ts
const app = await alchemy("my-app", {
  phase: process.env.PHASE as "up" | "destroy" | "read" || "up"
});

if (app.phase === "read") {
  // Read-only operations
  console.log("Current resources:", app.resources);
}
```

---

## ⚙️ Setup and Configuration Commands

### `alchemy configure`

**Purpose:** Define authentication method and permissions for a cloud provider.

**Usage:**
```bash
alchemy configure [options]
```

**Options:**

| Option | Purpose | Required | Example |
|--------|---------|----------|---------|
| `--profile <name>` | Profile name to configure | Yes | `--profile prod` |
| `--provider <name>` | Cloud provider | Yes | `--provider cloudflare` |
| `--auth <method>` | Auth method (oauth, api-token) | Yes | `--auth oauth` |
| `--scopes <list>` | Permissions to request | No | `--scopes account:read,worker:write` |

**Examples:**
```bash
# Configure production profile with OAuth
alchemy configure --profile prod --provider cloudflare --auth oauth

# Configure CI profile with API token
alchemy configure --profile ci --provider cloudflare --auth api-token

# Configure with specific scopes
alchemy configure --profile readonly --provider cloudflare --auth oauth --scopes account:read
```

**Storage:**
- Configuration saved to: `~/.alchemy/config.json`
- Contains non-sensitive metadata only

---

### `alchemy login`

**Purpose:** Retrieve and store credentials for a configured profile.

**Usage:**
```bash
alchemy login [options]
```

**Options:**

| Option | Purpose | Example |
|--------|---------|---------|
| `--profile <name>` | Profile to authenticate | `--profile prod` |
| `--provider <name>` | Specific provider | `--provider cloudflare` |

**Examples:**
```bash
# Login to default profile
alchemy login

# Login to production profile
alchemy login --profile prod

# Login to specific provider
alchemy login --profile ci --provider cloudflare
```

**Behavior:**
1. Reads configuration from `~/.alchemy/config.json`
2. Initiates auth flow (OAuth browser or API token prompt)
3. Stores credentials in `~/.alchemy/credentials/<profile>/<provider>.json`
4. Credentials include expiration timestamp

**Credential Refresh:**
```bash
# Credentials typically expire after 24-48 hours
# Re-run login to refresh:
alchemy login --profile prod
```

---

### `alchemy logout`

**Purpose:** Clear stored credentials for a profile.

**Usage:**
```bash
alchemy logout [options]
```

**Examples:**
```bash
# Logout from default profile
alchemy logout

# Logout from specific profile
alchemy logout --profile prod

# Logout all profiles
alchemy logout --all
```

**Effect:**
- Removes `~/.alchemy/credentials/<profile>/<provider>.json`
- Revokes local access
- Configuration remains in `config.json`

---

### `alchemy create`

**Purpose:** Scaffold a new Alchemy project from templates.

**Usage:**
```bash
alchemy create [project-name] [options]
```

**Options:**

| Option | Purpose | Example |
|--------|---------|---------|
| `--template <name>` | Project template | `--template worker` |
| `--provider <name>` | Cloud provider | `--provider cloudflare` |
| `--typescript` | Use TypeScript | `--typescript` |

**Examples:**
```bash
# Create new project interactively
alchemy create my-app

# Create with specific template
alchemy create my-worker --template worker

# Create TypeScript project
alchemy create my-app --typescript

# Create with Cloudflare provider
alchemy create my-app --provider cloudflare --template fullstack
```

**Templates Available:**
- `worker` - Cloudflare Worker
- `fullstack` - Worker + D1 + KV + R2
- `api` - REST API with database
- `static` - Static site with Pages
- `queue` - Queue consumer pattern

---

### `alchemy init`

**Purpose:** Initialize Alchemy in an existing project.

**Usage:**
```bash
alchemy init [options]
```

**Examples:**
```bash
# Auto-detect framework and initialize
alchemy init

# Initialize with specific provider
alchemy init --provider cloudflare

# Initialize with custom config file
alchemy init --config custom-alchemy.run.ts
```

**Behavior:**
1. Detects existing framework (Next.js, Remix, etc.)
2. Creates `alchemy.run.ts`
3. Adds necessary dependencies to `package.json`
4. Creates `.alchemy/` directory
5. Generates example configuration

---

### `alchemy util create-cloudflare-token`

**Purpose:** Generate Cloudflare API tokens with specific permissions.

**Usage:**
```bash
alchemy util create-cloudflare-token [options]
```

**Options:**

| Option | Purpose | Example |
|--------|---------|---------|
| `--profile <name>` | Mirror profile's scopes | `--profile prod` |
| `--scopes <list>` | Custom scopes | `--scopes worker:write,d1:write` |
| `--name <string>` | Token name | `--name "CI/CD Token"` |

**Examples:**
```bash
# Create token with profile's permissions
alchemy util create-cloudflare-token --profile prod

# Create token with custom scopes
alchemy util create-cloudflare-token --scopes worker:write,d1:read --name "Deploy Token"

# Create read-only token
alchemy util create-cloudflare-token --scopes account:read,worker:read --name "Monitoring"
```

---

## 🔑 Profile System

### Profile Configuration Files

**Location:** `~/.alchemy/`

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

### Profile Selection Priority

Profiles can be set at three levels (highest to lowest priority):

#### 1. Global Application Scope (Highest Priority)

```typescript
// alchemy.run.ts
await alchemy("my-app", {
  profile: "prod"  // All resources use 'prod' profile
});
```

#### 2. Individual Resource Scope

```typescript
// alchemy.run.ts
const worker = await Worker("my-worker", {
  profile: "prod"  // Only this worker uses 'prod' profile
});
```

#### 3. CLI or Environment Variable Scope

**CLI Flag:**
```bash
alchemy deploy --profile prod
```

**Global Environment:**
```bash
ALCHEMY_PROFILE=prod alchemy deploy
```

**Provider-Specific:**
```bash
CLOUDFLARE_PROFILE=prod alchemy deploy
```

### Default Profile

If no profile is specified, Alchemy uses the `default` profile automatically.

**Setup:**
```bash
# Configure default profile
alchemy configure --profile default --provider cloudflare --auth oauth

# Login to default profile
alchemy login

# Use implicitly
alchemy deploy  # Uses 'default' profile
```

---

## 🎯 Common Workflows

### Developer Daily Workflow

```bash
# Morning: Start local dev
alchemy dev

# Make changes, hot reload happens automatically

# Afternoon: Deploy to personal stage for testing
alchemy deploy --stage $USER

# Test against real cloud resources

# Evening: Clean up
alchemy destroy --stage $USER
```

### PR Preview Workflow (CI/CD)

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
      
      - name: Deploy preview
        run: alchemy deploy --stage pr-${{ github.event.pull_request.number }} --profile ci
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Run E2E tests
        run: bun test
        env:
          PREVIEW_URL: https://pr-${{ github.event.pull_request.number }}.myapp.pages.dev

  cleanup:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Destroy preview
        run: alchemy destroy --stage pr-${{ github.event.pull_request.number }} --profile ci --force
```

### Production Deployment Workflow

```bash
# 1. Configure production profile (one-time)
alchemy configure --profile prod --provider cloudflare --auth oauth
alchemy login --profile prod

# 2. Deploy to production
alchemy deploy --stage prod --profile prod

# 3. Verify deployment
PHASE=read alchemy run --stage prod --profile prod

# 4. Rollback if needed
git revert HEAD
alchemy deploy --stage prod --profile prod
```

---

## 🔧 Environment Variables

### Alchemy-Specific

| Variable | Purpose | Example |
|----------|---------|---------|
| `ALCHEMY_PROFILE` | Default profile for all providers | `export ALCHEMY_PROFILE=prod` |
| `ALCHEMY_PASSWORD` | Encryption password for state | `export ALCHEMY_PASSWORD=secret` |
| `PHASE` | Execution phase (up/destroy/read) | `export PHASE=read` |

### Provider-Specific

| Variable | Purpose | Example |
|----------|---------|---------|
| `CLOUDFLARE_PROFILE` | Profile for Cloudflare only | `export CLOUDFLARE_PROFILE=prod` |
| `CLOUDFLARE_API_TOKEN` | Direct API token (bypasses profiles) | `export CLOUDFLARE_API_TOKEN=xxx` |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID for resources | `export CLOUDFLARE_ACCOUNT_ID=xxx` |

---

## 📚 Related Documentation

- [Alchemy Workflow Primer](./alchemy-workflow-primer.md)
- [Stage Management](./stage-management.md)
- [Profile Configuration](./profile-configuration.md)
- [CI/CD Integration](./ci-cd-integration.md)
- [Troubleshooting](./troubleshooting.md)

---

## ❓ FAQ

### Q: What's the difference between `alchemy deploy` and `alchemy dev`?
**A:** `alchemy deploy` creates real cloud resources and is for testing/production. `alchemy dev` runs locally with Miniflare emulation for fast iteration.

### Q: How do I use different credentials for different stages?
**A:** Use profiles! Configure separate profiles (e.g., `dev`, `prod`) and specify with `--profile` flag.

### Q: Can I deploy multiple stages simultaneously?
**A:** Yes! Each stage is isolated. Run `alchemy deploy --stage pr-123` and `alchemy deploy --stage pr-124` in parallel.

### Q: How do I see what resources exist in a stage?
**A:** Use `PHASE=read alchemy run --stage <name>` to query without making changes.

### Q: What happens if `alchemy deploy` fails mid-way?
**A:** Alchemy operations are atomic. If deployment fails, it rolls back to the previous state.

---

**🎉 You're now ready to master the Alchemy CLI!**

For questions or issues, see [Troubleshooting](./troubleshooting.md) or open an issue on GitHub.
