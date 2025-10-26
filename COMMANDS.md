# 🎮 Command Reference

Quick reference for all Alchemy.run commands and scripts.

## 📦 App Management

### Create New App
```bash
./scripts/create-app.sh <app-name>
# Example: ./scripts/create-app.sh my-api
```

### Install Dependencies
```bash
cd apps/<app-name>
bun install
```

### Start Dev Server
```bash
bun run dev                    # Standard dev server
bun run kit:dev               # With MCP server
```

## 🚀 Deployment

### Deploy to Environment
```bash
alchemy deploy                 # Default profile
alchemy deploy --profile dev   # Dev environment
alchemy deploy --profile prod  # Production
```

### Quick Deploy Commands
```bash
bun run deploy                 # Deploy default
bun run deploy:prod           # Deploy to production
bun run deploy:read           # Read-only (dry run)
```

### Destroy Resources
```bash
bun run destroy               # Destroy default
bun run destroy:prod          # Destroy production
```

## 🧪 Testing

### Run Tests
```bash
bun test                      # All tests
bun run test:watch           # Watch mode
bun run test:ui              # UI mode
bun run test:integration     # Integration tests
bun run test:webhook         # Webhook tests
```

### Kit Tests
```bash
bun run kit:test             # Test all packages
bun test packages/@alch/*/src  # Direct test
```

## 🔨 Building

### Build Frontend
```bash
bun run build                # Build CSS + assets
bun run build:css            # Build CSS only
```

### Build Kit Packages
```bash
bun run kit:build            # Build all packages
```

## 🛠️ Development

### Code Quality
```bash
bun run check                # Type check + format check
bun run format               # Format code
bun run format:check         # Check formatting
```

### Database
```bash
bun run db:generate          # Generate migrations
bun run db:migrate           # Run migrations
```

## 🎯 Kit Development

### Start Kit Dev
```bash
bun run kit:dev              # MCP + Alchemy dev
bun run mcp:claude           # MCP server only
```

### Scaffold Resources
```bash
bun run kit:new block <name>      # Create new block
bun run kit:new resource <name>   # Create new resource
```

### Release
```bash
bun run kit:release          # Create prerelease tag
git tag v2.0.0-kit-beta     # Manual tag
git push origin --tags       # Push tags
```

## 🌐 Repository Management

### Branch Protection Setup
```bash
./scripts/repo-setup.sh      # One-time setup
```
**Requires**: GitHub CLI (`gh`) + admin permissions

**Sets up**:
- Auto-merge on approval
- Delete branch on merge
- Main branch protection
- Required CI checks

### Branch Cleanup
```bash
./scripts/branch-cleanup.sh  # Interactive cleanup
```
**Cleans**: Merged branches (interactive confirmation)

### View Releases
```bash
bun run feed:open            # Open RSS feed in browser
```

## 📊 Monitoring

### Check Alchemy Version
```bash
bun run watch:alchemy        # Check for 0.77.0 release
```

### View CI Status
```bash
gh run list --workflow=ci-matrix.yml
gh run view <run-id>
```

### Check Branch Protection
```bash
gh api repos/brendadeeznuts1111/alchmenyrun/branches/main/protection
```

## 🔍 Inspection

### View Deployment
```bash
PHASE=read bun ./alchemy.run.ts
bun run scope:test
```

### List Resources
```bash
alchemy list                 # List all resources
alchemy describe <resource>  # Describe resource
```

## 🎨 Customization

### Edit Configuration
```bash
# App config
vim apps/<app-name>/alchemy.config.ts

# Root config
vim alchemy.run.ts
```

### Add Routes
```bash
# Edit worker
vim apps/<app-name>/src/api.ts
```

### Modify Frontend
```bash
# Edit React app
vim apps/<app-name>/src/client.tsx
```

## 📚 Documentation

### View Docs
```bash
# Setup guide
cat docs/SHOWCASE_SETUP.md

# Quick start
cat QUICK_START.md

# Validation
cat PHASE3_VALIDATION.md

# This reference
cat COMMANDS.md
```

### Open GitHub
```bash
open https://github.com/brendadeeznuts1111/alchmenyrun
```

## 🆘 Troubleshooting

### Clean Install
```bash
rm -rf node_modules bun.lock
bun install
```

### Reset App
```bash
cd apps/<app-name>
rm -rf node_modules bun.lock
bun install
```

### View Logs
```bash
# Cloudflare logs
wrangler tail <worker-name>

# Local logs
bun run dev --verbose
```

### Authentication
```bash
bun alchemy login            # Re-authenticate
bun alchemy configure        # Reconfigure profile
```

## 🎯 Common Workflows

### New Feature Development
```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes
vim src/...

# 3. Test locally
bun test
bun run dev

# 4. Deploy to dev
alchemy deploy --profile dev

# 5. Create PR
git push origin feat/my-feature
gh pr create
```

### New App Development
```bash
# 1. Scaffold app
./scripts/create-app.sh my-app

# 2. Install & configure
cd apps/my-app
bun install
vim alchemy.config.ts

# 3. Develop
bun run dev

# 4. Test
bun test

# 5. Deploy
alchemy deploy --profile dev
alchemy deploy --profile prod
```

### Release Process
```bash
# 1. Merge to main
gh pr merge <pr-number> --squash

# 2. Create tag
git tag v2.0.0-kit-beta
git push origin v2.0.0-kit-beta

# 3. Verify release
bun run feed:open
```

## 💡 Pro Tips

### Aliases (add to ~/.bashrc or ~/.zshrc)
```bash
alias alchemy-new='./scripts/create-app.sh'
alias alchemy-dev='bun run kit:dev'
alias alchemy-test='bun test'
alias alchemy-deploy='alchemy deploy --profile'
```

### Watch for Changes
```bash
# Watch tests
bun run test:watch

# Watch Alchemy version
watch -n 60 'bun run watch:alchemy'
```

### Quick Deploy
```bash
# One-liner: test + deploy
bun test && alchemy deploy --profile prod
```

### Parallel Development
```bash
# Terminal 1: Dev server
bun run kit:dev

# Terminal 2: Tests
bun run test:watch

# Terminal 3: Your editor
vim src/...
```

## 🔗 External Commands

### GitHub CLI
```bash
gh repo view                 # View repo
gh pr list                   # List PRs
gh run list                  # List workflow runs
gh release list              # List releases
```

### Cloudflare Wrangler
```bash
wrangler whoami              # Check auth
wrangler deployments list    # List deployments
wrangler tail <worker>       # Stream logs
wrangler kv:key list         # List KV keys
```

### Git
```bash
git status                   # Check status
git branch -a                # List branches
git log --oneline -10        # Recent commits
git tag -l                   # List tags
```

---

**💡 Tip**: Bookmark this file for quick reference!

**📚 More Help**: See `QUICK_START.md` and `docs/SHOWCASE_SETUP.md`
