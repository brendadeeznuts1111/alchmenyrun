# Alchemy Phases: Our Journey

This document maps our repository evolution to Alchemy's deployment phase concept.

## 📊 Alchemy Phase Model

Alchemy defines deployment maturity through phases:

```
Phase 0: Local-only, no cloud resources
Phase 1: Cloud resources, no review
Phase 2: Review required before deploy
Phase 3+: Multi-env promotion, policy gates
```

---

## 🗺️ Our Journey Mapped to Alchemy Phases

### Phase 0 → Phase 1: Initial Cloud Deployment
**Release**: `v1.0-demo`

```
Alchemy Phase 0: Local-only, no cloud resources
├─ Our v1.0-demo            – D1, R2, KV, DO, Workflows → cloud resources
└─ Deployed straight to prod (no gates)
```

**What We Built:**
- Cloudflare Workers
- D1 Database
- R2 Storage
- KV Cache
- Durable Objects
- Workflows

**Deployment Model:**
- Direct deploy to production
- No review process
- Manual testing

---

### Phase 1 → Phase 2: Review Gates
**Release**: `v2.0.0-kit-final` ✅ **CURRENT**

```
Alchemy Phase 1: Cloud resources, no review
├─ Our infra always deployed straight to prod (profile prod)
└─ We added branch-protection + CI matrix → review gate

Alchemy Phase 2: Review required before deploy
├─ We are **HERE** – PR + CI must pass
└─ Next: promote to staging first, then prod
```

**What We Added:**
- ✅ CI Matrix workflow (parallel package testing)
- ✅ Branch protection (PR required)
- ✅ Automated testing gate
- ✅ Consumer app templates
- ✅ App scaffolding scripts
- ✅ Comprehensive documentation

**Deployment Model:**
- PR + CI required before merge
- Automated quality checks
- Review approval gate
- Still deploys directly to prod (after review)

---

### Phase 2 → Phase 3: Multi-Environment Promotion
**Target**: `v3.0.0-promotion-gate` ⏳ **NEXT**

```
Alchemy Phase 2→3: Multi-env promotion
├─ Staging environment (auto-deploy)
├─ Manual approval gate
└─ Production environment (promoted after approval)

Alchemy Phase 3+: Policy gates, compliance checks
└─ Road-mapped for future sprints
```

**What We'll Build:**
- ⏳ Staging environment
- ⏳ Production environment (protected)
- ⏳ Promotion workflow
- ⏳ Manual approval gate
- ⏳ Environment-specific configs

**Deployment Model:**
- PR merged → auto-deploy to staging
- Manual review + approval
- Promote to production
- Rollback capability

---

## 📋 Feature Matrix

| Feature                     | Alchemy Phase | Our Status | Release |
|-----------------------------|---------------|------------|---------|
| Local dev (`alchemy dev`)   | 0             | ✅         | v1.0    |
| Cloud deploy (prod)         | 1             | ✅         | v1.0    |
| PR + CI gate                | 2             | ✅         | v2.0    |
| Consumer app templates      | 2             | ✅         | v2.0    |
| App scaffolding             | 2             | ✅         | v2.0    |
| CI Matrix testing           | 2             | ✅         | v2.0    |
| Branch protection           | 2             | ✅         | v2.0    |
| RSS feed                    | 2             | ✅         | v2.0    |
| Staging → prod promotion    | 2→3           | ⏳         | v3.0    |
| Environment protection      | 3             | ⏳         | v3.0    |
| Manual approval gates       | 3             | ⏳         | v3.0    |
| Policy checks (OPA)         | 3+            | 📋         | Future  |
| Compliance scanning         | 3+            | 📋         | Future  |
| Multi-region deployment     | 3+            | 📋         | Future  |

---

## 🚀 Current State: Phase 2 (v2.0.0-kit-final)

### What Works Now

**Development:**
```bash
# Local development
bun run dev

# Create new app from template
./scripts/create-app.sh my-app
cd apps/my-app
bun install
```

**Deployment:**
```bash
# Deploy to production (after PR + CI)
alchemy deploy --profile prod
```

**Quality Gates:**
- ✅ PR required to merge to main
- ✅ CI Matrix tests all packages
- ✅ Automated build verification
- ✅ Review approval required

---

## 🎯 Next Sprint: Phase 2→3 Promotion

### Issue #21: Staging → Prod Promotion Gate

**Goal**: Implement multi-environment promotion with manual approval.

### Architecture

```typescript
// alchemy.config.ts (consumer app)
export default alchemy({
  name: "my-app",
  async setup() {
    const api = Worker("api", { entry: "./src/worker.ts" });

    // Deploy to staging automatically
    await alchemy.promote("staging", { resources: [api] });

    // Manual gate (GitHub environment)
    await alchemy.gate("prod-approval", { type: "manual" });

    // Deploy to prod after approval
    await alchemy.promote("prod", { resources: [api] });
  },
});
```

### GitHub Environments Setup

**Staging Environment:**
- No protection rules
- Auto-deploys on merge to main
- Used for testing before prod

**Production Environment:**
- Required reviewers: 1
- Manual approval needed
- Promotes from staging

### Workflow

```yaml
# .github/workflows/promote.yml
name: Promote to Production
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - prod

jobs:
  promote:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: alchemy deploy --profile ${{ inputs.environment }}
```

---

## 📋 Post-Merge Checklist

### GitHub Environment Setup

- [ ] **Create Staging Environment**
  - Go to: Settings → Environments → New
  - Name: `staging`
  - Protection rules: None (auto-deploy)

- [ ] **Create Production Environment**
  - Go to: Settings → Environments → New
  - Name: `prod`
  - Protection rules:
    - ✅ Required reviewers: 1
    - ✅ Wait timer: 0 minutes
    - ✅ Deployment branches: main only

### README Updates

- [ ] Add promotion workflow badge:
  ```markdown
  [![Promote](https://github.com/brendadeeznuts1111/alchmenyrun/actions/workflows/promote.yml/badge.svg)](https://github.com/brendadeeznuts1111/alchmenyrun/actions)
  ```

- [ ] Update deployment section with staging → prod flow

### Documentation

- [ ] Create `docs/PROMOTION.md` guide
- [ ] Update `QUICK_START.md` with staging workflow
- [ ] Add promotion examples to `COMMANDS.md`

---

## 🧪 Validation Steps

### Test Staging Deployment

```bash
# 1. Create app with staging profile
./scripts/create-app.sh staging-demo
cd apps/staging-demo

# 2. Deploy to staging
alchemy deploy --profile staging

# 3. Verify staging deployment
curl https://staging-demo-staging.workers.dev/api/health
```

### Test Production Promotion

```bash
# 1. Trigger promotion workflow
gh workflow run promote.yml -f environment=prod

# 2. Approve in GitHub UI
# Go to Actions → Promote to Production → Review deployments

# 3. Verify production deployment
curl https://staging-demo-prod.workers.dev/api/health
```

---

## 🎯 Success Criteria

### Phase 2 (Current) ✅
- [x] PR + CI required
- [x] Automated testing
- [x] Review approval
- [x] Consumer templates
- [x] App scaffolding
- [x] Documentation

### Phase 3 (Next Sprint) ⏳
- [ ] Staging environment
- [ ] Production environment (protected)
- [ ] Promotion workflow
- [ ] Manual approval gate
- [ ] Environment-specific configs
- [ ] Rollback capability

### Phase 3+ (Future) 📋
- [ ] Policy checks (OPA)
- [ ] Compliance scanning
- [ ] Multi-region deployment
- [ ] Canary deployments
- [ ] Blue-green deployments
- [ ] Automated rollback

---

## 📚 Related Documentation

- [Showcase Setup](./SHOWCASE_SETUP.md) - Current Phase 2 setup
- [Quick Start](../QUICK_START.md) - Getting started guide
- [Commands Reference](../COMMANDS.md) - All available commands
- [Alchemy CLI Docs](https://www.npmjs.com/package/alchemy) - Official Alchemy docs

---

## 🎉 Current Achievement

**v2.0.0-kit-final**: Phase 2 Complete ✅

The repository is now a **production-grade showcase** with:
- ✅ Clone → Install → Deploy → Extend in < 5 minutes
- ✅ CI/CD automation
- ✅ Review gates
- ✅ Consumer templates
- ✅ Comprehensive documentation

**Release**: https://github.com/brendadeeznuts1111/alchmenyrun/releases/tag/v2.0.0-kit-final

---

## 🚀 Next Milestone

**v3.0.0-promotion-gate**: Phase 2→3 Transition

Target features:
- Staging → Production promotion
- Manual approval gates
- Environment protection
- Rollback capability

**Status**: ⏳ Planned for next sprint
