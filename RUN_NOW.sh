#!/usr/bin/env bash
# Forum Polish - Ship & Retire
# One script to rule them all

set -euo pipefail

echo "🚀 Forum Polish v4.4.0 - Ship & Retire"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Install
echo "1️⃣ Installing tgk v4.4.0..."
./scripts/install-tgk.sh
export PATH="$HOME/.local/bin:$PATH"
tgk --version
echo ""

# 2. Set token
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not set"
    echo ""
    echo "Run:"
    echo "  export TELEGRAM_BOT_TOKEN='your_token_here'"
    echo "  ./RUN_NOW.sh"
    exit 1
fi

echo "2️⃣ Bot token configured ✅"
echo ""

# 3. Discover council ID
echo "3️⃣ Discovering council chat ID..."
COUNCIL_ID=$(tgk chat-list | jq -r '.[] | select(.title | contains("Council")) | .id' | head -1)

if [ -z "$COUNCIL_ID" ]; then
    echo "❌ Council chat not found"
    echo ""
    echo "Available chats:"
    tgk chat-list | jq -r '.[] | "\(.id) - \(.title)"'
    echo ""
    echo "Run with explicit ID:"
    echo "  COUNCIL_ID='-1003293940131' ./RUN_NOW.sh"
    exit 1
fi

echo "   Council ID: $COUNCIL_ID"
echo ""

# 4. Run test sequence
echo "4️⃣ Running forum polish sequence..."
echo ""

echo "   📋 Audit..."
tgk forum audit -c $COUNCIL_ID -o json > /tmp/audit.json
TOTAL=$(jq -r '.total_topics' /tmp/audit.json)
NEEDS_POLISH=$(jq -r '.needs_polish' /tmp/audit.json)
echo "   ✅ Found $TOTAL topics, $NEEDS_POLISH need polish"
echo ""

if [ "$NEEDS_POLISH" -eq 0 ]; then
    echo "🎉 All topics already polished!"
    echo ""
    echo "Forum is emoji-perfect. Nothing to do!"
    exit 0
fi

echo "   🔍 Dry-run..."
tgk forum polish --dry-run --audit /tmp/audit.json
echo ""

read -p "Apply polish? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Aborted"
    exit 0
fi

echo ""
echo "   🎨 Applying polish..."
tgk forum polish --apply --audit /tmp/audit.json --reason "ship-$(date +%F)"
echo ""

echo "   📊 Generating report..."
tgk forum report --audit /tmp/audit.json --pin -c $COUNCIL_ID
echo ""

# 5. Verify
echo "5️⃣ Verification..."
tgk forum audit -c $COUNCIL_ID -o json > /tmp/audit-after.json
POLISHED_AFTER=$(jq -r '.polished_topics' /tmp/audit-after.json)
echo "   ✅ Polished: $POLISHED_AFTER/$TOTAL topics"
echo ""

# 6. Done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SHIPPED & RETIRED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Verify in Telegram app (visual check)"
echo "  2. Commit audit ledger:"
echo "     git add .tgk/meta/forum-polish.jsonl"
echo "     git commit -m 'chore: forum polish ship - $(date +%F)'"
echo "  3. Create release tag:"
echo "     git tag -a v4.4.0-discovery -m 'Forum Polish DONE'"
echo "     git push origin v4.4.0-discovery"
echo ""
echo "The forum is now boring-beautiful! 🎨"
