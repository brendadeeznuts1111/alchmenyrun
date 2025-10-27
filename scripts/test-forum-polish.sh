#!/usr/bin/env bash
# Quick test script for Forum Discovery & Polish-Audit
# Usage: ./scripts/test-forum-polish.sh [council_id]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Forum Polish Test Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if tgk is installed
if ! command -v tgk >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  tgk not found in PATH${NC}"
    echo "Installing tgk v4.4.0..."
    ./scripts/install-tgk.sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Verify version
VERSION=$(tgk --version)
echo -e "${GREEN}✅ $VERSION installed${NC}"
echo ""

# Check for bot token
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    echo -e "${RED}❌ TELEGRAM_BOT_TOKEN not set${NC}"
    echo ""
    echo "Please set your bot token:"
    echo "  export TELEGRAM_BOT_TOKEN='your_token_here'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Bot token configured${NC}"
echo ""

# Get council ID
COUNCIL_ID="${1:-}"
if [ -z "$COUNCIL_ID" ]; then
    echo -e "${YELLOW}🔍 Discovering council chat ID...${NC}"
    echo ""
    tgk chat-list | jq '.[] | select(.title | contains("Council") or .title | contains("council"))'
    echo ""
    echo -e "${YELLOW}Please run with council ID:${NC}"
    echo "  ./scripts/test-forum-polish.sh <council_id>"
    echo ""
    exit 1
fi

echo -e "${BLUE}📋 Council ID: $COUNCIL_ID${NC}"
echo ""

# Step 1: Audit
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Running Audit (Read-Only)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

tgk forum audit -c "$COUNCIL_ID" -o json > /tmp/forum-audit.json

TOTAL=$(jq -r '.total_topics' /tmp/forum-audit.json)
POLISHED=$(jq -r '.polished_topics' /tmp/forum-audit.json)
NEEDS_POLISH=$(jq -r '.needs_polish' /tmp/forum-audit.json)

echo -e "${GREEN}✅ Audit complete${NC}"
echo "   Total topics: $TOTAL"
echo "   Already polished: $POLISHED"
echo "   Needs polish: $NEEDS_POLISH"
echo ""

if [ "$NEEDS_POLISH" -eq 0 ]; then
    echo -e "${GREEN}🎉 All topics already polished!${NC}"
    echo ""
    echo "Nothing to do. Forum is already emoji-perfect!"
    exit 0
fi

# Step 2: Dry-run
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Dry-Run (Preview Changes)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

tgk forum polish --dry-run --audit /tmp/forum-audit.json

echo ""
echo -e "${YELLOW}⚠️  Review the changes above carefully!${NC}"
echo ""
read -p "Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo -e "${YELLOW}❌ Aborted by user${NC}"
    echo ""
    echo "To apply later, run:"
    echo "  tgk forum polish --apply --audit /tmp/forum-audit.json --reason 'manual-test'"
    exit 0
fi

# Step 3: Apply
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Applying Changes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REASON="test-$(date +%F-%H%M%S)"
tgk forum polish --apply --audit /tmp/forum-audit.json --reason "$REASON"

echo ""
echo -e "${GREEN}✅ Polish applied successfully!${NC}"
echo ""

# Step 4: Report
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Generating Report${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Do you want to post and pin the report card? (yes/no): " POST_REPORT

if [ "$POST_REPORT" = "yes" ]; then
    tgk forum report --audit /tmp/forum-audit.json --pin -c "$COUNCIL_ID"
    echo ""
    echo -e "${GREEN}✅ Report card posted and pinned!${NC}"
else
    tgk forum report --audit /tmp/forum-audit.json -o text
    echo ""
    echo -e "${YELLOW}ℹ️  Report generated (not posted)${NC}"
fi

# Step 5: Verify
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Running post-polish audit..."
tgk forum audit -c "$COUNCIL_ID" -o json > /tmp/forum-audit-after.json

TOTAL_AFTER=$(jq -r '.total_topics' /tmp/forum-audit-after.json)
POLISHED_AFTER=$(jq -r '.polished_topics' /tmp/forum-audit-after.json)
NEEDS_POLISH_AFTER=$(jq -r '.needs_polish' /tmp/forum-audit-after.json)

echo ""
echo -e "${GREEN}📊 Results:${NC}"
echo "   Before: $POLISHED/$TOTAL polished"
echo "   After:  $POLISHED_AFTER/$TOTAL_AFTER polished"
echo ""

if [ "$NEEDS_POLISH_AFTER" -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCCESS! All topics are now emoji-perfect!${NC}"
else
    echo -e "${YELLOW}⚠️  $NEEDS_POLISH_AFTER topics still need polish${NC}"
    echo "   (This may be expected for custom-named topics)"
fi

# Check audit ledger
echo ""
if [ -f .tgk/meta/forum-polish.jsonl ]; then
    LEDGER_ENTRIES=$(wc -l < .tgk/meta/forum-polish.jsonl | tr -d ' ')
    echo -e "${GREEN}✅ Audit ledger updated ($LEDGER_ENTRIES entries)${NC}"
    echo "   Location: .tgk/meta/forum-polish.jsonl"
    echo ""
    echo "Latest entry:"
    tail -1 .tgk/meta/forum-polish.jsonl | jq '.'
else
    echo -e "${YELLOW}⚠️  Audit ledger not found${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Forum Polish Test Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify topics in Telegram app (visual check)"
echo "  2. Test deep-links on mobile"
echo "  3. Commit audit ledger:"
echo "     git add .tgk/meta/forum-polish.jsonl"
echo "     git commit -m 'chore: forum polish test - $(date +%F)'"
echo "  4. Get team sign-offs (see SIGNOFF_READY.md)"
echo "  5. Create release tag:"
echo "     git tag -a v4.4.0-discovery -m 'Forum Polish DONE'"
echo "     git push origin v4.4.0-discovery"
echo ""
echo -e "${GREEN}The forum is now boring-beautiful! 🎨${NC}"
