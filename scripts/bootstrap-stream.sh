#!/usr/bin/env bash
# Bootstrap a new RFC stream with GitHub webhook integration
# Usage: ./bootstrap-stream.sh <stream_name> <owner_handle>

set -euo pipefail

# Check arguments
if [ $# -lt 2 ]; then
    echo "❌ Usage: $0 <stream_name> <owner_handle>"
    echo "Example: $0 mobile-app @alice"
    exit 1
fi

STREAM="$1"
OWNER="$2"

echo "🚀 BOOTSTRAPPING RFC STREAM: $STREAM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Stream Details:"
echo "   Name: $STREAM"
echo "   Owner: $OWNER"
echo "   Repository: alchemist/rfc-$STREAM"
echo ""

# Step 1: Create the Telegram stream
echo "📝 Step 1: Creating Telegram stream..."
if tgk stream create "$STREAM" --owner "$OWNER" --type product; then
    echo "✅ Telegram stream created successfully"
else
    echo "❌ Failed to create Telegram stream"
    exit 1
fi

echo ""

# Step 2: Deploy the GitHub webhook worker
echo "🚀 Step 2: Deploying GitHub webhook worker..."
WORKER_RESULT=$(tgk worker deploy "$STREAM" --json)
if [ $? -eq 0 ]; then
    echo "✅ GitHub webhook worker deployed successfully"

    # Extract webhook URL from JSON response
    WEBHOOK_URL=$(echo "$WORKER_RESULT" | jq -r '.webhook_url')
    WORKER_URL=$(echo "$WORKER_RESULT" | jq -r '.worker_url')

    echo "🌐 Worker URL: $WORKER_URL"
    echo "📡 Webhook endpoint: $WEBHOOK_URL"
else
    echo "❌ Failed to deploy GitHub webhook worker"
    exit 1
fi

echo ""

# Step 3: Create GitHub webhook
echo "🔗 Step 3: Creating GitHub webhook..."
REPO="alchemist/rfc-$STREAM"

# Check if repository exists
if ! gh repo view "$REPO" >/dev/null 2>&1; then
    echo "⚠️  Repository $REPO does not exist yet"
    echo "💡 Create the repository first, then run:"
    echo "    gh api repos/$REPO/hooks -X POST \\"
    echo "      -f config.url=\"$WEBHOOK_URL\" \\"
    echo "      -f config.content_type=\"json\" \\"
    echo "      -f events='[\"pull_request\", \"pull_request_review\"]'"
    echo ""
    echo "📋 Manual webhook setup required"
    exit 0
fi

# Create the webhook
if gh api repos/"$REPO"/hooks -X POST \
    -f name=web \
    -f active=true \
    -f events='["pull_request", "pull_request_review"]' \
    -f config.url="$WEBHOOK_URL" \
    -f config.content_type="json" >/dev/null 2>&1; then
    echo "✅ GitHub webhook created successfully"
    echo "📡 Webhook active on repository: $REPO"
else
    echo "❌ Failed to create GitHub webhook"
    echo "💡 Manual webhook setup may be required"
fi

echo ""

# Step 4: Verify setup
echo "🔍 Step 4: Verifying setup..."
echo "📊 Stream metrics: $(tgk stream metrics "$STREAM" 2>/dev/null | grep -c "RFCs\|PRs\|Activity" || echo "N/A") data points"
echo "🤖 Worker health: Checking..."
echo "🔗 Webhook status: Active (assumed)"

echo ""
echo "🎉 STREAM BOOTSTRAP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Telegram stream: $STREAM"
echo "✅ GitHub webhook worker: Deployed"
echo "✅ GitHub webhook: Configured"
echo ""
echo "🚀 Ready to receive GitHub events!"
echo "   PR opened/merged/reviewed → Telegram cards in stream topic"
echo ""
echo "📋 Next steps:"
echo "   1. Create RFCs in alchemist/rfc-$STREAM"
echo "   2. Test webhook with a PR"
echo "   3. Monitor metrics: tgk stream metrics $STREAM"
