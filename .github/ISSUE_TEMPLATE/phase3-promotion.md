---
name: Phase 3 - Staging → Prod Promotion
about: Implement multi-environment promotion with manual approval gates
title: 'feat: staging → prod promotion gate'
labels: enhancement, phase-3
assignees: ''
---

## 🎯 Goal

Implement Alchemy Phase 2→3 transition: multi-environment promotion with manual approval gates.

## 📋 Requirements

### 1. GitHub Environments

**Staging Environment:**
- [ ] Create `staging` environment in GitHub Settings
- [ ] No protection rules (auto-deploy)
- [ ] Environment-specific secrets configured
- [ ] Staging URL documented

**Production Environment:**
- [ ] Create `prod` environment in GitHub Settings
- [ ] Required reviewers: 1
- [ ] Deployment branches: main only
- [ ] Environment-specific secrets configured
- [ ] Production URL documented

### 2. Promotion Workflow

Create `.github/workflows/promote.yml`:

```yaml
name: Promote to Environment
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
      - name: Deploy to ${{ inputs.environment }}
        run: alchemy deploy --profile ${{ inputs.environment }}
      - name: Verify deployment
        run: |
          # Add health check here
          echo "Deployment verified"
```

- [ ] Workflow created
- [ ] Manual trigger configured
- [ ] Environment selection working
- [ ] Deployment verification added

### 3. Alchemy Config Updates

Update consumer app template to support promotion:

```typescript
// templates/app/alchemy.config.ts
export default {
  name: "my-app",
  
  resources: {
    api: {
      type: "worker",
      script: "./src/api.ts",
    },
  },
  
  profiles: {
    staging: {
      // Staging-specific config
      domain: "staging.example.com",
    },
    prod: {
      // Production-specific config
      domain: "example.com",
    },
  },
};
```

- [ ] Template updated
- [ ] Profile support added
- [ ] Environment-specific configs documented

### 4. Rollback Capability

Implement rollback functionality:

```bash
# scripts/rollback.sh
#!/usr/bin/env bash
# Rollback to previous deployment

ENVIRONMENT="${1:-prod}"
PREVIOUS_VERSION="${2:-latest-1}"

echo "🔄 Rolling back $ENVIRONMENT to $PREVIOUS_VERSION"
alchemy deploy --profile "$ENVIRONMENT" --version "$PREVIOUS_VERSION"
```

- [ ] Rollback script created
- [ ] Version tracking implemented
- [ ] Rollback tested
- [ ] Documentation added

### 5. Documentation

Create/update documentation:

- [ ] `docs/PROMOTION.md` - Promotion workflow guide
- [ ] `QUICK_START.md` - Add staging → prod flow
- [ ] `COMMANDS.md` - Add promotion commands
- [ ] `README.md` - Add promotion badge

### 6. Testing

Validation steps:

- [ ] Create test app: `./scripts/create-app.sh promotion-test`
- [ ] Deploy to staging: `alchemy deploy --profile staging`
- [ ] Verify staging deployment
- [ ] Trigger promotion workflow
- [ ] Approve in GitHub UI
- [ ] Verify production deployment
- [ ] Test rollback: `./scripts/rollback.sh prod`
- [ ] Verify rollback worked

## 🎨 Design Decisions

### Environment Strategy
- **Staging**: Auto-deploy on merge to main
- **Production**: Manual approval required
- **Rollback**: One-command revert to previous version

### Approval Process
- GitHub environment protection rules
- Required reviewers: 1
- Review in GitHub Actions UI
- Audit trail maintained

### Health Checks
- HTTP endpoint verification
- Response time validation
- Error rate monitoring
- Automated rollback on failure (future)

## 📊 Success Criteria

- [ ] Staging environment deploys automatically on merge
- [ ] Production requires manual approval
- [ ] Promotion workflow is intuitive
- [ ] Rollback works reliably
- [ ] Documentation is comprehensive
- [ ] Zero downtime during promotion

## 🔗 Related

- **Phase Guide**: [docs/ALCHEMY_PHASES.md](../docs/ALCHEMY_PHASES.md)
- **Roadmap**: [ROADMAP.md](../ROADMAP.md)
- **Current Release**: [v2.0.0-kit-final](https://github.com/brendadeeznuts1111/alchmenyrun/releases/tag/v2.0.0-kit-final)

## 💡 Implementation Notes

### Phase 1: Setup
1. Create GitHub environments
2. Configure protection rules
3. Set up environment secrets

### Phase 2: Workflow
1. Create promotion workflow
2. Add manual trigger
3. Implement health checks

### Phase 3: Integration
1. Update app templates
2. Add profile support
3. Test end-to-end

### Phase 4: Documentation
1. Write promotion guide
2. Update quick start
3. Add examples

## 🎯 Target Release

**Version**: `v3.0.0-promotion-gate`  
**Timeline**: Q1 2025  
**Estimated Effort**: 1 week

## ✅ Definition of Done

- All checkboxes above are checked
- CI passes
- Documentation is complete
- End-to-end testing successful
- PR approved and merged
- Release tagged and published
