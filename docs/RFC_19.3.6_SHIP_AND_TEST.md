# 19.3.6 SHIP & TEST – Forum Discovery & Polish-Audit

**Repository:** https://github.com/brendadeeznuts1111/alchmenyrun  
**Version:** tgk v4.4.0  
**Date:** 2025-10-27  
**Status:** 🚀 READY TO SHIP

---

## 1. One-Time Set-Up (Local Laptop or CI)

### Clone & Install

```bash
# 1. Clone your repo
git clone https://github.com/brendadeeznuts1111/alchmenyrun.git
cd alchmenyrun

# 2. Install tgk v4.4.0 locally (no external URL needed)
./scripts/install-tgk.sh   # executable already committed

# 3. Verify installation
tgk --version  # Should output: tgk v4.4.0

# 4. Export your real bot token
export TELEGRAM_BOT_TOKEN='8372625251:AAFfIFdjLCwXxOO392KrFqsbTksE0t0w5nU'

# 5. Discover actual council chat ID (save for later)
tgk chat-list | jq '.[] | select(.title | contains("Council"))'
# → copy the ID (example: -1003293940131)
```

**Note:** The bot token above is visible in your request. Consider rotating it after testing if it's production.

---

## 2. Safe Test Sequence (Read-Only First)

### Step 1: Audit (Zero Risk)

```bash
# Set your council ID
COUNCIL_ID="-1003293940131"  # Replace with actual ID from step 5 above

# Run audit - discovers all topics
tgk forum audit -c $COUNCIL_ID -o json > /tmp/audit.json

# Verify results
cat /tmp/audit.json | jq '.'
cat /tmp/audit.json | jq '.total_topics'  # Real count
cat /tmp/audit.json | jq '.needs_polish'  # Topics to rename
```

**Expected Output:**
```json
{
  "timestamp": "2025-10-27T00:00:00Z",
  "council_id": "-1003293940131",
  "total_topics": 23,
  "polished_topics": 11,
  "custom_topics": 12,
  "needs_polish": 12,
  "polish_candidates": [...]
}
```

### Step 2: Dry-Run (Preview Only)

```bash
# Preview changes - NO actual modifications
tgk forum polish --dry-run --audit /tmp/audit.json
```

**Expected Output:**
```
🎨 FORUM POLISH OPERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DRY-RUN MODE - No changes will be made

📋 Planned Changes:
• Security Discussion → 🛡️ sec-security-discussion (topic_id: 101)
• SRE Meeting → ⚙️ sre-meeting (topic_id: 102)
• Data Privacy Talk → 📊 data-privacy-talk (topic_id: 103)
...

📊 Impact Summary:
• Topics to rename: 12
• Topics to re-pin: 12
• Search tags to add: 12

✅ Dry-run complete - use --apply to execute
```

**Review the output carefully!** Make sure the renames look correct.

### Step 3: Apply (If Preview Looks Good)

```bash
# Execute renames and re-pins
tgk forum polish --apply --audit /tmp/audit.json --reason "initial-polish-$(date +%F)"
```

**Expected Output:**
```
🎨 FORUM POLISH OPERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 APPLY MODE - Executing polish changes

📋 Renaming topics to emoji convention...
🎯 Security Discussion → 🛡️ sec-security-discussion
🎯 SRE Meeting → ⚙️ sre-meeting
🎯 Data Privacy Talk → 📊 data-privacy-talk
...

📌 Re-pinning topic 101 with perfect pin...
📌 Re-pinning topic 102 with perfect pin...
...

✅ Forum polish applied successfully
📈 Renamed: 12 topics
📌 Re-pinned: 12 topics
📝 Reason: initial-polish-2025-10-27

📋 Ledger updated: .tgk/meta/forum-polish.jsonl
```

**Verification:**
```bash
# Check audit ledger
cat .tgk/meta/forum-polish.jsonl | jq '.'

# Re-run audit to verify
tgk forum audit -c $COUNCIL_ID -o json > /tmp/audit-after.json
cat /tmp/audit-after.json | jq '.polished_topics'  # Should be higher now
```

---

## 3. Generate & Pin Summary Card

```bash
# Post report card to council
tgk forum report --audit /tmp/audit.json --pin -c $COUNCIL_ID
```

**Expected Output:**
```
📋 FORUM POLISH REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Forum Polish Report – 2025-10-27
━━━━━━━━━━━━━━━━━━━━
✅ Polished: 23 topics
🔄 Renamed:  12 topics
📌 Re-pinned: 23 topics
🌍 Languages: en, fr, de
⚠️  Manual:   2 topics (custom names kept)

🔗 Deep-link: https://t.me/c/1003293940131/1
📊 Raw JSON:  https://grafana.alch.run/d/forum-polish

🎯 INTERACTIVE ACTIONS:
• View List → opens Grafana dashboard
• Re-run Dry-Run → callback /forum polish --dry-run

📌 Report card pinned to council chat (message_id: 12345)
✅ Forum report generated
```

**A card like this appears (and is pinned) in the council chat:**
```
📋 Forum Polish Report – 2025-10-27
━━━━━━━━━━━━━━━━━━━━
✅ Polished: 23 topics
🔄 Renamed:  12 topics
📌 Re-pinned: 23 topics
🌍 Languages: en, fr, de
⚠️  Manual:   2 topics (custom names kept)

🔗 Deep-link: https://t.me/c/123/456
📊 Raw JSON:  https://grafana.alch.run/d/forum-polish
```

---

## 4. Optional – Set Up Public Short URL

**Only if you control `alch.run` domain:**

### Option A: DNS Redirect (Recommended)
```bash
# Add DNS redirect:
# alch.run/tgk4-4 → raw.githubusercontent.com/brendadeeznuts1111/alchmenyrun/main/scripts/install-tgk.sh
```

### Option B: GitHub Pages
```bash
# Create redirect page
mkdir -p docs/install
cat > docs/install/tgk4-4.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=https://raw.githubusercontent.com/brendadeeznuts1111/alchmenyrun/main/scripts/install-tgk.sh">
</head>
<body>Redirecting to tgk installer...</body>
</html>
EOF

# Enable GitHub Pages in repo settings
# URL: https://brendadeeznuts1111.github.io/alchmenyrun/install/tgk4-4.html
```

### Option C: Use Raw GitHub URL Directly
```bash
# Until short URL exists, use:
curl -Ls https://raw.githubusercontent.com/brendadeeznuts1111/alchmenyrun/main/scripts/install-tgk.sh | bash
```

**For now, use the local install script (step 1).**

---

## 5. Tag & Release (After Human 👍)

### Create Release Tag

```bash
# After successful test, create tag
git tag -a v4.4.0-discovery -m "Forum Discovery & Polish-Audit DONE"
git push origin v4.4.0-discovery

# Create GitHub release
gh release create v4.4.0-discovery \
  --title "tgk v4.4.0 - Forum Discovery & Polish-Audit" \
  --notes "See docs/RFC_19.3.5_FORUM_POLISH_SIGNOFF.md for details"
```

### CI Auto-Actions

When the tag is pushed, GitHub Actions will automatically:
1. Post announcement to #general
2. Lock repo to maintenance mode
3. Update golden template
4. Archive RFC documents

---

## 6. Done Criteria (Check Here)

### Visual Verification Checklist

- [ ] **Exact topic count** matches Telegram UI screenshot
  - API count: `tgk forum audit -c <id> -o json | jq '.total_topics'`
  - UI count: Open Telegram, count topics manually
  - Screenshot: Attach to CI artifact

- [ ] **All emoji names** visible in forum list (visual proof)
  - Open Telegram app
  - Navigate to council forum
  - Verify all topics show emoji prefix (🛡️, ⚙️, 📊, etc.)
  - Screenshot: Attach proof

- [ ] **Deep-link** button works on mobile
  - Open report card on mobile
  - Tap deep-link button
  - Verify it navigates to correct topic
  - Screenshot: Attach proof

- [ ] **Quarterly cron** scheduled
  - File: `.github/workflows/forum-polish.yml` ✅ (already present)
  - Cron: `0 0 1 */3 *` ✅ (1st day of quarter)
  - Next run: 2026-01-01 00:00 UTC

### Automated Verification

```bash
# Run verification script
cat > /tmp/verify-polish.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

COUNCIL_ID="${1:--1003293940131}"

echo "🔍 Verifying Forum Polish Implementation..."
echo ""

# 1. Check tgk version
echo "1️⃣ Checking tgk version..."
VERSION=$(tgk --version)
if [[ "$VERSION" == "tgk v4.4.0" ]]; then
  echo "   ✅ Version correct: $VERSION"
else
  echo "   ❌ Version incorrect: $VERSION (expected: tgk v4.4.0)"
  exit 1
fi

# 2. Run audit
echo ""
echo "2️⃣ Running forum audit..."
tgk forum audit -c "$COUNCIL_ID" -o json > /tmp/verify-audit.json
TOTAL=$(jq -r '.total_topics' /tmp/verify-audit.json)
POLISHED=$(jq -r '.polished_topics' /tmp/verify-audit.json)
echo "   ✅ Total topics: $TOTAL"
echo "   ✅ Polished topics: $POLISHED"

# 3. Check audit ledger
echo ""
echo "3️⃣ Checking audit ledger..."
if [ -f .tgk/meta/forum-polish.jsonl ]; then
  ENTRIES=$(wc -l < .tgk/meta/forum-polish.jsonl | tr -d ' ')
  echo "   ✅ Ledger exists with $ENTRIES entries"
else
  echo "   ⚠️  Ledger not found (run polish first)"
fi

# 4. Check GitHub Actions workflow
echo ""
echo "4️⃣ Checking GitHub Actions workflow..."
if [ -f .github/workflows/forum-polish.yml ]; then
  echo "   ✅ Quarterly workflow exists"
else
  echo "   ❌ Workflow missing"
  exit 1
fi

echo ""
echo "✅ All verifications passed!"
EOF

chmod +x /tmp/verify-polish.sh
/tmp/verify-polish.sh -1003293940131
```

---

## 7. Troubleshooting

### Issue: "Failed to fetch forum topics"

**Cause:** Bot doesn't have access or wrong chat ID

**Solution:**
```bash
# Verify bot is admin
tgk chat-list | jq '.[] | select(.title | contains("Council"))'

# Check bot permissions in Telegram:
# Settings → Administrators → Your Bot → Enable "Manage Topics"
```

### Issue: "Failed to rename topic"

**Cause:** Bot lacks permission or topic is locked

**Solution:**
```bash
# 1. Verify bot has "Manage Topics" permission
# 2. Try dry-run first to see which topics will fail
tgk forum polish --dry-run --audit /tmp/audit.json

# 3. Retry (idempotent - safe to re-run)
tgk forum polish --apply --audit /tmp/audit.json --reason "retry-$(date +%F)"
```

### Issue: "Command not found: tgk"

**Cause:** Not in PATH

**Solution:**
```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Or run directly
~/.local/bin/tgk --version

# Or reinstall
./scripts/install-tgk.sh
```

---

## 8. Next Steps After Successful Test

1. **Commit audit ledger:**
   ```bash
   git add .tgk/meta/forum-polish.jsonl
   git commit -m "chore: initial forum polish - $(date +%F)"
   git push origin main
   ```

2. **Get sign-offs** (see `docs/RFC_19.3.5_FORUM_POLISH_SIGNOFF.md`)

3. **Create release tag** (step 5 above)

4. **Monitor quarterly runs:**
   - Next run: 2026-01-01 00:00 UTC
   - Check logs: https://github.com/brendadeeznuts1111/alchmenyrun/actions

5. **Set up metrics** (optional):
   ```bash
   # Push metrics to Prometheus
   ./scripts/tgk-metrics.sh collect-and-push /tmp/audit.json
   ```

---

## 9. Quick Command Reference

```bash
# Install
./scripts/install-tgk.sh

# Audit
tgk forum audit -c <council_id> -o json > /tmp/audit.json

# Dry-run
tgk forum polish --dry-run --audit /tmp/audit.json

# Apply
tgk forum polish --apply --audit /tmp/audit.json --reason "initial-polish"

# Report
tgk forum report --audit /tmp/audit.json --pin -c <council_id>

# AI suggestion
tgk ai suggest polish "Security Discussion"

# Verify
tgk --version
tgk forum audit -c <council_id> -o json | jq '.polished_topics'
```

---

## 10. Success Criteria

✅ **Ready to ship when:**
- All 6 done criteria checked
- Visual proof (screenshots) attached
- Audit ledger committed to git
- Team sign-offs obtained
- Tag `v4.4.0-discovery` pushed

🎉 **Result:**
Every topic becomes **emoji-perfect, deep-linkable, bot-maintained** — **zero manual edits ever again**.

---

**Run steps 1-3 now** → Ship & Test!

---

**Status:** 🚀 READY TO SHIP  
**Repository:** https://github.com/brendadeeznuts1111/alchmenyrun  
**Version:** tgk v4.4.0-discovery  
**Date:** 2025-10-27
