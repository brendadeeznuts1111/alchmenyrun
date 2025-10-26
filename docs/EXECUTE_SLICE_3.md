# Execute Slice 3 - One Command

**Status**: Ready to execute after PR #17 merges

## Prerequisites

- [x] PR #17 merged
- [x] Local main branch updated
- [x] Clean working directory

## The One-Liner

Copy-paste this entire command when PR #17 is merged:

```bash
git checkout main && git pull && \
git checkout -b feat/cli-generators && \
mkdir -p packages/@alch/cli/{src,bin,templates/{resource,block/chat,workflow,cron}} && \
echo "Creating CLI package files..." && \
cat > packages/@alch/cli/package.json << 'EOF'
{
  "name": "@alch/cli",
  "version": "0.1.0",
  "description": "CLI generators for Alchemy infrastructure",
  "type": "module",
  "bin": {
    "alchemy-kit": "./bin/alchemy-kit.js"
  },
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "keywords": ["alchemy", "cli", "generator", "infrastructure"],
  "author": "",
  "license": "MIT"
}
EOF
```

Then create the files manually from `docs/SLICE_3_CLI_GENERATORS.md` or use the automated script below.

## Automated Script (Alternative)

Save this as `scripts/create-slice-3.sh`:

```bash
#!/usr/bin/env bash
set -e

echo "🚀 Creating Slice 3: CLI Generators"

# Create directories
mkdir -p packages/@alch/cli/{src,bin,templates/{resource,block/chat,workflow,cron}}

# Create package.json
cat > packages/@alch/cli/package.json << 'EOF'
{
  "name": "@alch/cli",
  "version": "0.1.0",
  "description": "CLI generators for Alchemy infrastructure",
  "type": "module",
  "bin": { "alchemy-kit": "./bin/alchemy-kit.js" },
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "keywords": ["alchemy", "cli", "generator", "infrastructure"],
  "author": "",
  "license": "MIT"
}
EOF

# Create bin entry point
cat > packages/@alch/cli/bin/alchemy-kit.js << 'EOF'
#!/usr/bin/env bun
import "../src/index.ts";
EOF

chmod +x packages/@alch/cli/bin/alchemy-kit.js

# Create main CLI logic (see docs/SLICE_3_CLI_GENERATORS.md for full code)
echo "✅ Package structure created"
echo "📝 Now copy the code from docs/SLICE_3_CLI_GENERATORS.md"
echo ""
echo "Files to create:"
echo "  - packages/@alch/cli/src/index.ts"
echo "  - packages/@alch/cli/templates/resource/worker.ts"
echo "  - packages/@alch/cli/templates/block/chat/do.ts"
echo "  - packages/@alch/cli/templates/block/chat/worker.ts"
echo "  - packages/@alch/cli/templates/workflow/workflow.ts"
echo "  - packages/@alch/cli/templates/cron/handler.ts"
```

Then run:

```bash
bash scripts/create-slice-3.sh
```

## Manual Steps (Recommended)

1. **Create branch**
   ```bash
   git checkout main && git pull
   git checkout -b feat/cli-generators
   ```

2. **Create package structure**
   ```bash
   mkdir -p packages/@alch/cli/{src,bin,templates/{resource,block/chat,workflow,cron}}
   ```

3. **Copy files from spec**
   Open `docs/SLICE_3_CLI_GENERATORS.md` and copy each file:
   - `package.json`
   - `bin/alchemy-kit.js`
   - `src/index.ts`
   - All template files

4. **Test locally**
   ```bash
   cd packages/@alch/cli
   bun link
   cd ../..
   alchemy-kit generate resource hello
   ```

5. **Commit and push**
   ```bash
   git add -A
   git commit -m "feat: Add CLI generators (Slice 3)"
   git push origin feat/cli-generators
   ```

6. **Create PR**
   ```bash
   gh pr create --title "feat: CLI generators (Slice 3)" \
     --body-file docs/SLICE_3_PR_BODY.md \
     --label "cli,enhancement" \
     --base main
   ```

## After Slice 3 Merges

### 1. Publish Preview Builds

```bash
# Publish to npm
cd packages/@alch/bun-runtime && npm publish --tag rc
cd ../mcp-server && npm publish --tag rc
cd ../blocks && npm publish --tag rc
cd ../cli && npm publish --tag rc
```

### 2. Cut GitHub Release

```bash
git tag v2.0.0-kit-beta
git push origin v2.0.0-kit-beta

gh release create v2.0.0-kit-beta \
  --title "v2.0.0-kit-beta - Infrastructure Kit" \
  --notes "🚀 Phase 2 Complete: Batteries-Included Infrastructure Kit

## New Packages

- \`@alch/bun-runtime\` - Native Bun APIs
- \`@alch/mcp-server\` - AI integration via MCP
- \`@alch/blocks\` - Reusable building blocks
- \`@alch/cli\` - Code generators

## Install

\`\`\`bash
bun add @alch/bun-runtime@rc
bun add @alch/mcp-server@rc
bun add @alch/blocks@rc
bun add -g @alch/cli@rc
\`\`\`

## Quick Start

\`\`\`bash
alchemy-kit generate resource hello
alchemy-kit g block chat-room
\`\`\`

See docs/ for complete guides!" \
  --prerelease
```

### 3. Announce

Post to:
- GitHub Discussions
- Twitter/X
- Discord/Slack communities
- Cloudflare Discord

### 4. Open for Community Templates

Create `CONTRIBUTING.md` with template submission guidelines.

## Success Metrics

Phase 2 is complete when:
- [x] All 3 slices merged
- [ ] Preview builds published to npm
- [ ] GitHub release created
- [ ] Community can submit templates
- [ ] Documentation is comprehensive

## Timeline

- **Now**: PR #17 in review
- **Next**: Execute Slice 3 (30 minutes)
- **Then**: Publish and announce (1 hour)
- **Total**: Phase 2 complete in < 2 hours! 🚀

---

**We're ONE command away from shipping the infrastructure kit!** 🍾
