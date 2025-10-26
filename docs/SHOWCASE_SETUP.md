# Showcase Repository Setup Guide

This guide walks through setting up the repository for production-grade showcase status.

## 🎯 Goal

Transform the repo into a **clone → bun install → alchemy deploy → extend** showcase with:
- Live release feeds
- Branch hygiene & protection
- Profile-driven environments
- Consumer app templates

## 📦 What's Included

### 1. GitHub Workflows

**CI Matrix** (`.github/workflows/ci-matrix.yml`)
- Runs tests for all packages in parallel
- Validates builds on every push/PR
- Matrix strategy: `[bun-runtime, mcp-server, blocks, cli]`

**Release Feed** (`.github/workflows/release-feed.yml`)
- Triggers on release publication
- Placeholder for future webhook integration

### 2. Consumer App Template

Location: `templates/app/`

Includes:
- `alchemy.config.ts` - Profile-driven configuration
- `package.json` - Scripts for dev/deploy/build/test
- `src/client.tsx` - React frontend starter
- `README.md` - App-specific documentation
- `.gitignore` - Standard ignores

### 3. Dev Experience Scripts

Added to root `package.json`:

```bash
# Start MCP server + Alchemy dev in parallel
bun run kit:dev

# Scaffold new blocks (requires CLI package)
bun run kit:new block <name>

# Create prerelease tag and push
bun run kit:release

# Create new consumer app from template
bun run app:new --name=<app-name>

# Open RSS feed in browser
bun run feed:open
```

### 4. Repository Management Scripts

**`scripts/repo-setup.sh`**
- Enables auto-merge and delete-branch-on-merge
- Sets up branch protection for `main`
- Requires PR + CI checks
- Cleans up merged branches
- Creates release tags

**`scripts/branch-cleanup.sh`**
- Interactive script to clean up merged branches
- Confirms before deletion
- Safe to run anytime

## 🚀 Quick Start

### 1. Create a New App

```bash
# Scaffold from template
bun run app:new --name=my-demo

# Navigate to app
cd apps/my-demo

# Install dependencies
bun install

# Start dev server
bun run dev

# Deploy to dev environment
alchemy deploy --profile dev

# Deploy to production
bun run deploy
```

### 2. Develop the Kit

```bash
# Start both MCP and Alchemy dev servers
bun run kit:dev

# Make changes to packages/@alch/*
# Changes hot-reload automatically

# Run tests
bun run kit:test

# Build packages
bun run kit:build
```

### 3. Set Up Branch Protection

```bash
# Requires GitHub CLI and repo admin permissions
./scripts/repo-setup.sh
```

This will:
- Enable auto-merge
- Enable delete-branch-on-merge
- Protect `main` branch (require PR + CI)
- Clean up merged branches

### 4. Clean Up Old Branches

```bash
# Interactive cleanup
./scripts/branch-cleanup.sh
```

## 📋 Validation Checklist

Before considering the repo showcase-ready:

- [ ] **App Scaffolding**: `bun run app:new --name=test` creates working app
- [ ] **Installation**: `cd apps/test && bun install` succeeds
- [ ] **Dev Server**: `bun run kit:dev` starts both servers
- [ ] **CI Workflow**: Push triggers CI matrix for all packages
- [ ] **RSS Badge**: Visible in README with correct link
- [ ] **Branch Protection**: Main requires PR + CI (if permissions available)
- [ ] **Documentation**: README clear and comprehensive

## 🎨 Customizing the Template

### Modify App Template

Edit files in `templates/app/`:

```typescript
// templates/app/alchemy.config.ts
export default alchemy({
  name: "my-app",
  async setup() {
    // Add your blocks here
    const { worker: api } = ChatBlock("api");
    const cache = CacheBlock("cache");
    
    return { api, cache };
  },
});
```

### Add More Templates

Create additional templates:

```bash
mkdir -p templates/api-only
mkdir -p templates/full-stack
mkdir -p templates/minimal
```

Update `app:new` script to support template selection:

```json
"app:new": "mkdir -p ./apps/$npm_config_name && cp -r templates/$npm_config_template/* ./apps/$npm_config_name/ && cd apps/$npm_config_name && bun install"
```

Usage:
```bash
bun run app:new --name=my-api --template=api-only
```

## 🔧 CI Configuration

### Matrix Strategy

The CI matrix runs tests for each package:

```yaml
strategy:
  matrix:
    folder: [bun-runtime, mcp-server, blocks, cli]
```

### Adding New Packages

1. Create package in `packages/@alch/<name>`
2. Add to matrix in `.github/workflows/ci-matrix.yml`
3. Ensure package has tests: `bun test`

## 📊 Monitoring

### CI Status

View CI runs:
```bash
gh run list --workflow=ci-matrix.yml
```

### Release Feed

Subscribe to releases:
- **Atom**: https://github.com/brendadeeznuts1111/alchmenyrun/releases.atom
- **RSS**: Use any RSS reader

### Branch Status

Check protected branch settings:
```bash
gh api repos/brendadeeznuts1111/alchmenyrun/branches/main/protection
```

## 🎯 Best Practices

### Branch Strategy

1. **Main branch**: Protected, requires PR + CI
2. **Feature branches**: `feat/description`
3. **Bug fixes**: `fix/description`
4. **Docs**: `docs/description`

### Release Process

1. Merge features to `main`
2. Create release tag: `git tag v2.0.0-kit-beta`
3. Push tag: `git push origin v2.0.0-kit-beta`
4. GitHub Action triggers release feed

### App Development

1. Scaffold from template: `bun run app:new`
2. Develop locally: `bun run dev`
3. Test: `bun test`
4. Deploy to dev: `alchemy deploy --profile dev`
5. Deploy to prod: `alchemy deploy --profile prod`

## 🐛 Troubleshooting

### Template TypeScript Errors

**Issue**: Template shows TS errors for `@alch/*` imports

**Solution**: This is expected. Errors resolve when users run `bun install` in their app.

### Branch Protection Fails

**Issue**: `./scripts/repo-setup.sh` fails with permission error

**Solution**: Requires GitHub CLI (`gh`) and repo admin permissions. Contact repo owner.

### CI Matrix Fails

**Issue**: CI fails for specific package

**Solution**: 
1. Check package has tests: `bun test packages/@alch/<name>`
2. Verify package builds: `bun run kit:build`
3. Review CI logs: `gh run view <run-id>`

### App Scaffolding Fails

**Issue**: `bun run app:new` doesn't create app

**Solution**: Ensure `templates/app/` exists with all required files.

## 📚 Additional Resources

- [Alchemy Documentation](../README.md)
- [Block Reference](./BLOCKS.md)
- [MCP Server Guide](./MCP_SERVER.md)
- [Contributing Guide](../CONTRIBUTING.md)

## 🎉 Success!

Your repo is now showcase-ready when:
- ✅ Anyone can clone and get started in minutes
- ✅ CI validates all changes automatically
- ✅ Templates make extending trivial
- ✅ Documentation is clear and comprehensive
- ✅ Branch protection prevents accidental breaks
- ✅ Release feed keeps community informed
