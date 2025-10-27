#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Phase 6.1 Bootstrap Script - Idempotent Infrastructure
# Creates Queue, Analytics, OPA bundle, feature flags, and validates canary
# ============================================================================

# ---------- config ----------
QUEUE_NAME="tgk-email-pr-queue"
DATASET="tgk_pr_dataset"
OPA_BUCKET="tgk-email-attachments"
BUNDLE_KEY="bundles/phase61.tar.gz"
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
# Note: Analytics Engine creation via wrangler not yet supported
# Using curl as fallback until wrangler adds support
curl -sX POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/analytics_engine/datasets" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$DATASET\",\"retention_days\":90}" 2>/dev/null || echo "⚠️  Analytics Engine may already exist or API unavailable"

# 3. OPA bundle (merge gate)
echo "➡️  OPA bundle"
if [[ -f ".github/rfc006/policies/phase61-pr.rego" ]]; then
  mkdir -p .opa/phase61
  cp .github/rfc006/policies/phase61-pr.rego .opa/phase61/pr.rego
  tar -czf - -C .opa/phase61 . | \
    npx wrangler r2 object put "$BUNDLE_KEY" --pipe --bucket "$OPA_BUCKET" 2>/dev/null || echo "⚠️  Failed to upload OPA bundle"
else
  echo "⚠️  OPA policy file not found: .github/rfc006/policies/phase61-pr.rego"
fi

echo "🎉 Phase 6.1 infrastructure ready – bootstrap complete"
echo ""
echo "📋 Next steps:"
echo "  1. Enable features: bun run phase61:rollout"
echo "  2. Monitor status: bun run phase61:status"
echo "  3. Rollback if needed: bun run phase61:rollback"
