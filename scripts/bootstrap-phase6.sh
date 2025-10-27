#!/usr/bin/env bash
set -euo pipefail
#---------------------------------------------------------------------------#
#  CF_ACCOUNT_ID, CF_API_TOKEN, TG_BOT_TOKEN, TGK_API_TOKEN must be set
#---------------------------------------------------------------------------#
RFC_ID="ALC-RFC-006"
WRK_NAME="tgk-email-orchestrator"
D1_NAME="tgk_email_metadata"
R2_BUCKET="tgk-email-attachments"

echo "🪄  Phase-6 bootstrap – idempotent"

# Change to workers directory for wrangler commands
cd workers/tgk-email-orchestrator

# 1. D1 DB (routing cache + audit)
echo "📊 Checking D1 database..."
npx wrangler d1 list | grep -q "$D1_NAME" || npx wrangler d1 create "$D1_NAME"
echo "🗃️  Executing schema..."
npx wrangler d1 execute "$D1_NAME" --file=../../.github/rfc006/schema-init.sql || echo "⚠️  Schema may already be initialized"

# 2. R2 bucket (attachments)
echo "🪣  Checking R2 bucket..."
npx wrangler r2 bucket list | grep -q "$R2_BUCKET" || npx wrangler r2 bucket create "$R2_BUCKET"
echo "✅ R2 bucket ready"

# 3. Worker + secrets
echo "⚙️  Deploying worker..."
npx wrangler deploy --name "$WRK_NAME" --compatibility-date 2025-11-01

echo "🔐 Setting secrets..."
echo "Setting TG_BOT_TOKEN..."
echo "$TG_BOT_TOKEN" | npx wrangler secret put TG_BOT_TOKEN
echo "Setting TGK_API_TOKEN..."
echo "$TGK_API_TOKEN" | npx wrangler secret put TGK_API_TOKEN
echo "Setting SENDGRID_API_KEY..."
echo "placeholder_sendgrid_key" | npx wrangler secret put SENDGRID_API_KEY  # Will be updated later

# Go back to project root
cd ../..

# 4. Email route (catch-all for grammar)
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/email/routing/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"tgk-phase6-grammar","enabled":true,"matchers":[{"type":"literal","field":"to","value":"*.*.*.*.*.*@cloudflare.com"}],"actions":[{"type":"worker","value":"'"$WRK_NAME"'"}]}'

# 5. Emit RFC metadata into the repo (never edited by hand)
mkdir -p .rfc/"$RFC_ID"
cat > .rfc/"$RFC_ID"/metadata.yml <<EOF
id:          $RFC_ID
status:      PROPOSED
bootstrap-ts: $(date -u +%Y-%m-%dT%H:%M:%SZ)
worker-id:   $WRK_NAME
d1-id:       $D1_NAME
r2-bucket:   $R2_BUCKET
phase6-deployment: .github/rfc006/phase-6-deployment.yml
rollback:    wrangler delete $WRK_NAME && wrangler d1 delete $D1_NAME -y
EOF

echo "✅  Bootstrap complete – metadata written to .rfc/$RFC_ID/metadata.yml"
