#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Phase 6.1 Launch Sequence - 10 Minute Checklist"
echo "===================================================="

# 1. Sanity-check on feature branch
echo "📋 Step 1: Creating feature branch"
git checkout main && git pull --ff-only
git checkout -b feat/phase-6-1-kinja || echo "Branch may already exist"

# 2. Check credentials
echo "🔐 Step 2: Checking Cloudflare credentials"
if [[ -f ~/.cloudflare/config.json ]]; then
    export CF_ACCOUNT_ID=$(jq -r .AccountID ~/.cloudflare/config.json 2>/dev/null || echo "")
    export CF_API_TOKEN=$(jq -r .APIToken ~/.cloudflare/config.json 2>/dev/null || echo "")
fi

if [[ -z "$CF_ACCOUNT_ID" || -z "$CF_API_TOKEN" ]]; then
    echo "❗  Please set CF_ACCOUNT_ID and CF_API_TOKEN"
    echo "   export CF_ACCOUNT_ID='your-account-id'"
    echo "   export CF_API_TOKEN='your-api-token'"
    exit 1
fi

echo "✅ Cloudflare credentials configured"

# 3. Bootstrap (idempotent)
echo "🛠️  Step 3: Running Phase 6.1 bootstrap"
if [[ -f ./scripts/bootstrap-phase6-1.sh ]]; then
    ./scripts/bootstrap-phase6-1.sh
    echo "✅ Bootstrap completed"
else
    echo "❌ Bootstrap script not found"
    exit 1
fi

# 4. Integration test
echo "🧪 Step 4: Running integration tests"
if [[ -f ./scripts/test-phase6-1-integration.sh ]]; then
    ./scripts/test-phase6-1-integration.sh
    echo "✅ Integration tests passed"
else
    echo "❌ Integration test script not found"
    exit 1
fi

# 5. Canary validation
echo "🔍 Step 5: Quick canary validation"
echo "Sending test PR email..."
WORKER_URL="https://tgk-email-orchestrator.utahj4754.workers.dev"
RESP=$(curl -sX POST "$WORKER_URL/kinja/analyze" \
  -H "Content-Type: application/json" \
  -d '{"subject":"PR #999 merge gate","body":"CI green, 2 approvals"}' || echo "")

if echo "$RESP" | grep -q '"priority":"p0"'; then
    echo "✅ Canary validation passed"
    echo "📊 Response: $RESP"
else
    echo "❌ Canary validation failed"
    echo "Response: $RESP"
    exit 1
fi

# 6. Prepare for PR
echo "📝 Step 6: Ready for PR creation"
echo ""
echo "🎯 Launch Summary:"
echo "✅ Feature branch created"
echo "✅ Cloudflare credentials configured"
echo "✅ Phase 6.1 bootstrap completed"
echo "✅ Integration tests passed"
echo "✅ Canary validation successful"
echo ""
echo "🚀 Ready to create PR:"
echo "gh pr create --title 'feat: Phase 6.1 Kinja Temporal Intelligence' --body-file .github/pr-body-phase6-1.md"
echo ""
echo "📊 Monitor canary:"
echo "wrangler tail tgk-email-orchestrator | grep -i pr999"
echo ""
echo "⏮️  Rollback if needed:"
echo "wrangler secret put EMAIL_PR_TELEGRAM 0 && wrangler deploy"
echo ""
echo "🎉 Phase 6.1 Kinja Temporal Intelligence - LAUNCH READY!"
