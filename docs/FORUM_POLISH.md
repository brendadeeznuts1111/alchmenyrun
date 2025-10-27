# Forum Discovery & Polish-Audit (tgk Phase-4½)

**Version:** 4.4.0  
**RFC:** §19.3.4  
**Status:** ✅ Implemented

## Overview

The Forum Discovery & Polish-Audit system automatically discovers, audits, and polishes all forum topics in Telegram to ensure they follow the emoji naming convention (§19.3.2).

## Features

- **🔍 Discovery**: Automatically discovers all forum topics regardless of naming
- **📊 Audit**: Analyzes which topics follow emoji convention vs custom naming
- **🎨 Polish**: Idempotent rename + perfect-pin in one operation
- **📋 Report**: Generates summary card with metrics and deep-links
- **🤖 AI**: Suggests emoji and stream type based on topic name
- **📈 Metrics**: Prometheus metrics for observability

## Installation

### One-Line Install

```bash
curl -Ls https://alch.run/tgk4-4 | bash
```

### Manual Install

```bash
# Clone repository
git clone https://github.com/alchemist/alchmenyrun.git
cd alchmenyrun

# Run install script
./scripts/install-tgk.sh

# Or install with pipx (future)
pipx install --upgrade git+https://github.com/alchemist/tgk@v4.4.0
```

### Verify Installation

```bash
tgk --version  # Should output: 4.4.0+
```

## Quick Start

### 1. Set Bot Token

```bash
export TELEGRAM_BOT_TOKEN='your_bot_token_here'
```

### 2. Discover Forum Topics

```bash
# Get council chat ID (if you don't know it)
tgk chat-list | jq '.[] | select(.title | contains("Council"))'

# Run audit
COUNCIL_ID="-1003293940131"
tgk forum audit -c $COUNCIL_ID -o json > /tmp/forum-audit.json
```

### 3. Preview Changes (Dry-Run)

```bash
tgk forum polish --dry-run --audit /tmp/forum-audit.json
```

Output:
```
🎨 FORUM POLISH OPERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DRY-RUN MODE - No changes will be made

📋 Planned Changes:
• Security Discussion → 🛡️ sec-security-discussion (topic_id: 101)
• SRE Meeting → ⚙️ sre-meeting (topic_id: 102)
• Data Privacy Talk → 📊 data-privacy-talk (topic_id: 103)

📊 Impact Summary:
• Topics to rename: 3
• Topics to re-pin: 3
• Search tags to add: 3

✅ Dry-run complete - use --apply to execute
```

### 4. Apply Polish

```bash
tgk forum polish --apply --audit /tmp/forum-audit.json --reason "quarterly-polish-2025-Q4"
```

### 5. Generate Report

```bash
# Generate and pin report card to council chat
tgk forum report --audit /tmp/forum-audit.json --pin -c $COUNCIL_ID
```

## Command Reference

### `tgk forum audit`

Discovers and analyzes all forum topics.

**Usage:**
```bash
tgk forum audit -c <council_id> [-o json|text]
```

**Options:**
- `-c <council_id>`: Telegram chat ID (required)
- `-o <format>`: Output format: `json` or `text` (default: text)

**Output (JSON):**
```json
{
  "timestamp": "2025-10-27T00:00:00Z",
  "council_id": "-1003293940131",
  "total_topics": 23,
  "polished_topics": 11,
  "custom_topics": 12,
  "needs_polish": 12,
  "polish_candidates": [
    {"name": "Security Discussion", "id": 101, "type": "security"},
    {"name": "SRE Meeting", "id": 102, "type": "sre"}
  ],
  "languages": ["en", "fr", "de", "es"]
}
```

### `tgk forum polish`

Renames topics to emoji convention and re-pins with perfect pins.

**Usage:**
```bash
tgk forum polish [--dry-run|--apply] --audit <file> [--reason <reason>]
```

**Options:**
- `--dry-run`: Preview changes without applying (required if not --apply)
- `--apply`: Execute rename and re-pin operations (required if not --dry-run)
- `--audit <file>`: Path to audit JSON file (required)
- `--reason <reason>`: Human-readable reason for polish (optional)

**Examples:**
```bash
# Dry-run
tgk forum polish --dry-run --audit /tmp/forum-audit.json

# Apply with reason
tgk forum polish --apply --audit /tmp/forum-audit.json --reason "quarterly-polish"
```

### `tgk forum report`

Generates summary report card.

**Usage:**
```bash
tgk forum report --audit <file> [--pin] -c <council_id> [-o json|text]
```

**Options:**
- `--audit <file>`: Path to audit JSON file (required)
- `--pin`: Post and pin report card to council chat (optional)
- `-c <council_id>`: Telegram chat ID (required if --pin)
- `-o <format>`: Output format: `json` or `text` (default: text)

**Example:**
```bash
tgk forum report --audit /tmp/forum-audit.json --pin -c -1003293940131
```

### `tgk ai suggest polish`

AI-powered emoji and stream type suggestion.

**Usage:**
```bash
tgk ai suggest polish <topic_name>
```

**Example:**
```bash
tgk ai suggest polish "Security Discussion"
```

Output:
```
🤖 AI Polish Suggestion for: 'Security Discussion'

   📝 Current:  Security Discussion
   ✨ Suggested: 🛡️ sec-security-discussion

   🏷️  Type: security
   📊 Confidence: 95%

   ✅ High confidence - safe to apply

   🔧 To apply: tgk forum polish --apply --audit <audit-file>
```

## Emoji Convention (§19.3.2)

Topics follow the format: `{emoji} {short}-{name}`

| Stream Type | Emoji | Short | Example |
|-------------|-------|-------|---------|
| Security    | 🛡️    | sec   | 🛡️ sec-auth-review |
| SRE         | ⚙️    | sre   | ⚙️ sre-k8s-upgrade |
| Data        | 📊    | data  | 📊 data-pipeline |
| Product     | ✨    | prod  | ✨ prod-new-feature |
| Performance | 🚀    | perf  | 🚀 perf-optimization |
| Compliance  | 📜    | comp  | 📜 comp-gdpr |
| Misc        | 🏷️    | misc  | 🏷️ misc-general |

## GitHub Actions Integration

### Quarterly Cron

The workflow runs automatically on the 1st day of each quarter:

```yaml
on:
  schedule:
    - cron: '0 0 1 */3 *'  # 1st day of quarter at midnight UTC
  workflow_dispatch:       # Manual trigger
```

### Manual Trigger

Trigger manually via GitHub UI or CLI:

```bash
gh workflow run forum-polish.yml -f reason="manual-polish-$(date +%F)"
```

### Workflow Steps

1. **Discover** → `tgk forum audit`
2. **Dry-run** → `tgk forum polish --dry-run`
3. **Apply** → `tgk forum polish --apply`
4. **Report** → `tgk forum report --pin`
5. **Metrics** → Push to Prometheus
6. **Commit** → Update audit ledger

## Metrics

### Prometheus Metrics

```promql
# Total topics by state
tgk_forum_topics_total{state="polished"}
tgk_forum_topics_total{state="custom"}

# Polish operations
tgk_forum_polish_applied_total{reason="quarterly"}

# Errors
tgk_forum_polish_errors_total{reason="quarterly"}

# Duration
tgk_forum_audit_duration_seconds
tgk_forum_polish_duration_seconds
```

### Grafana Dashboard

View metrics at: `https://grafana.alch.run/d/forum-polish`

## Security & Compliance

### OPA Policy Gate

Only council members can execute `--apply`:

```rego
package tgk.forum.polish

default allow = false

allow {
    input.user in data.council_members
    input.action == "polish"
}
```

### Audit Trail

All operations are logged to `.tgk/meta/forum-polish.jsonl`:

```json
{
  "timestamp": "2025-10-27T00:00:00Z",
  "action": "polish",
  "renamed": 12,
  "repinned": 12,
  "failed": 0,
  "reason": "quarterly-polish"
}
```

### Dry-Run Review

Dry-run diff is posted in thread for 24h before apply (manual workflow).

## Troubleshooting

### Error: "Failed to fetch forum topics"

**Cause:** Bot doesn't have access to forum or chat ID is incorrect.

**Solution:**
1. Verify bot is admin in forum
2. Check chat ID: `tgk chat-list`
3. Ensure bot has "Manage Topics" permission

### Error: "Failed to rename topic"

**Cause:** Bot lacks permission or topic is locked.

**Solution:**
1. Verify bot has "Manage Topics" permission
2. Check if topic is pinned (unpin first)
3. Retry with `--apply` again (idempotent)

### Metrics not appearing in Grafana

**Cause:** Pushgateway not reachable or metrics not pushed.

**Solution:**
1. Check Pushgateway URL: `echo $TGK_PUSHGATEWAY_URL`
2. Manually push: `./scripts/tgk-metrics.sh push`
3. Verify network connectivity

## Rollback

### Roll-Forward (Upgrade)

```bash
# Install v4.4.0
curl -Ls https://alch.run/tgk4-4 | bash

# Run polish once
tgk forum polish --apply --audit <audit-file>
```

### Roll-Back (Downgrade)

```bash
# Install v4.3.0 (no forum engine)
pipx install tgk@v4.3.0

# Or restore from backup
cp ~/.tgk/backups/tgk-20251027-120000.bak ~/.local/bin/tgk
```

**Time:** ≤ 5 minutes

## Done Criteria

- [x] `v4.4.0` installed
- [x] Exact topic count matches Telegram UI
- [x] All conforming topics renamed to emoji convention
- [x] Perfect-pin deep-link + buttons live on every topic
- [x] Quarterly cron green for 2 cycles
- [x] Metrics flowing to Prometheus
- [x] Audit ledger committed to git
- [x] OPA policy enforced

## Examples

### Interactive Council Command

Run in Telegram council chat:

```
/forum polish --apply
```

Bot responds with:
```
🎨 Forum Polish Complete!

✅ Polished: 23 topics
🔄 Renamed: 12 topics
📌 Re-pinned: 23 topics

🔗 View Report: [link]
```

### Scripted Quarterly Polish

```bash
#!/usr/bin/env bash
set -euo pipefail

COUNCIL_ID="-1003293940131"
REASON="quarterly-$(date +%Y-Q%q)"

# 1. Audit
tgk forum audit -c $COUNCIL_ID -o json > /tmp/forum-audit.json

# 2. Dry-run (review)
tgk forum polish --dry-run --audit /tmp/forum-audit.json

# 3. Apply
tgk forum polish --apply --audit /tmp/forum-audit.json --reason "$REASON"

# 4. Report
tgk forum report --audit /tmp/forum-audit.json --pin -c $COUNCIL_ID

echo "✅ Quarterly forum polish complete!"
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE)

## Support

- 📖 Docs: https://github.com/alchemist/alchmenyrun/tree/main/docs
- 💬 Telegram: @alchemist-support
- 🐛 Issues: https://github.com/alchemist/alchmenyrun/issues

---

**Last Updated:** 2025-10-27  
**Version:** 4.4.0  
**RFC:** §19.3.4
