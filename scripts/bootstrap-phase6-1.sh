#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Phase 6.1 Bootstrap Script - Idempotent Infrastructure
# Creates Queue, Analytics, OPA bundle, feature flags, and validates canary
# ============================================================================

# ---------- config ----------
QUEUE_NAME="tgk-pr-reply-queue"
DATASET="tgk_pr_dataset"
OPA_BUCKET="tgk-opa-bundles"
BUNDLE_KEY="phase61/pr.tar.gz"
WORKER_NAME="tgk-email-orchestrator"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-}"
CF_API_TOKEN="${CF_API_TOKEN:-}"
# -----------------------------

if [[ -z "$CF_ACCOUNT_ID" || -z "$CF_API_TOKEN" ]]; then
  echo "❗  Export CF_ACCOUNT_ID and CF_API_TOKEN"; exit 1
fi

echo "🛠️  Phase 6.1 bootstrap – idempotent"

# 1. Queue (async replies)
echo "➡️  Queue $QUEUE_NAME"
npx wrangler queues create "$QUEUE_NAME" 2>/dev/null || true

# 2. Analytics Engine (time-to-answer metrics)
echo "➡️  Dataset $DATASET"
curl -sX POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/analytics_engine/datasets" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$DATASET\",\"retention_days\":90}" 2>/dev/null || true

# 3. OPA bundle (merge gate)
echo "➡️  OPA bundle"
mkdir -p .opa/phase61
cat > .opa/phase61/pr.rego <<'REGO'
package tgk.pr
default allow = false
allow {
  input.action == "merge"
  input.gh_status == "clean"
  input.reviews["APPROVED"] >= 2
}
REGO
tar -czf - -C .opa/phase61 . | \
  npx wrangler r2 object put "$BUNDLE_KEY" --pipe --bucket "$OPA_BUCKET" 2>/dev/null || true

# 4. Patch wrangler manifest (feature flags)
echo "➡️  Feature flags"
yq eval -i '
  .vars.EMAIL_PR_TELEGRAM = "1" |
  .vars.EMAIL_PR_REPLY     = "1" |
  .vars.EMAIL_PR_QUEUE     = "1" |
  .vars.EMAIL_PR_ANALYTICS = "1" |
  .vars.EMAIL_PR_OPA       = "1"
' phase-6-deployment.yml

# 5. Deploy
echo "➡️  Deploy Worker"
npx wrangler deploy --config phase-6-deployment.yml

# 6. Smoke test (canary)
echo "➡️  Canary smoke test"
RESP=$(curl -sX POST "https://$WORKER_NAME.your-subdomain.workers.dev/kinja/analyze" \
  -H "Content-Type: application/json" \
  -d '{"subject":"PR #999 merge gate","body":"CI green, 2 approvals"}')
echo "Canary response: $RESP"
grep -q '"priority":"p0"' <<<"$RESP" && echo "✅ Canary healthy" || { echo "❌ Canary failed"; exit 1; }

echo "🎉 Phase 6.1 live – flags on, queue ready, analytics streaming"
echo "🔍  Canary dashboard: https://dash.cloudflare.com/$CF_ACCOUNT_ID/analytics-engine"
echo "⏮️  Rollback: wrangler secret put EMAIL_PR_TELEGRAM 0 && wrangler deploy"
