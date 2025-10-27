# Release Checklist

## 🚀 Release Checklist
- [ ] Version bumped (semver)
- [ ] Customer groups notified?
- [ ] Forum topics tested?
- [ ] Rollback plan documented?
- [ ] Telemetry verified?

## 🏷️ Release Labels
/label release/minor,customer/group-beta,impact/high

## 📋 Pre-Release Validation

### Customer Impact Assessment
- [ ] **Alpha group** notified of upcoming changes?
- [ ] **Beta group** regression tested?
- [ ] **Enterprise customers** SLA verified?
- [ ] **Internal usage** dogfooding completed?

### Technical Validation
- [ ] **Thread safety** verified for concurrent operations?
- [ ] **State pinning** working correctly?
- [ ] **Forum topics** load testing completed?
- [ ] **Race conditions** eliminated?
- [ ] **Backwards compatibility** maintained?

### Operational Readiness
- [ ] **Rollback plan** documented and tested?
- [ ] **Monitoring alerts** configured?
- [ ] **Customer support** briefed on changes?
- [ ] **Documentation** updated?

## 📊 Release Notes Template

### 🎯 Customer-Facing Changes
<!-- List changes visible to customers -->

### 🔧 Technical Improvements
<!-- Infrastructure and performance changes -->

### 🐛 Bug Fixes
<!-- Issues resolved -->

### 📚 Documentation
<!-- Documentation updates -->

---

## 🚨 Rollback Instructions

**If rollback needed:**
1. Run: `git revert <release-commit>`
2. Deploy with: `bun run deploy --stage prod`
3. Notify customers via: [communication plan]
4. Monitor for: [key metrics to watch]

**Expected rollback time:** <X minutes/hours>
