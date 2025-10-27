# Forum Polish Quick Reference Card

**tgk v4.4.0** | One command to rule them all

## 🚀 One-Line Install

```bash
curl -Ls https://alch.run/tgk4-4 | bash
```

## ⚡ Quick Commands

```bash
# Set token (required once)
export TELEGRAM_BOT_TOKEN='your_token_here'

# Discover & audit all topics
tgk forum audit -c -1003293940131 -o json > audit.json

# Preview changes (safe)
tgk forum polish --dry-run --audit audit.json

# Apply polish (renames + re-pins)
tgk forum polish --apply --audit audit.json --reason "quarterly"

# Post report card
tgk forum report --audit audit.json --pin -c -1003293940131

# AI suggestion
tgk ai suggest polish "Security Discussion"
```

## 📋 Emoji Convention

| Type | Emoji | Short | Example |
|------|-------|-------|---------|
| Security | 🛡️ | sec | 🛡️ sec-auth |
| SRE | ⚙️ | sre | ⚙️ sre-k8s |
| Data | 📊 | data | 📊 data-etl |
| Product | ✨ | prod | ✨ prod-ui |
| Performance | 🚀 | perf | 🚀 perf-opt |
| Compliance | 📜 | comp | 📜 comp-gdpr |

## 🤖 GitHub Actions

```yaml
# Quarterly automation (1st day of quarter)
gh workflow run forum-polish.yml -f reason="Q4-2025"
```

## 📊 Metrics

```promql
tgk_forum_topics_total{state="polished"}
tgk_forum_polish_applied_total{reason="quarterly"}
```

## 🔗 Links

- 📖 Full Docs: [FORUM_POLISH.md](FORUM_POLISH.md)
- 🐛 Issues: https://github.com/alchemist/alchmenyrun/issues
- 💬 Support: @alchemist-support

## ⚠️ Troubleshooting

```bash
# Check version
tgk --version  # Should be 4.4.0

# Verify bot permissions
tgk chat-list | jq '.[] | select(.title | contains("Council"))'

# Test in dry-run first
tgk forum polish --dry-run --audit audit.json
```

---

**Run one command in council chat:**
```
/forum polish --apply
```
**Every topic becomes emoji-beautiful! 🎨**
