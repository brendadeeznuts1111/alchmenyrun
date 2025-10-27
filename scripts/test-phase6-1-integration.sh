#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Phase 6.1 Integration Test - Kinja Temporal Intelligence"
echo "=========================================================="

# Test 1: Validate Queue Creation
echo "📋 Test 1: Queue Creation"
if npx wrangler queues list | grep -q "tgk-pr-reply-queue"; then
    echo "✅ Queue tgk-pr-reply-queue exists"
else
    echo "❌ Queue missing"
    exit 1
fi

# Test 2: Validate Analytics Dataset
echo "📊 Test 2: Analytics Dataset"
if npx wrangler analytics-engine datasets | grep -q "tgk_pr_dataset"; then
    echo "✅ Analytics dataset tgk_pr_dataset exists"
else
    echo "❌ Analytics dataset missing"
    exit 1
fi

# Test 3: Validate OPA Bundle
echo "🔒 Test 3: OPA Bundle"
if npx wrangler r2 object list tgk-opa-bundles | grep -q "phase61/pr.tar.gz"; then
    echo "✅ OPA bundle uploaded"
else
    echo "❌ OPA bundle missing"
    exit 1
fi

# Test 4: Validate Feature Flags
echo "🚩 Test 4: Feature Flags"
if grep -q 'EMAIL_PR_TELEGRAM = "1"' phase-6-deployment.yml; then
    echo "✅ Feature flags configured"
else
    echo "❌ Feature flags not set"
    exit 1
fi

# Test 5: Worker Deployment
echo "🚀 Test 5: Worker Deployment"
WORKER_URL="https://tgk-email-orchestrator.utahj4754.workers.dev"
if curl -s "$WORKER_URL" | grep -q "tgk-email-orchestrator"; then
    echo "✅ Worker deployed and accessible"
else
    echo "❌ Worker not accessible"
    exit 1
fi

# Test 6: Canary Smoke Test
echo "🧪 Test 6: Canary Smoke Test"
RESP=$(curl -sX POST "$WORKER_URL/kinja/analyze" \
  -H "Content-Type: application/json" \
  -d '{"subject":"PR #999 merge gate","body":"CI green, 2 approvals"}' || echo "")

if echo "$RESP" | grep -q '"priority":"p0"'; then
    echo "✅ Canary healthy - Kinja analysis working"
    echo "📊 Response: $RESP"
else
    echo "❌ Canary failed - Response: $RESP"
    exit 1
fi

# Test 7: Message Tracking Database
echo "📋 Test 7: Message Tracking"
if npx wrangler d1 execute tgk_email_metadata --command "SELECT COUNT(*) FROM message_tracking" >/dev/null 2>&1; then
    echo "✅ Message tracking database accessible"
else
    echo "❌ Message tracking database not accessible"
    exit 1
fi

echo ""
echo "🎉 Phase 6.1 Integration Test - ALL TESTS PASSED!"
echo ""
echo "📝 Summary:"
echo "✅ Cloudflare Queue for async replies"
echo "✅ Analytics Engine for time-to-answer metrics"
echo "✅ OPA bundle for merge gate enforcement"
echo "✅ Feature flags for safe rollout"
echo "✅ Worker deployed with Phase 6.1 enhancements"
echo "✅ Canary validation passed"
echo "✅ Message tracking database ready"
echo ""
echo "🚀 Phase 6.1 + Kinja Temporal Intelligence is PRODUCTION READY!"
echo ""
echo "📊 Analytics Dashboard: https://dash.cloudflare.com/analytics-engine"
echo "⏮️  Rollback: wrangler secret put EMAIL_PR_TELEGRAM 0 && wrangler deploy"
