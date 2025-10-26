# Phase-3 Production Housekeeping - Validation Guide

## ✅ Completed Components

### 1. GitHub Workflows
- ✅ `.github/workflows/release-feed.yml` - RSS feed automation
- ✅ `.github/workflows/ci-matrix.yml` - Multi-package CI testing

### 2. App Template Structure
- ✅ `templates/app/alchemy.config.ts` - Profile-driven config
- ✅ `templates/app/package.json` - Consumer app package
- ✅ `templates/app/README.md` - App documentation
- ✅ `templates/app/src/client.tsx` - React frontend starter
- ✅ `templates/app/.gitignore` - Git ignore rules

### 3. Dev Experience Scripts (package.json)
```bash
bun run kit:dev       # Start MCP + Alchemy dev server
bun run kit:new       # Scaffold new blocks
bun run kit:release   # Create prerelease tag
bun run app:new       # Create new consumer app
bun run feed:open     # Open RSS feed in browser
```

### 4. Repository Management
- ✅ `scripts/repo-setup.sh` - Branch protection & cleanup
- ✅ `scripts/branch-cleanup.sh` - Interactive branch cleanup

### 5. Documentation
- ✅ RSS feed badge in README
- ✅ CI Matrix badge in README

---

## 🧪 Validation Checklist

### Test 1: Create Consumer App
```bash
# Should create a new app in ./apps/demo
bun run app:new --name=demo

# Verify structure
ls -la apps/demo/
# Expected: alchemy.config.ts, package.json, README.md, src/, .gitignore

# Test installation (from apps/demo)
cd apps/demo && bun install
```

### Test 2: Scaffold New Block
```bash
# Note: This requires the CLI package to exist
bun run kit:new block chat-room
# Expected: Creates src/blocks/chat-room/ with worker.ts + do.ts
```

### Test 3: Dev Server
```bash
# Start both MCP and Alchemy dev
bun run kit:dev
# Expected: Both servers start in parallel
```

### Test 4: CI Matrix
```bash
# Verify workflow syntax
cat .github/workflows/ci-matrix.yml
# Expected: Valid YAML with matrix strategy for all packages
```

### Test 5: RSS Feed
```bash
# Open feed in browser
bun run feed:open
# Expected: Opens GitHub releases Atom feed
```

### Test 6: Branch Protection (requires GitHub CLI + permissions)
```bash
# Run setup script
./scripts/repo-setup.sh
# Expected: 
# - Auto-merge enabled
# - Delete-branch-on-merge enabled
# - Main branch protected with PR + CI requirements
```

---

## 📋 PR Checklist

When creating the PR `feat/repo-showcase`, include:

- [ ] `bun run app:new --name=test-app` scaffolds working app
- [ ] `bun run kit:new block hello` creates `./src/blocks/hello/` (requires CLI)
- [ ] `bun run kit:dev` starts both MCP and Alchemy dev server
- [ ] RSS badge shows in README
- [ ] Branch protection enabled (main requires PR + CI)
- [ ] CI matrix passes for each package

---

## 🚀 Next Steps

### Immediate (can do now)
1. **Test app scaffolding**: `bun run app:new --name=demo`
2. **Verify CI workflow**: Push to a branch and check Actions
3. **Test dev server**: `bun run kit:dev`

### Requires GitHub Permissions
1. **Branch protection**: Run `./scripts/repo-setup.sh`
2. **Clean branches**: Run `./scripts/branch-cleanup.sh`

### Future Enhancements
1. **CLI package**: Create `packages/@alch/cli` for `kit:new` command
2. **Release automation**: GitHub Action to auto-tag on merge
3. **App examples**: Add more templates (API-only, full-stack, etc.)

---

## 🎯 Usage Examples

### Create and Deploy New App
```bash
# 1. Scaffold app
bun run app:new --name=my-api
cd apps/my-api

# 2. Customize alchemy.config.ts
# Edit blocks, add routes, etc.

# 3. Deploy
alchemy deploy --profile dev

# 4. Deploy to production
alchemy deploy --profile prod
```

### Develop Kit Locally
```bash
# Start MCP server + Alchemy dev
bun run kit:dev

# In another terminal, make changes to packages/@alch/*
# Changes hot-reload automatically
```

### Release New Kit Version
```bash
# Create prerelease tag
bun run kit:release

# Or manually
git tag v2.0.0-kit-beta
git push origin v2.0.0-kit-beta
```

---

## 📦 File Structure

```
alchmenyrun/
├── .github/
│   └── workflows/
│       ├── ci-matrix.yml       # Multi-package CI
│       └── release-feed.yml    # RSS automation
├── templates/
│   └── app/                    # Consumer app template
│       ├── alchemy.config.ts
│       ├── package.json
│       ├── README.md
│       ├── src/
│       │   └── client.tsx
│       └── .gitignore
├── scripts/
│   ├── repo-setup.sh          # Branch protection setup
│   └── branch-cleanup.sh      # Interactive cleanup
└── package.json               # New dev scripts added
```

---

## ⚠️ Known Limitations

1. **CLI Package**: `bun run kit:new` requires `packages/@alch/cli` to exist
2. **Branch Protection**: Requires GitHub CLI (`gh`) and repo admin permissions
3. **Template TypeScript Errors**: Expected - resolve when users run `bun install`

---

## 🎉 Success Criteria

The repo is showcase-ready when:
- ✅ Clone → `bun install` → works
- ✅ `bun run app:new` → creates working app
- ✅ `alchemy deploy` → deploys successfully
- ✅ Extend → template is easy to customize
- ✅ CI → all packages tested on push
- ✅ Docs → clear badges and instructions
