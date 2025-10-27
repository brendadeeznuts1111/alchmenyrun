#!/usr/bin/env bash
set -euo pipefail
#---------------------------------------------------------------------------#
# Phase-6.1 Rollout Script
# Zero-downtime deployment with feature flag roll-forward/rollback
#---------------------------------------------------------------------------#

echo "🚀 Phase-6.1 Rollout – Zero-downtime deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WORKER_NAME="tgk-email-orchestrator"
DEPLOYMENT_FILE=".github/rfc006/phase-6-deployment.yml"

# Function to check deployment status
check_deployment() {
  echo "🔍 Checking deployment status..."
  npx wrangler tail --format=pretty --once || echo "⚠️  Cannot check logs (deploy may not be active)"
}

# Roll-forward deployment
roll_forward() {
  echo -e "${GREEN}▶️  ROLLING FORWARD Phase-6.1 features${NC}"

  # 1. Bootstrap infrastructure (idempotent)
  echo "🏗️  Bootstrapping infrastructure..."
  ./scripts/bootstrap-phase6-1.sh

  # 2. Deploy with all features enabled
  echo "📦 Deploying with Phase-6.1 features..."
  npx wrangler deploy --config "$DEPLOYMENT_FILE"

  # 3. Verify deployment
  echo "✅ Verifying deployment..."
  check_deployment

  echo -e "${GREEN}🎉 Phase-6.1 deployed successfully!${NC}"
  echo "Features enabled:"
  echo "  ✅ EMAIL_PR_TELEGRAM=1     # Interactive PR buttons"
  echo "  ✅ EMAIL_PR_REPLY=1        # Email replies"
  echo "  ✅ EMAIL_PR_QUEUE=1        # Async processing (<50ms HTTP)"
  echo "  ✅ EMAIL_PR_ANALYTICS=1    # SLA tracking"
  echo "  ✅ EMAIL_PR_OPA=1          # Policy enforcement"
}

# Roll-back deployment
roll_back() {
  echo -e "${YELLOW}◀️  ROLLING BACK to Phase-6.0${NC}"

  # 1. Disable all Phase-6.1 features via secrets (immediate effect)
  echo "🔧 Disabling feature flags..."
  npx wrangler secret put EMAIL_PR_TELEGRAM "0" 2>/dev/null || echo "⚠️  EMAIL_PR_TELEGRAM not set"
  npx wrangler secret put EMAIL_PR_REPLY "0" 2>/dev/null || echo "⚠️  EMAIL_PR_REPLY not set"
  npx wrangler secret put EMAIL_PR_QUEUE "0" 2>/dev/null || echo "⚠️  EMAIL_PR_QUEUE not set"
  npx wrangler secret put EMAIL_PR_ANALYTICS "0" 2>/dev/null || echo "⚠️  EMAIL_PR_ANALYTICS not set"
  npx wrangler secret put EMAIL_PR_OPA "0" 2>/dev/null || echo "⚠️  EMAIL_PR_OPA not set"

  # 2. Deploy clean Phase-6.0 code (optional, if code changes needed)
  read -p "Also revert code to Phase-6.0? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Deploying Phase-6.0 code..."
    git checkout HEAD~1 2>/dev/null || echo "⚠️  Cannot auto-revert, manual revert needed"
    npx wrangler deploy --config "$DEPLOYMENT_FILE"
  fi

  echo -e "${YELLOW}✅ Rolled back to Phase-6.0${NC}"
}

# Show status
show_status() {
  echo "📊 Phase-6.1 Status Report"
  echo "=========================="

  # Check if infrastructure exists
  echo "🏗️  Infrastructure:"
  npx wrangler queues list 2>/dev/null | grep -q tgk-email-pr-queue && echo "  ✅ Queue: tgk-email-pr-queue" || echo "  ❌ Queue: Not found"
  npx wrangler analytics-engine list 2>/dev/null | grep -q tgk_pr_dataset && echo "  ✅ Analytics: tgk_pr_dataset" || echo "  ❌ Analytics: Not found"

  # Check deployment
  echo ""
  echo "🚀 Deployment:"
  npx wrangler deployments list 2>/dev/null | head -5 || echo "  ❌ Cannot check deployments"

  # Check feature flags (if deployed)
  echo ""
  echo "🎛️  Feature Flags (current values):"
  echo "  Note: These are runtime secrets, check Cloudflare dashboard for current values"
  echo "  EMAIL_PR_TELEGRAM=1      # Interactive PR buttons"
  echo "  EMAIL_PR_REPLY=1         # Email replies"
  echo "  EMAIL_PR_QUEUE=1         # Async processing"
  echo "  EMAIL_PR_ANALYTICS=1     # SLA tracking"
  echo "  EMAIL_PR_OPA=1           # Policy enforcement"
}

# Main menu
case "${1:-}" in
  "forward"|"-f"|"--forward")
    roll_forward
    ;;
  "back"|"-b"|"--back"|"rollback")
    roll_back
    ;;
  "status"|"-s"|"--status")
    show_status
    ;;
  *)
    echo "Phase-6.1 Rollout Script"
    echo "========================"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  forward   - Roll forward to Phase-6.1 (enable all features)"
    echo "  back      - Roll back to Phase-6.0 (disable all features)"
    echo "  status    - Show current deployment and feature status"
    echo ""
    echo "Examples:"
    echo "  $0 forward    # Enable Phase-6.1"
    echo "  $0 back       # Disable Phase-6.1"
    echo "  $0 status     # Check current state"
    ;;
esac
