# Alchemy 0.77.0 Upgrade Checklist

**Issue**: #12  
**Branch**: `upgrade/alchemy-077`  
**Expected Time**: 2 minutes

## 🚀 ONE-LINER (Copy-Paste When 0.77.0 Drops)

```bash
git checkout -b upgrade/alchemy-077 && \
bun add alchemy@^0.77.0 && \
bun alchemy deploy --profile prod && \
git commit -am "chore: Upgrade to Alchemy 0.77.0

Closes #12" && \
git push origin upgrade/alchemy-077 && \
gh pr create --title "chore: Upgrade Alchemy to 0.77.0" --body "Final piece for v1.0!

Closes #12" --label "dependencies" --milestone "v1.0 - Core Infrastructure" && \
gh pr merge --squash --delete-branch && \
git checkout main && git pull && \
git tag v1.0.0 && git push origin v1.0.0 && \
gh release create v1.0.0 --title "v1.0.0 - Core Infrastructure" --notes-file .github/RELEASE_NOTES_v1.0.0.md
```

**Result:** v1.0.0 tagged and released! 🎉

---

## Pre-Upgrade

- [ ] Verify 0.77.0 is published: `npm view alchemy version`
- [ ] Ensure you're on main: `git checkout main && git pull`

## Upgrade Steps

### 1. Update package.json

```bash
bun add alchemy@^0.77.0
```

**Expected diff:**
```diff
  "dependencies": {
-   "alchemy": "^0.76.1",
+   "alchemy": "^0.77.0",
  }
```

### 2. Verify Build

```bash
bun run check
```

Expected: ✅ All checks pass

### 3. Test Deployment

```bash
bun alchemy deploy --profile prod
```

Expected: ✅ Deployment succeeds

### 4. Smoke Test

```bash
# Health check
curl https://cloudflare-demo-website-prod.utahj4754.workers.dev/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

## Create PR

```bash
git add package.json bun.lock
git commit -m "chore: Upgrade Alchemy to 0.77.0

- Update alchemy dependency to ^0.77.0
- Verify deployment and smoke tests pass

Closes #12"

git push origin upgrade/alchemy-077

gh pr create \
  --title "chore: Upgrade Alchemy to 0.77.0" \
  --body "Final piece for v1.0 milestone!

## Changes
- ✅ Bump alchemy to 0.77.0
- ✅ Verify deployment works
- ✅ Smoke tests pass

Closes #12" \
  --label "dependencies" \
  --milestone "v1.0 - Core Infrastructure" \
  --base main
```

## Merge & Release

- [ ] Wait for CI to pass
- [ ] Merge PR: `gh pr merge --squash --delete-branch`
- [ ] Pull main: `git checkout main && git pull`
- [ ] Tag release: `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Publish release: `gh release create v1.0.0 --title "v1.0.0 - Core Infrastructure" --notes-file .github/RELEASE_NOTES_v1.0.0.md`

## Post-Release

- [ ] Verify release is live: https://github.com/brendadeeznuts1111/alchmenyrun/releases/tag/v1.0.0
- [ ] Close milestone: `gh issue list --milestone "v1.0 - Core Infrastructure"` (should be empty)
- [ ] Celebrate! 🎉

## Rollback (if needed)

```bash
bun add alchemy@^0.76.1
bun alchemy deploy --profile prod
```
