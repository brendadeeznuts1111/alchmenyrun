# Commands Reference

Complete reference for all `tgk` forum governance and orchestration commands.

## 🏛️ Forum Governance Commands

### Overview
Forum governance commands manage 21+ topics across 6 streams with automated capacity limits, lifecycle policies, and quality gates.

### Core Commands

#### `tgk forum governance limits`
Display capacity limits for all streams.

```bash
tgk forum governance limits
```

**Output:**
```
📊 FORUM GOVERNANCE LIMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 STREAM CAPACITY LIMITS:
• Security (🛡️): Max 5 active topics
• SRE (⚙️): Max 8 active topics  
• Data (📊): Max 6 active topics
• Product (✨): Max 4 active topics
• Performance (🚀): Max 3 active topics
• Compliance (📜): Max 3 active topics
```

#### `tgk forum governance monitor`
Real-time health monitoring dashboard.

```bash
tgk forum governance monitor
```

**Features:**
- Stream utilization metrics
- Topic health indicators
- Compliance percentages
- Alert system for issues

#### `tgk forum governance validate`
Comprehensive system validation.

```bash
tgk forum governance validate [stream] [council_id]
```

**Parameters:**
- `stream` (optional): Specific stream or "all" (default)
- `council_id` (optional): Telegram council ID (default: 1003293940131)

**Validations:**
- Stream capacity compliance
- Naming convention adherence
- Perfect pin implementation
- Lifecycle policy enforcement
- API error handling

#### `tgk forum governance create`
Pre-flight topic creation with capacity checking.

```bash
tgk forum governance create <stream> <title> <owner>
```

**Example:**
```bash
tgk forum governance create security "🛡️ Security Audit Q4" @alice
```

**Checks:**
- Stream capacity availability
- Title format compliance
- Owner permissions
- Quality gate validation

#### `tgk forum governance archive`
Assess topic archival readiness.

```bash
tgk forum governance archive <stream> <topic_id>
```

**Assessment Criteria:**
- Activity threshold (90 days)
- Reference dependencies
- Impact analysis
- Migration requirements

---

## 🚀 Orchestration Commands

### Overview
Release orchestration provides AI-driven, policy-gated release management with automated security checks.

### Core Commands

#### `tgk orchestrate`
Main orchestration entry point.

```bash
tgk orchestrate <command> [options]
```

**Available Commands:**
- `release-verify` - Verify release readiness
- `release-security-check` - Run security scans
- `release-announcement` - Deploy and announce

#### `tgk orchestrate release-verify`
AI-powered release verification.

```bash
tgk orchestrate release-verify [--version <version>]
```

**Checks:**
- Dependency security
- Test coverage validation
- Performance benchmarks
- Breaking change analysis

#### `tgk orchestrate release-security-check`
Automated security scanning.

```bash
tgk orchestrate release-security-check [--severity <level>]
```

**Security Levels:**
- `critical` - Critical vulnerabilities only
- `high` - High and above (default)
- `medium` - Medium and above
- `low` - All vulnerabilities

#### `tgk orchestrate release-announcement`
Deploy with automated announcement.

```bash
tgk orchestrate release-announcement [--channel <channel>] [--dry-run]
```

**Features:**
- Automated deployment
- Release note generation
- Social media announcements
- Team notifications

---

## 📊 Forum Audit Commands

### `tgk forum audit`
Comprehensive forum analysis.

```bash
tgk forum audit -c <council_id> [-o json|text]
```

**Output Formats:**
- `text` (default): Human-readable report
- `json`: Machine-readable data

**Metrics:**
- Total topic count
- Stream distribution
- Naming compliance
- Pin status analysis

---

## 🔧 Utility Commands

### `tgk forum polish`
Topic naming and pinning optimization.

```bash
tgk forum polish --dry-run --audit <file>
tgk forum polish --apply --audit <file>
```

**Operations:**
- Emoji naming standardization
- Pin optimization
- Topic reorganization
- Quality improvements

### `tgk forum report`
Generate summary reports.

```bash
tgk forum report --audit <file> [--pin] -c <council_id>
```

**Report Types:**
- Standard summary
- Pin analysis (with --pin)
- Health metrics
- Trend analysis

---

## 🎯 Command Examples

### Daily Governance Workflow
```bash
# 1. Check system health
tgk forum governance monitor

# 2. Validate compliance
tgk forum governance validate all 1003293940131

# 3. Check capacity before creating topics
tgk forum governance limits

# 4. Create new topic with pre-flight check
tgk forum governance create data "📊 Analytics Dashboard v2" @bob
```

### Release Workflow
```bash
# 1. Verify release readiness
tgk orchestrate release-verify --version 1.2.0

# 2. Run security scans
tgk orchestrate release-security-check --severity high

# 3. Deploy and announce
tgk orchestrate release-announcement --channel releases
```

### Audit and Reporting
```bash
# 1. Full forum audit
tgk forum audit -c 1003293940131 -o json > forum-audit.json

# 2. Generate summary report
tgk forum report --audit forum-audit.json --pin -c 1003293940131

# 3. Polish topics for compliance
tgk forum polish --dry-run --audit forum-audit.json
tgk forum polish --apply --audit forum-audit.json
```

---

## 🔐 Profile Integration

All commands support Alchemy profiles for multi-environment usage:

```bash
# Development environment
ALCHEMY_PROFILE=governance-dev tgk forum governance validate

# Production environment
ALCHEMY_PROFILE=governance-prod tgk forum governance monitor

# CI/CD automation
ALCHEMY_PROFILE=cicd tgk orchestrate release-verify
```

---

## 📈 Exit Codes

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | Command completed successfully |
| 1 | Usage Error | Invalid arguments or missing required parameters |
| 2 | Capacity Error | Stream at capacity, cannot create new topics |
| 3 | Validation Error | Governance validation failed |
| 4 | API Error | Telegram API communication failed |
| 5 | Permission Error | Insufficient permissions for operation |

---

## 🐛 Troubleshooting

### Common Issues

#### "Profile not found"
```bash
# Solution: Configure profile
alchemy configure --profile governance-prod
alchemy login --profile governance-prod
```

#### "Stream at capacity"
```bash
# Solution: Check capacity and archive old topics
tgk forum governance limits
tgk forum governance archive <stream> <topic_id>
```

#### "API communication failed"
```bash
# Solution: Check network and token validity
tgk forum governance validate  # Tests API connectivity
```

---

## 🔗 Related Documentation

- [Profiles Guide](./profiles.md) - Multi-environment setup
- [API Reference](./api.md) - REST API documentation
- [Orchestration Guide](./orchestration.md) - Advanced release automation
- [Security Policies](./security.md) - Security configuration

---

**Last Updated**: October 27, 2025  
**Version**: v1.0.0  
**Status**: ✅ Production-ready commands
