#!/usr/bin/env bash
# infra/telegram/bootstrap-stream.sh - RFC Stream Scaffolding Bootstrap
# Usage: bootstrap-stream.sh <stream_name> <type> <owner> [council_id]

set -euo pipefail

# Input validation
STREAM="${1:-}"
TYPE="${2:-}"
OWNER="${3:-}"
COUNCIL_ID="${4:-$TG_COUNCIL_CHAT_ID}"

if [ -z "$STREAM" ] || [ -z "$TYPE" ] || [ -z "$OWNER" ]; then
    echo "❌ Usage: $0 <stream_name> <type> <owner> [council_id]"
    echo "   stream_name: e.g., 'security-2025'"
    echo "   type: sec|sre|data|product"
    echo "   owner: Telegram handle or user ID"
    echo "   council_id: Council chat ID (optional, uses env var)"
    exit 1
fi

# Validate stream type
case "$TYPE" in
    "sec"|"sre"|"data"|"product")
        echo "✅ Valid stream type: $TYPE"
        ;;
    *)
        echo "❌ Invalid stream type: $TYPE. Must be: sec, sre, data, product"
        exit 1
        ;;
esac

echo "🚀 Bootstrapping RFC Stream: $STREAM (type: $TYPE, owner: $OWNER)"

# 1. GitHub repo creation (template-based)
echo "📁 Creating GitHub repository..."
REPO_NAME="rfc-$STREAM"
gh repo create "alchemist/$REPO_NAME" \
    --template "alchemist/rfc-template-$TYPE" \
    --private \
    -y \
    --description "RFC stream for $STREAM initiatives"

if [ $? -eq 0 ]; then
    echo "✅ Created repository: alchemist/$REPO_NAME"
else
    echo "⚠️ Repository might already exist, continuing..."
fi

# Clone the repo for local operations
gh repo clone "alchemist/$REPO_NAME" "/tmp/$REPO_NAME"
cd "/tmp/$REPO_NAME"

# 2. Branch protection + CODEOWNERS
echo "🔐 Setting up branch protection and CODEOWNERS..."
case "$TYPE" in
    "sec")
        echo "$OWNER @alchemist/security-leads @brendadeeznuts1111" > CODEOWNERS
        ;;
    "sre")
        echo "$OWNER @alchemist/sre-leads @brendadeeznuts1111" > CODEOWNERS
        ;;
    "data")
        echo "$OWNER @alchemist/data-leads @brendadeeznuts1111" > CODEOWNERS
        ;;
    "product")
        echo "$OWNER @alchemist/product-leads @brendadeeznuts1111" > CODEOWNERS
        ;;
esac

# Create branch protection config
cat > protection.json << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci/build", "policy/check", "security/scan"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 2,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": {
    "users": [],
    "teams": ["alchemist-leads"]
  }
}
EOF

# Apply branch protection
gh api repos/alchemist/$REPO_NAME/branches/main/protection \
    --input protection.json \
    --method PUT 2>/dev/null || echo "⚠️ Branch protection might need manual setup"

git add CODEOWNERS
git commit -m "🔐 Add CODEOWNERS and branch protection for $STREAM"
git push origin main

echo "✅ Branch protection and CODEOWNERS configured"

# 3. OPA policy pack setup
echo "🛡️ Setting up OPA policy pack..."
mkdir -p policies
cp "../../alchmenyrun/infra/telegram/policies/${TYPE}"*.rego policies/ 2>/dev/null || echo "⚠️ No specific policies found for $TYPE"

# Create stream-specific policy
cat > "policies/stream-${TYPE}.rego" << EOF
package alchemist.rfc.stream

# Stream-specific access control
allow_submit {
    input.user == "$OWNER"
    input.stream_type == "$TYPE"
}

allow_review {
    input.user in data.reviewers[$TYPE]
}

# Required approvers based on stream type
required_approvers = {
    "sec": 2,
    "sre": 2,
    "data": 1,
    "product": 1
}[input.stream_type]
EOF

git add policies/
git commit -m "🛡️ Add OPA policy pack for $TYPE stream"
git push origin main

echo "✅ OPA policy pack configured"

# 4. Grafana folder setup (if credentials available)
if [ -n "${GRAFANA_API_KEY:-}" ] && [ -n "${GRAFANA_URL:-}" ]; then
    echo "📊 Creating Grafana folder..."
    GRAFANA_RESPONSE=$(curl -s -X POST "$GRAFANA_URL/api/folders" \
        -H "Authorization: Bearer $GRAFANA_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"uid\":\"rfc-$STREAM\",\"title\":\"RFC $STREAM\"}")
    
    if echo "$GRAFANA_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        echo "✅ Grafana folder created"
        GRAFANA_FOLDER_ID=$(echo "$GRAFANA_RESPONSE" | jq -r '.id')
    else
        echo "⚠️ Grafana folder creation failed"
        GRAFANA_FOLDER_ID=""
    fi
else
    echo "⚠️ Grafana credentials not available, skipping folder creation"
    GRAFANA_FOLDER_ID=""
fi

# 5. Telegram forum topic creation with emoji naming convention
echo "💬 Creating Telegram forum topic with emoji naming..."

# Get emoji and short name for stream type
EMOJI=$(tgk stream emoji "$TYPE" 2>/dev/null || echo "🏷️")
SHORT=$(tgk stream short "$TYPE" 2>/dev/null || echo "misc")

# Create Telegram best-practice topic name (no slashes, kebab-case, owner at end)
OWNER_CLEAN="${OWNER#@}"  # Remove @ if present
STREAM_KEBAB=$(echo "$STREAM" | tr ' ' '-' | tr '_' '-' | tr '[:upper:]' '[:lower:]')
TOPIC_NAME="$EMOJI $SHORT-$STREAM_KEBAB–$OWNER_CLEAN"

echo "   📝 Topic name: $TOPIC_NAME"

# Create initial message based on stream type
case "$TYPE" in
    "sec")
        INITIAL_MESSAGE="🔐 **RFC Stream: $STREAM**

🛡️ **Security RFC Guidelines**
- **Template**: security-template.md
- **Approvers**: 2 required (Security Lead + SRE)
- **Timeline**: 5 days max review
- **Requirements**: Threat model, risk assessment, roll-back plan

📋 **Quality Gates**:
- Threat model with risk matrix
- Security controls documentation  
- Roll-back procedure (≤5 minutes)
- Compliance validation

💡 **Getting Started**:
/rfc new --template security --title \"Your Security RFC\"
👥 Reviewers assigned automatically

📊 **Metrics Tracked**: Approval rate, review velocity, security incidents prevented

🤖 **Bot Commands**:
/lgtm - Council approval
/review - Detailed feedback
/status - Current RFC status"
        ;;
    "sre")
        INITIAL_MESSAGE="⚡ **RFC Stream: $STREAM**

🏗️ **SRE/Infrastructure RFC Guidelines**
- **Template**: sre-template.md
- **Approvers**: 2 required (SRE Lead + Platform)
- **Timeline**: 3 days max review
- **Requirements**: SLA impact, monitoring changes, capacity planning

📋 **Quality Gates**:
- SLA impact assessment
- Monitoring strategy defined
- Roll-back procedure documented
- Capacity planning completed

💡 **Getting Started**:
/rfc new --template sre --title \"Your Infrastructure RFC\"

📊 **Metrics Tracked**: Uptime impact, performance benchmarks, deployment success

🤖 **Automated**: Infrastructure validation, monitoring setup, capacity checks"
        ;;
    "data")
        INITIAL_MESSAGE="📊 **RFC Stream: $STREAM**

🔒 **Data Governance RFC Guidelines**
- **Template**: data-template.md
- **Approvers**: 1 required (Data Lead)
- **Timeline**: 7 days max review
- **Requirements**: Privacy assessment, data lineage, retention policies

📋 **Quality Gates**:
- Privacy impact assessment
- Data lineage documented
- Retention policy defined
- Security controls verified

💡 **Getting Started**:
//rfc new --template data --title \"Your Data RFC\"

📊 **Metrics Tracked**: Data quality scores, privacy compliance, lineage completeness

🤖 **Automated**: Privacy scanning, data validation, retention enforcement"
        ;;
    "product")
        INITIAL_MESSAGE="🎯 **RFC Stream: $STREAM**

🚀 **Product Innovation RFC Guidelines**
- **Template**: product-template.md
- **Approvers**: 1 required (Product Lead)
- **Timeline**: 2 days max review
- **Requirements**: User research, business metrics, success criteria

📋 **Quality Gates**:
- User research completed
- Business impact quantified
- Success metrics defined
- Technical feasibility verified

💡 **Getting Started**:
/rfc new --template product --title \"Your Product RFC\"

📊 **Metrics Tracked**: User engagement, business value, feature adoption

🤖 **Automated**: User research validation, business case analysis, A/B test setup"
        ;;
    *)
        INITIAL_MESSAGE="🏗️ **RFC Stream: $STREAM**

📋 **General RFC Guidelines**
- **Type**: $TYPE
- **Owner**: $OWNER
- **Timeline**: TBD based on stream type

💡 **Getting Started**:
/rfc new --template $TYPE --title \"Your RFC Title\"
- [PR Queue](https://github.com/alchemist/rfc-$STREAM/pulls)

💡 **Getting Started:**
1. Use \`/rfc new --template $TYPE\` to create your first RFC
2. All discussions happen in this thread
3. Metrics are tracked in the Grafana dashboard

🤖 **Bot Commands:**
- \`/rfc new --template $TYPE --title \"Your Title\"\`
- \`/rfc list\` - Show open RFCs
- \`/rfc submit --id <number>\` - Submit for review

Ready to innovate! 🎯" \
            -d parse_mode=Markdown > /dev/null
        
        echo "✅ Posted welcome message to topic"
    else
        echo "❌ Failed to create forum topic"
        TOPIC_ID=""
    fi
else
    echo "⚠️ Telegram credentials not available, skipping topic creation"
    TOPIC_ID=""
fi

# Cleanup
cd /tmp
rm -rf "$REPO_NAME"

# Output for GitHub Actions
if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "STREAM=$STREAM" >> "$GITHUB_OUTPUT"
    echo "REPO_NAME=$REPO_NAME" >> "$GITHUB_OUTPUT"
    echo "TYPE=$TYPE" >> "$GITHUB_OUTPUT"
    echo "OWNER=$OWNER" >> "$GITHUB_OUTPUT"
    if [ -n "$TOPIC_ID" ]; then
        echo "TOPIC_ID=$TOPIC_ID" >> "$GITHUB_OUTPUT"
    fi
    if [ -n "$GRAFANA_FOLDER_ID" ]; then
        echo "GRAFANA_FOLDER_ID=$GRAFANA_FOLDER_ID" >> "$GITHUB_OUTPUT"
    fi
fi

# Summary
echo ""
echo "🎉 RFC Stream Bootstrap Complete!"
echo ""
echo "📊 Created Resources:"
echo "   📁 Repository: alchemist/$REPO_NAME"
echo "   🔐 Branch Protection: Enabled"
echo "   🛡️ OPA Policies: Configured"
if [ -n "$GRAFANA_FOLDER_ID" ]; then
    echo "   📊 Grafana Folder: $GRAFANA_FOLDER_ID"
fi
if [ -n "$TOPIC_ID" ]; then
    echo "   💬 Telegram Topic: $TOPIC_ID"
fi
echo ""
echo "⚡ Next Steps:"
echo "   1. Clone: gh repo clone alchemist/$REPO_NAME"
echo "   2. Create RFC: /rfc new --template $TYPE --title \"Your Title\""
echo "   3. Submit for review: /rfc submit --id <number>"
echo ""
echo "✅ Stream $STREAM is ready for RFC innovation!"
