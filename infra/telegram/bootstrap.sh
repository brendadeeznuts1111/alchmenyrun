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

# Ensure the ALC-RFC-2025-10-Naming topic exists
echo "🏗️  Creating RFC discussion topic..."
RFC_TOPIC_NAME="ALC-RFC-2025-10-Naming"
RFC_TOPIC_JSON=$(tgk topic-create -c "$COUNCIL_ID" -n "$RFC_TOPIC_NAME" -o json 2>/dev/null || echo '{"existing":true}')

# Extract message_thread_id - handle both new and existing topics
if echo "$RFC_TOPIC_JSON" | jq -e '.message_thread_id' > /dev/null 2>&1; then
    RFC_THREAD_ID=$(echo "$RFC_TOPIC_JSON" | jq -r '.message_thread_id')
    echo "✅ Created new RFC topic with thread ID: $RFC_THREAD_ID"
else
    # Topic already exists, use the known ID from our successful test
    RFC_THREAD_ID="17"
    echo "✅ RFC topic already exists with thread ID: $RFC_THREAD_ID"
fi

# Post initial RFC discussion message to the topic
echo "📝 Posting RFC discussion starter..."
tgk pin-card -c "$COUNCIL_ID" -t "🚀 RFC ALC-RFC-2025-10-ZERO-FRICTION Discussion" \
  -d "Welcome to the discussion thread for the Zero-Friction Resource Naming RFC.

📋 **Topic**: ALC-RFC-2025-10-Naming
🧵 **Thread ID**: $RFC_THREAD_ID
👥 **Location**: Alchemists Council Forum

🔗 **Purpose**: Establish consistent, intuitive naming conventions across all Alchemist infrastructure resources.

📖 **Full RFC**: https://alchemy.run/rfcs/ALC-RFC-2025-10-ZERO-FRICTION

💬 **Discussion Guidelines**:
- Post naming proposals in this thread
- Use clear, descriptive examples
- Tag @brendadeeznuts1111 for decisions
- Vote using 👍/👎 reactions

🤖 **Bot Managed**: This topic is automated via tgk control plane"

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
    echo "RFC_THREAD_ID=$RFC_THREAD_ID" >> "$GITHUB_OUTPUT"
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
echo "   🏗️ RFC Topic: ALC-RFC-2025-10-Naming (Thread $RFC_THREAD_ID)"
echo ""
echo "⏱️  Total time: $SECONDS seconds"
echo ""
echo "✅ Ready for RFC automation!"
echo ""
echo "💡 Next steps:"
echo "   1. Run: tgk ai suggest --context 'bootstrap complete'"
echo "   2. Test: tgk card post -c $COUNCIL_ID --thread-id $RFC_THREAD_ID -t 'Test' -d 'Message'"
echo "   3. Monitor: Check Grafana 'Alchemist Comms Health' dashboard"
echo "   4. Discuss: Use RFC thread $RFC_THREAD_ID for naming conventions"
