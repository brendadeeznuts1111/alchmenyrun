#!/usr/bin/env bash
# infra/telegram/bootstrap.sh - Complete Telegram environment IaC bootstrap
# Creates entire Telegram ecosystem from code in ≤ 60 seconds
#
# Usage: ./infra/telegram/bootstrap.sh
#
# Requires: TELEGRAM_BOT_TOKEN environment variable
# Outputs: GitHub Actions variables for CI/CD

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Validate requirements
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN environment variable not set"
    echo "Set it with: export TELEGRAM_BOT_TOKEN='your_bot_token_here'"
    exit 1
fi

# Check if tgk is available
if ! command -v tgk &> /dev/null; then
    echo "❌ Error: tgk CLI not found. Install with:"
    echo "pipx install git+https://github.com/alchemist/tgk@v2"
    exit 1
fi

echo "🚀 Starting Telegram environment bootstrap..."
echo "📍 Using tgk version: $(tgk --version)"

# Initialize tgk configuration
echo "⚙️  Initializing tgk configuration..."
tgk config init --set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"

# Create Alchemists Council (super-group with forum)
echo "👥 Creating Alchemists Council super-group..."
COUNCIL_JSON=$(tgk group create "Alchemists Council" --forum --convert -o json)
COUNCIL_ID=$(echo "$COUNCIL_JSON" | jq -r '.id')

if [ -z "$COUNCIL_ID" ] || [ "$COUNCIL_ID" = "null" ]; then
    echo "❌ Failed to create Alchemists Council"
    exit 1
fi

echo "✅ Created Alchemists Council with ID: $COUNCIL_ID"

# Configure bot permissions for council
echo "🔐 Configuring bot permissions for council..."
tgk role set -c "$COUNCIL_ID" -u alchemist_core_bot --admin --can-pin --can-manage-topics

# Run policy checks
echo "🛡️  Running policy compliance checks..."
if ! tgk policy check -c "$COUNCIL_ID" --policy "$SCRIPT_DIR/policies/admin-roles.rego"; then
    echo "❌ Policy violations detected in council configuration"
    exit 1
fi

echo "✅ Council policy checks passed"

# Create alchemist_releases channel
echo "📢 Creating alchemist_releases broadcast channel..."
RELEASES_JSON=$(tgk channel create "alchemist_releases" --public -o json)
RELEASES_ID=$(echo "$RELEASES_JSON" | jq -r '.id')

if [ -z "$RELEASES_ID" ] || [ "$RELEASES_ID" = "null" ]; then
    echo "❌ Failed to create alchemist_releases channel"
    exit 1
fi

echo "✅ Created alchemist_releases channel with ID: $RELEASES_ID"

# Create infra_team group
echo "🔧 Creating infra_team operational group..."
INFRA_JSON=$(tgk group create "infra_team" --forum --convert -o json)
INFRA_ID=$(echo "$INFRA_JSON" | jq -r '.id')

if [ -z "$INFRA_ID" ] || [ "$INFRA_ID" = "null" ]; then
    echo "❌ Failed to create infra_team group"
    exit 1
fi

echo "✅ Created infra_team group with ID: $INFRA_ID"

# Configure bot permissions for infra team
tgk role set -c "$INFRA_ID" -u alchemist_core_bot --admin --can-pin --can-manage-topics

# Create CI status channel
echo "🤖 Creating CI status channel..."
CI_JSON=$(tgk channel create "alchemist_ci_status" -o json)
CI_ID=$(echo "$CI_JSON" | jq -r '.id')

if [ -z "$CI_ID" ] || [ "$CI_ID" = "null" ]; then
    echo "❌ Failed to create CI status channel"
    exit 1
fi

echo "✅ Created CI status channel with ID: $CI_ID"

# Output for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "COUNCIL_ID=$COUNCIL_ID" >> "$GITHUB_OUTPUT"
    echo "RELEASES_ID=$RELEASES_ID" >> "$GITHUB_OUTPUT"
    echo "INFRA_ID=$INFRA_ID" >> "$GITHUB_OUTPUT"
    echo "CI_STATUS_ID=$CI_ID" >> "$GITHUB_OUTPUT"
    echo "✅ GitHub Actions outputs written"
fi

# Summary
echo ""
echo "🎉 Telegram environment bootstrap complete!"
echo ""
echo "📊 Created Entities:"
echo "   👥 Alchemists Council: $COUNCIL_ID"
echo "   📢 Releases Channel: $RELEASES_ID"
echo "   🔧 Infra Team: $INFRA_ID"
echo "   🤖 CI Status: $CI_ID"
echo ""
echo "⏱️  Total time: $SECONDS seconds"
echo ""
echo "✅ Ready for RFC automation!"
echo ""
echo "💡 Next steps:"
echo "   1. Run: tgk ai suggest --context 'bootstrap complete'"
echo "   2. Test: tgk card post -c $COUNCIL_ID -t 'Bootstrap Complete' -d 'Environment ready for RFCs'"
echo "   3. Monitor: Check Grafana 'Alchemist Comms Health' dashboard"
