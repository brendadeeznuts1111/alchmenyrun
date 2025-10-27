<!-- 
⚠️  VALIDATION ENFORCED ⚠️
This PR will be automatically validated. Missing required fields will cause CI to fail.

PR Title MUST follow format: type(scope): description
Example: feat(worker): add GitHub webhook integration

Required sections: Purpose, Changes, Testing, Issue References
Required labels: type/*, dept/*
Required: bun run format before commit
-->

## 🎯 Purpose
<!-- REQUIRED: What problem does this solve? Link to issue. -->

**Closes #** <!-- REQUIRED: Must reference at least one issue -->

**Problem:**
<!-- Describe the problem or need -->

**Solution:**
<!-- Describe your solution -->

---

## 📋 Changes
<!-- REQUIRED: List all changes made -->

- 
- 
- 

**Type:** <!-- feat/fix/docs/refactor/test/chore -->
**Component:** <!-- queue/tunnel/worker/cli/telegram -->
**Department:** <!-- infrastructure/providers/quality/documentation -->

---

## 🧪 Testing
<!-- REQUIRED: How was this tested? -->

**Tests Added:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

**Test Results:**
<!-- Paste test output or describe results -->

```
# Example:
bun test
✓ All tests passed (X tests)
```

---

## ✅ Pre-Submission Checklist
<!-- REQUIRED: All must be checked before submitting -->

- [ ] **Formatted code**: Ran `bun run format`
- [ ] **TypeScript check**: Ran `bun tsc -b --noEmit`
- [ ] **Tests pass**: Ran `bun test`
- [ ] **Issue referenced**: Used `Closes #123` or `Fixes #123`
- [ ] **Commit messages**: Follow `type(scope): description` format
- [ ] **Labels added**: Added `type/*` and `dept/*` labels
- [ ] **Self-reviewed**: Reviewed my own code for obvious issues
- [ ] **Documentation**: Updated docs if behavior changed

---

## 📚 Documentation
<!-- If applicable -->

**Documentation Updated:**
- [ ] README.md
- [ ] API docs
- [ ] CHANGELOG.md
- [ ] Code comments

---

## 🔗 Related
<!-- Optional: Link related PRs or issues -->

**Refs:** #<!-- Related issues -->
**Depends on:** #<!-- Blocking PRs -->

---

## 👥 Reviewers
<!-- Auto-assigned via CODEOWNERS, but you can request specific reviewers -->

**Requested:** @<!-- username -->
**Department:** <!-- infrastructure/providers/quality/documentation -->

---

**⚠️  CI Validation:** This PR will be validated for:
- ✅ Title format: `type(scope): description`
- ✅ Required sections: Purpose, Changes, Testing
- ✅ Issue references: `Closes #` or `Fixes #`
- ✅ Labels: `type/*` and `dept/*`
- ✅ Code formatting: `bun run format:check`
- ✅ TypeScript: `bun tsc -b --noEmit`
- ✅ Tests: `bun test`
- ✅ Commit messages: Follow conventional format
- ✅ No secrets: Security scan
- ✅ PR size: Auto-labeled
