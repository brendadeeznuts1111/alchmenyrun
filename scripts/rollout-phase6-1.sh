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
QUEUE_NAME="tgk-email-pr-queue"

# Function to check deployment status
check_deployment() {
  echo "🔍 Checking deployment status..."
  npx wrangler tail --format=pretty --once || echo "⚠️  Cannot check logs (deploy may not be active)"
}

# Roll-forward deployment
roll_forward() {
  echo -e "${GREEN}▶️  ROLLING FORWARD Phase-6.1 features${NC}"

  # 1. Ensure infrastructure exists
  echo "🏗️  Checking infrastructure..."
  if ! npx wrangler queues list 2>/dev/null | grep -q "$QUEUE_NAME"; then
    echo "Infrastructure not found. Run: bun run phase61:bootstrap"
    exit 1
  fi

  # 2. Enable feature flags in deployment file
  echo "🎛️  Enabling feature flags..."
  # Use sed instead of yq for better compatibility
  sed -i.bak \
    -e 's/EMAIL_PR_TELEGRAM: ".*"/EMAIL_PR_TELEGRAM: "1"/' \
    -e 's/EMAIL_PR_REPLY: ".*"/EMAIL_PR_REPLY: "1"/' \
    -e 's/EMAIL_PR_QUEUE: ".*"/EMAIL_PR_QUEUE: "1"/' \
    -e 's/EMAIL_PR_ANALYTICS: ".*"/EMAIL_PR_ANALYTICS: "1"/' \
    -e 's/EMAIL_PR_OPA: ".*"/EMAIL_PR_OPA: "1"/' \
    "$DEPLOYMENT_FILE"

  # 3. Deploy with all features enabled
  echo "📦 Deploying with Phase-6.1 features..."
  npx wrangler deploy --config "$DEPLOYMENT_FILE"

  # 4. Verify deployment
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

  # 1. Disable feature flags in deployment file
  echo "🔧 Disabling feature flags..."
  sed -i.bak \
    -e 's/EMAIL_PR_TELEGRAM: ".*"/EMAIL_PR_TELEGRAM: "0"/' \
    -e 's/EMAIL_PR_REPLY: ".*"/EMAIL_PR_REPLY: "0"/' \
    -e 's/EMAIL_PR_QUEUE: ".*"/EMAIL_PR_QUEUE: "0"/' \
    -e 's/EMAIL_PR_ANALYTICS: ".*"/EMAIL_PR_ANALYTICS: "0"/' \
    -e 's/EMAIL_PR_OPA: ".*"/EMAIL_PR_OPA: "0"/' \
    "$DEPLOYMENT_FILE"

  # 2. Deploy with features disabled
  echo "📦 Deploying Phase-6.0 (features disabled)..."
  npx wrangler deploy --config "$DEPLOYMENT_FILE"

  # 3. Optional: Revert code to Phase-6.0
  read -p "Also revert code to Phase-6.0? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Reverting to Phase-6.0 code..."
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
  npx wrangler queues list 2>/dev/null | grep -q "$QUEUE_NAME" && echo "  ✅ Queue: $QUEUE_NAME" || echo "  ❌ Queue: Not found"
  npx wrangler analytics-engine list 2>/dev/null | grep -q tgk_pr_dataset && echo "  ✅ Analytics: tgk_pr_dataset" || echo "  ❌ Analytics: Not found"
  npx wrangler r2 object list tgk-email-attachments 2>/dev/null | grep -q "bundles/phase61.tar.gz" && echo "  ✅ OPA Bundle: phase61.tar.gz" || echo "  ❌ OPA Bundle: Not found"

  # Check deployment
  echo ""
  echo "🚀 Deployment:"
  npx wrangler deployments list 2>/dev/null | head -5 || echo "  ❌ Cannot check deployments"

  # Check feature flags in deployment file
  echo ""
  echo "🎛️  Feature Flags (deployment file):"
  grep "EMAIL_PR_" "$DEPLOYMENT_FILE" | sed 's/.*EMAIL_PR_/  /' || echo "  ❌ Cannot read deployment file"
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
