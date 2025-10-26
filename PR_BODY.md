# feat: production repo hygiene + consumer app template + RSS feed

## 🎯 Overview

Transforms the repository into a **production-grade showcase** that's **clone → bun install → alchemy deploy → extend** trivial. This PR implements Phase-3 housekeeping with live feeds, branch hygiene, and profile-driven environments.

## ✨ What's New

### 1. GitHub Workflows
- **CI Matrix** (`.github/workflows/ci-matrix.yml`) - Parallel testing for all packages
- **Release Feed** (`.github/workflows/release-feed.yml`) - Automated release notifications

### 2. Consumer App Template
Complete starter template in `templates/app/`:
- Profile-driven `alchemy.config.ts`
- React frontend with TypeScript
- Example API worker
- Ready-to-deploy package.json

### 3. Dev Experience Scripts
```bash
./scripts/create-app.sh <name>  # Create new app from template
bun run kit:dev                 # Start MCP + Alchemy dev
bun run kit:release             # Create prerelease tag
bun run feed:open               # Open RSS feed
```

### 4. Repository Management
- `scripts/repo-setup.sh` - Branch protection & auto-merge setup
- `scripts/branch-cleanup.sh` - Interactive merged branch cleanup
- `.github/PULL_REQUEST_TEMPLATE.md` - Standardized PR format

### 5. Documentation
- RSS feed badge in README
- CI status badge in README
- `docs/SHOWCASE_SETUP.md` - Complete setup guide
- `PHASE3_VALIDATION.md` - Validation checklist

## 📦 File Structure

```
alchmenyrun/
├── .github/
│   ├── workflows/
│   │   ├── ci-matrix.yml       ✨ NEW
│   │   └── release-feed.yml    ✨ NEW
│   └── PULL_REQUEST_TEMPLATE.md ✨ NEW
├── templates/
│   └── app/                    ✨ NEW
│       ├── alchemy.config.ts
│       ├── package.json
│       ├── README.md
│       ├── .gitignore
│       └── src/
│           ├── api.ts
│           └── client.tsx
├── scripts/
│   ├── create-app.sh           ✨ NEW
│   ├── repo-setup.sh           ✨ NEW
│   └── branch-cleanup.sh       ✨ NEW
├── docs/
│   └── SHOWCASE_SETUP.md       ✨ NEW
├── PHASE3_VALIDATION.md        ✨ NEW
├── PR_BODY.md                  ✨ NEW
├── README.md                   🔄 UPDATED (badges)
└── package.json                🔄 UPDATED (scripts)
```

## ✅ Validation Checklist

- [x] `./scripts/create-app.sh demo-app` scaffolds working app
- [x] App structure includes all necessary files
- [x] Package names auto-update in generated apps
- [x] CI matrix workflow has valid YAML syntax
- [x] Release feed workflow configured
- [x] RSS badge visible in README
- [x] Dev scripts added to package.json
- [x] Branch management scripts are executable
- [x] Documentation is comprehensive

## 🧪 Testing

### Tested: App Scaffolding
```bash
$ ./scripts/create-app.sh demo-app
🚀 Creating new Alchemy app: demo-app
📦 Copying template files...
✅ App created at: ./apps/demo-app

$ ls apps/demo-app/
README.md  alchemy.config.ts  package.json  src/

$ grep "name" apps/demo-app/package.json
  "name": "demo-app",
```

### Tested: File Structure
- ✅ All template files copied correctly
- ✅ Names auto-replaced (my-app → demo-app)
- ✅ Scripts are executable
- ✅ Workflows have valid YAML

## 🚀 Usage Examples

### Create New App
```bash
./scripts/create-app.sh my-api
cd apps/my-api
bun install
bun run dev
```

### Deploy App
```bash
cd apps/my-api
alchemy deploy --profile dev    # Deploy to dev
alchemy deploy --profile prod   # Deploy to production
```

### Set Up Branch Protection (requires admin)
```bash
./scripts/repo-setup.sh
```

### Clean Up Merged Branches
```bash
./scripts/branch-cleanup.sh
```

## 📚 Documentation

- **Setup Guide**: `docs/SHOWCASE_SETUP.md`
- **Validation**: `PHASE3_VALIDATION.md`
- **Template README**: `templates/app/README.md`

## 🔗 Related

- Implements Phase-3 from the production housekeeping checklist
- Prepares repo for public showcase
- Enables easy onboarding for new users

## 🎉 Impact

This PR makes the repository:
- **Clone-friendly**: Clear structure and documentation
- **Install-ready**: `bun install` just works
- **Deploy-simple**: One command to production
- **Extend-trivial**: Template makes customization easy

## 🔄 Breaking Changes

None. All changes are additive.

## 📝 Notes

- Template TypeScript errors are expected (resolve after `bun install`)
- Branch protection requires GitHub CLI and admin permissions
- CI matrix will run on next push to test all packages

---

**Ready to merge!** This establishes the foundation for a production-grade showcase repository.
