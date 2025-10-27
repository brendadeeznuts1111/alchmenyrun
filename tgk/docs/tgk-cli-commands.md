# TGK CLI Commands - AI-Driven Workflow Orchestration

## Overview

TGK (Telegram Git Kit) is the central control plane for intelligent workflow orchestration and metadata management. This document outlines the enhanced command structure with AI-driven capabilities.

## Command Structure

### Issue Management (`tgk issue`)

AI-powered issue creation, triage, and management with automatic labeling and human-in-the-loop workflows.

#### `tgk issue-new`
Launch AI wizard to create issues with automatic labeling and confidence scoring.

```bash
tgk issue-new
```

**Features:**
- Interactive issue creation wizard
- AI-powered label suggestion with confidence scores
- Auto-triage for high-confidence suggestions (>80%)
- Enhanced reasoning and metadata

#### `tgk issue-triage <issue-number>`
AI-powered labeling and prioritization for existing issues.

```bash
tgk issue-triage 123
```

**Features:**
- Analyzes issue content and linked PRs
- Suggests `customer/group-*`, `topic/*`, `impact/*`, `status/*` labels
- Provides confidence scores and reasoning
- Human-in-the-loop for low-confidence suggestions
- Automatic label application for high-confidence (>80%) suggestions

#### `tgk issue-follow <issue-number>`
Set up notifications for issue status changes.

```bash
tgk issue-follow 123 --telegram @channel --email user@example.com
```

#### `tgk issue-status <issue-number>`
Get detailed issue status with AI-suggested next steps.

```bash
tgk issue-status 123 --detailed
```

### Release Management (`tgk release`)

AI-orchestrated release management with intelligent version bumping and council approval workflows.

#### `tgk release-plan --type <type>`
AI-generated release planning with optional AI-suggested version bumping.

```bash
# Manual type specification
tgk release-plan --type minor

# AI-powered type suggestion
tgk release-plan --type ai-suggest
```

**Features:**
- AI analyzes commit history, linked RFCs, and impact labels
- Suggests version bump type (patch/minor/major) with confidence
- Generates comprehensive changelog and impact assessment
- Posts to Alchemists Council for approval
- Includes commit analysis breakdown (features/fixes/breaking changes)

#### `tgk release-approve <release-id>`
Council approval for release plans via Telegram.

```bash
tgk release-approve release-123456 --reviewer username
```

#### `tgk release-deploy <release-id>`
Policy-gated deployment of approved release plans.

```bash
tgk release-deploy release-123456
```

#### `tgk release-monitor <release-id>`
Post-release SLO/SLI monitoring with AI anomaly detection.

```bash
tgk release-monitor release-123456 --duration 24 --sensitivity medium
```

### GitHub Integration (`tgk github`)

Comprehensive GitHub repository management with enhanced metadata control.

#### `tgk github repo info [repo-name]`
Get detailed repository information including CODEOWNERS.

```bash
# Default repository
tgk github repo info

# Specific repository
tgk github repo info alchmenyrun

# External repository
tgk github repo_info owner/repo

# Detailed information
tgk github repo info alchmenyrun --detailed
```

**Features:**
- Repository metadata (stars, forks, issues, language)
- Creation and update dates
- Topics and license information
- CODEOWNERS file content (when available)
- Watcher count and default branch

#### `tgk github labels apply <repo-name> --issue <id> --labels "label1,label2"`
Apply labels to issues with support for multiple labels.

```bash
# Apply single label
tgk github labels apply alchmenyrun --issue 123 --labels "bug"

# Apply multiple labels
tgk github labels apply alchmenyrun --issue 123 --labels "bug,high-priority,needs-review"

# Apply to external repository
tgk github labels apply owner/repo --issue 123 --labels "enhancement"
```

**Features:**
- Support for multiple labels (comma-separated)
- Repository specification (owner/repo format)
- Integration with AI triage suggestions

#### `tgk github labels <action> [repo-name]`
Comprehensive label management.

```bash
# List labels
tgk github labels list alchmenyrun

# Create label
tgk github labels create alchmenyrun --color ff0000 --description "Critical issues"

# Remove label
tgk github labels remove alchmenyrun --issue 123 --labels "bug"
```

### AI Commands (`tgk ai`)

Centralized AI module for intelligent workflow analysis and suggestions.

#### `tgk ai labels <issue-id>`
AI-powered label suggestion for issues and PRs.

```bash
# Default repository
tgk ai labels 123

# Specific repository
tgk ai labels 123 --repo alchmenyrun

# External repository
tgk ai labels 123 --repo owner/repo
```

**Output:**
```
🏷️ AI Label Suggestion:
Labels: group/customer, topic/security, impact/high
Confidence: 92.5%
Reasoning: Customer-facing security issue detected. High impact - production system affected.
```

#### `tgk ai release-type`
AI-powered release type suggestion based on commit analysis.

```bash
# Default repository
tgk ai release-type

# Specific repository
tgk ai release-type --repo alchmenyrun
```

**Output:**
```
🚀 AI Release Type Suggestion:
Type: minor
Confidence: 85.0%
Reasoning: New features detected (3). Minor version bump recommended.
Analysis: 3 features, 5 fixes, 0 breaking changes
```

#### `tgk ai impact <changes...>`
AI-powered impact analysis for proposed changes.

```bash
tgk ai impact "database migration" "api endpoint changes" "security updates"
```

**Output:**
```
💥 AI Impact Analysis:
Impact: high
Confidence: 90.0%
Risk Score: 65/100
Affected Areas: Security, Data Layer, API Layer
Reasoning: High impact - affects major system components. Production deployment increases risk.
```

## Enhanced Features

### AI-Powered Analysis

All AI commands provide:
- **Confidence Scoring**: 0-100% confidence levels
- **Detailed Reasoning**: Human-readable explanations
- **Risk Assessment**: Impact and risk analysis
- **Multi-factor Analysis**: Content, context, and historical data

### Human-in-the-Loop Workflows

- **Automatic Application**: High-confidence (>80%) suggestions applied automatically
- **Council Review**: Low-confidence suggestions sent to Alchemists Council
- **Telegram Integration**: Real-time notifications and approvals
- **Audit Trail**: Complete logging of AI decisions and human overrides

### Repository Flexibility

- **Multi-repository Support**: Work with any GitHub repository
- **Owner/Repo Specification**: Support for external repositories
- **Default Repository**: Falls back to configured default repository
- **Permission Awareness**: Respects user permissions and access levels

## Integration Examples

### Complete Issue Triage Workflow

```bash
# 1. Create issue with AI assistance
tgk issue-new

# 2. AI suggests labels and applies them automatically
# 3. For low confidence, council reviews via Telegram
# 4. Apply AI suggestions manually if needed
tgk issue-triage 123

# 5. Monitor issue status
tgk issue-status 123 --detailed
```

### AI-Driven Release Planning

```bash
# 1. Get AI release type suggestion
tgk ai release-type

# 2. Plan release with AI suggestion
tgk release-plan --type ai-suggest

# 3. Council approves via Telegram
tgk release-approve release-123456

# 4. Deploy approved release
tgk release-deploy release-123456

# 5. Monitor post-release
tgk release-monitor release-123456
```

### Cross-Repository Label Management

```bash
# 1. Get AI label suggestions for external repo
tgk ai labels 456 --repo owner/repo

# 2. Apply suggested labels
tgk github labels apply owner/repo --issue 456 --labels "bug,high-priority"

# 3. Verify repository information
tgk github repo info owner/repo --detailed
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: GitHub API token for repository access
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for notifications
- `TELEGRAM_COUNCIL_ID`: Telegram council chat ID for approvals
- `TGK_USER`: Default username for approvals and attribution

### Default Repository

TGK defaults to `brendadeeznuts1111/alchmenyrun` but can work with any GitHub repository using the `--repo` option or `owner/repo` format.

## Error Handling

All commands include comprehensive error handling:
- Graceful degradation when tokens are unavailable
- Test mode simulation for development
- Clear error messages and usage instructions
- Automatic retry for transient failures

## Security Considerations

- **Token Security**: All tokens are handled securely and never logged
- **Permission Awareness**: Commands respect user permissions
- **Audit Logging**: All actions are logged for accountability
- **Human Oversight**: Critical actions require human approval

## Future Enhancements

Planned improvements include:
- **Advanced AI Models**: Integration with more sophisticated AI services
- **Custom Taxonomies**: Support for organization-specific label taxonomies
- **Workflow Templates**: Pre-defined workflow templates for common scenarios
- **Integration Expansion**: Support for additional platforms and services
