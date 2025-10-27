#!/bin/bash

# Test Email PR Telegram Integration
# This script tests the end-to-end flow

set -e

echo "🧪 Testing Email PR Telegram Integration..."

# Test 1: Apply D1 migration (should be idempotent)
echo "📊 Testing D1 migration..."
npx wrangler d1 execute tgk_email_metadata --file=.github/rfc006/migrations/003-email-tg-pr.sql --local

# Test 2: Insert test mapping
echo "📝 Inserting test email-telegram mapping..."
npx wrangler d1 execute tgk_email_metadata --local --command "
INSERT OR REPLACE INTO email_tg_map (state_id, chat_id, email_from) 
VALUES ('pr51', '@general', 'test@example.com');
"

# Test 3: Verify mapping
echo "✅ Verifying test mapping..."
npx wrangler d1 execute tgk_email_metadata --local --command "
SELECT * FROM email_tg_map WHERE state_id = 'pr51';
"

echo ""
echo "📧 Test email address ready:"
echo "   To: infra.sre.review.p0.gh.pr51@cloudflare.com"
echo "   From: test@example.com"
echo "   Subject: DB latency spike – please approve hot-fix"
echo "   Body: p99 is 800 ms, we need to merge PR #51 ASAP"
echo ""
echo "📱 Expected behavior:"
echo "   1. Email parsed → PR #51 extracted"
echo "   2. Database lookup finds chat_id @general"
echo "   3. Rich PR card sent to Telegram"
echo "   4. Interactive buttons (Approve, Request Changes, Comment, Merge)"
echo "   5. Button clicks trigger GitHub actions via callbacks"
echo ""
echo "🔀 To test callbacks:"
echo "   curl -X POST https://tgk-email-orchestrator.alchemy.run/callback \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"action\":\"pr:approve\",\"prId\":\"51\",\"message\":\"Looks good!\"}'"
echo ""
echo "🎯 Local testing complete. Deploy with: ./scripts/deploy-email-pr-telegram.sh"
