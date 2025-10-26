# Documentation Index

## Core Concepts

### Execution Phases
**File**: [docs/EXECUTION_PHASES.md](./docs/EXECUTION_PHASES.md)

Three modes for running infrastructure code:
- `up` - Deploy (create/update/delete)
- `destroy` - Tear down all resources
- `read` - Access properties without changes

**Example**:
```bash
PHASE=read bun ./scripts/build-frontend.ts
```

### Resource Lifecycle
**File**: [docs/RESOURCE_LIFECYCLE.md](./docs/RESOURCE_LIFECYCLE.md)

How resources change over time:
- Create - First deployment
- Update - Modify existing
- Delete - Remove orphaned
- Replace - Immutable changes
- Adopt - Import existing

### Naming Strategy
**File**: [docs/NAMING_STRATEGY.md](./docs/NAMING_STRATEGY.md)

Resource naming patterns:
- **Automatic**: `${app}-${resource}-${stage}` (recommended)
- **Explicit**: Custom names when needed

### Profiles
**File**: [docs/PROFILES_GUIDE.md](./docs/PROFILES_GUIDE.md)

Credential management:
```bash
alchemy configure --profile prod
alchemy login --profile prod
alchemy deploy --profile prod
```

### Scopes
**File**: [docs/SCOPES_GUIDE.md](./docs/SCOPES_GUIDE.md)

Resource organization:
- Application scope (top-level)
- Stage scope (dev/staging/prod)
- Nested scopes (custom grouping)

### Deployment Stages
**File**: [docs/ALCHEMY_PHASES.md](./docs/ALCHEMY_PHASES.md)

Maturity progression:
- Stage 0: Local-only
- Stage 1: Cloud resources, no review
- Stage 2: PR + CI gates (current)
- Stage 3: Multi-env promotion (next)

---

## Practical Scripts

### Build Frontend
**File**: [scripts/build-frontend.ts](./scripts/build-frontend.ts)

Build with infrastructure URLs:
```bash
PHASE=read bun ./scripts/build-frontend.ts
```

---

## Quick Reference

### Common Commands
```bash
# Deploy
bun run deploy
bun run deploy:prod

# Destroy
PHASE=destroy bun ./alchemy.run.ts

# Read infrastructure
PHASE=read bun ./alchemy.run.ts

# Build frontend
bun run build:frontend
```

### File Structure
```
docs/
├── EXECUTION_PHASES.md      # up/destroy/read
├── RESOURCE_LIFECYCLE.md    # create/update/delete/replace/adopt
├── NAMING_STRATEGY.md       # automatic vs explicit
├── PROFILES_GUIDE.md        # credential management
├── SCOPES_GUIDE.md          # resource organization
└── ALCHEMY_PHASES.md        # deployment maturity

scripts/
└── build-frontend.ts        # PHASE=read example
```

---

All guides reference official Alchemy documentation.
