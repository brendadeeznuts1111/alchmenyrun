# Changelog

All notable changes to `tgk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- AI-driven release type suggestions (`tgk ai suggest release-type`)
- Policy-gated release validation (`tgk policy check release`)
- Release orchestration (`tgk orchestrate release-announcement`)
- Enhanced CI/CD workflow with human-in-the-loop validation
- Bun semver integration (20x faster than node-semver)

### Changed
- Integrated `release-it` for comprehensive release management
- Enhanced version bumping with canary support
- Improved observability with release metrics

## [4.4.0] - 2025-10-27

### Added
- **Forum Discovery & Polish-Audit** - Complete implementation (§19.3.4)
  - `tgk forum audit` - Discovers and analyzes all forum topics
  - `tgk forum polish` - Idempotent rename + perfect-pin operations
  - `tgk forum report` - Summary cards with metrics and deep-links
  - `tgk ai suggest polish` - AI-powered emoji and stream type suggestions
- **Perfect Pins** (§19.3.3) - Dynamic personalized pinned messages
  - Multi-language support (en, fr, de, es)
  - User-specific content and pending review counts
  - Emergency contact routing by stream type
- **Stream Lifecycle Management** - Complete CRUD operations
- **Enhanced AI Features** - Template suggestions, reviewer assignment
- **Policy-Gated Operations** - OPA integration for security and compliance
- **Comprehensive Version Management** - Bun semver integration

### Changed
- Enhanced CLI with 15+ new commands
- Improved error handling and user feedback
- Added audit trails for all operations
- Integrated GitHub Actions workflows

### Technical
- **Performance**: 20x faster semver operations with Bun
- **Security**: Token validation and audit logging
- **Observability**: Prometheus metrics integration
- **Automation**: Quarterly forum polish scheduling

---

## Release Types

### Standard Releases
- **Patch** (`x.y.Z`): Bug fixes, no breaking changes
- **Minor** (`x.Y.z`): New features, backward compatible
- **Major** (`X.y.z`): Breaking changes

### Pre-releases
- **Canary** (`x.y.z-canary.N`): Pre-release testing versions

---

## Version Management

Versions are managed using Bun's semver API with the following commands:

```bash
# Standard releases
bun run version:patch   # 4.4.0 → 4.4.1
bun run version:minor   # 4.4.0 → 4.5.0
bun run version:major   # 4.4.0 → 5.0.0

# Pre-releases
bun run version:canary  # 4.4.0 → 4.4.1-canary.0

# Release management
bun run release:patch   # Full release-it workflow
bun run release:ai-suggest  # AI release type recommendation
```

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
