# Bun Native Semver Integration

This directory contains the Bun-native semver release tooling that ensures every version tag is **valid, comparable, and bump-able**.

## Files

- **`semver-helper.ts`** - Core Bun-native semver validation & bump logic
- **`tgk-release`** - Main release script with integrated semver validation
- **`../docs/semver-release-guide.md`** - Complete usage guide

## Quick Start

```bash
# Check current version
bun scripts/semver-helper.ts --current

# Preview a bump (dry-run)
bun scripts/semver-helper.ts patch --dry-run

# Release with validation
./scripts/tgk-release --bump patch
./scripts/tgk-release --bump minor --stage prod
./scripts/tgk-release --bump major
```

## NPM Scripts

```bash
# Check version
bun run version:current

# Preview bumps
bun run version:patch  # 0.5.0 → 0.5.1
bun run version:minor  # 0.5.0 → 0.6.0
bun run version:major  # 0.5.0 → 1.0.0

# Execute releases
bun run release:patch
bun run release:minor
bun run release:major
```

## How It Works

1. **Reads** current version from `package.json`
2. **Calculates** next version based on bump type (patch/minor/major)
3. **Validates** with `semver.order()` from Bun's native semver
4. **Updates** `package.json` atomically
5. **Runs** quality checks (TypeScript, formatting)
6. **Creates** git tag only if all checks pass
7. **Pushes** to remote

## Safety Guarantees

✅ **Cannot create invalid tags** (e.g., `1.0.0 → 1.0.0`)
✅ **Cannot create non-incrementing tags** (e.g., `1.0.1 → 1.0.0`)
✅ **20× faster than node-semver**
✅ **Zero external dependencies** (Bun ships it)

## CI Integration

See `.github/workflows/semver-validation.yml` for automatic:
- Semver format validation on package.json changes
- Version bump validation on new tags
- Tag/package.json consistency checks

## Team Ownership

This release system is maintained by:

- **Infrastructure Team** (@alice.smith, @infra_dev1) - Scripts & CI/CD
  - Issue Topic: `#semver-tooling` in [@alchemist_infra_team](https://t.me/+nieD7pJAJ4NmYWQx)
- **Quality & Testing Team** (@diana.prince, @qa_analyst1) - Validation workflow
  - Issue Topic: `#ci-workflow-failures` in [@alchemist_quality_gate](https://t.me/+QualityGateDiscuss)
- **Documentation Team** (@frank.taylor, @doc_writer1) - Release guides
  - Issue Topic: `#documentation` in [@alchemist_docs_discuss](https://t.me/+DocsTeamDiscuss)

See [CODEOWNERS](../.github/CODEOWNERS) for full ownership matrix.

**Support Channels:**

| Channel | Type | Link |
|---------|------|------|
| Infrastructure (bi-directional) | Telegram Group | https://t.me/+nieD7pJAJ4NmYWQx |
| Quality & Testing (bi-directional) | Telegram Group | https://t.me/+QualityGateDiscuss |
| CI Status (broadcast) | Telegram Channel | https://t.me/+S7yXUYv8nvs1NGFh |
| GitHub Issues (bi-directional) | Issue Tracker | [Create issue](https://github.com/brendadeeznuts1111/alchmenyrun/issues) |
| Council Email | Email | conduct@alchemists.dev |

**Report Issues:**
- Script bugs → Post in `#semver-tooling` @ Infrastructure Group
- CI failures → Post in `#ci-workflow-failures` @ Quality Group
- Doc issues → Post in `#documentation` @ Documentation Group

## Documentation

Full guide: [`../docs/semver-release-guide.md`](../docs/semver-release-guide.md)

---

**Ship versions with confidence** — Bun's native semver has you covered. 🚀
