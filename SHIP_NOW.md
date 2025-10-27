# 🚀 SHIP NOW - Forum Polish v4.4.0

**Ready to ship!** Everything is implemented and tested. Follow these steps to go live.

---

## Quick Start (3 Commands)

```bash
# 1. Install
./scripts/install-tgk.sh

# 2. Set token
export TELEGRAM_BOT_TOKEN='8372625251:AAFfIFdjLCwXxOO392KrFqsbTksE0t0w5nU'

# 3. Run interactive test
./scripts/test-forum-polish.sh -1003293940131
```

**That's it!** The script will guide you through audit → dry-run → apply → report.

---

## Manual Steps (If You Prefer)

```bash
# Install
./scripts/install-tgk.sh
tgk --version  # Should output: tgk v4.4.0

# Set token
export TELEGRAM_BOT_TOKEN='your_token_here'

# Get council ID (if you don't know it)
tgk chat-list | jq '.[] | select(.title | contains("Council"))'

# Audit (read-only, safe)
COUNCIL_ID="-1003293940131"
tgk forum audit -c $COUNCIL_ID -o json > /tmp/audit.json

# Dry-run (preview only)
tgk forum polish --dry-run --audit /tmp/audit.json

# Apply (if preview looks good)
tgk forum polish --apply --audit /tmp/audit.json --reason "initial-polish-$(date +%F)"

# Report (post & pin)
tgk forum report --audit /tmp/audit.json --pin -c $COUNCIL_ID
```

---

## What Happens

### Before
```
- Security Discussion
- SRE Meeting
- Data Privacy Talk
```

### After
```
- 🛡️ sec-security-discussion
- ⚙️ sre-meeting
- 📊 data-privacy-talk
```

**Plus:**
- Perfect-pin with deep-link on every topic
- Quarterly automation (runs automatically)
- Metrics flowing to Prometheus
- Audit trail in `.tgk/meta/forum-polish.jsonl`

---

## Verification Checklist

After running the test script:

- [ ] Open Telegram app
- [ ] Navigate to council forum
- [ ] Verify all topics show emoji prefix
- [ ] Tap a deep-link button (should work)
- [ ] Check audit ledger: `cat .tgk/meta/forum-polish.jsonl`
- [ ] Screenshot proof (attach to sign-off RFC)

---

## Commit & Tag

```bash
# Commit audit ledger
git add .tgk/meta/forum-polish.jsonl
git commit -m "chore: initial forum polish - $(date +%F)"
git push origin main

# Create release tag (after sign-offs)
git tag -a v4.4.0-discovery -m "Forum Discovery & Polish-Audit DONE"
git push origin v4.4.0-discovery
```

---

## Documentation

- **Full Guide:** `docs/FORUM_POLISH.md`
- **Quick Ref:** `docs/FORUM_POLISH_QUICKREF.md`
- **Ship & Test:** `docs/RFC_19.3.6_SHIP_AND_TEST.md`
- **Sign-Off:** `docs/RFC_19.3.5_FORUM_POLISH_SIGNOFF.md`

---

## Support

- 🐛 Issues: https://github.com/brendadeeznuts1111/alchmenyrun/issues
- 📖 Docs: https://github.com/brendadeeznuts1111/alchmenyrun/tree/main/docs

---

## ⚠️ Security Note

The bot token in this file is visible. Consider rotating it after testing if it's production.

---

**Run `./scripts/test-forum-polish.sh <council_id>` now!**

The forum will be **emoji-perfect, deep-linkable, bot-maintained** — **zero manual edits ever again**. 🎨
