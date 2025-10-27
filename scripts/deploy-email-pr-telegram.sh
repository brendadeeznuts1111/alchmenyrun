#!/bin/bash

# Deploy Email PR Telegram Integration
# This script applies the D1 migration and deploys the worker

set -e

echo "🚀 Deploying Email PR Telegram Integration..."

# Apply D1 migration
echo "📊 Applying D1 migration..."
npx wrangler d1 execute tgk_email_metadata --file=.github/rfc006/migrations/003-email-tg-pr.sql

if [ $? -eq 0 ]; then
    echo "✅ D1 migration applied successfully"
else
    echo "❌ D1 migration failed"
    exit 1
fi

# Deploy worker
echo "🌐 Deploying worker..."
cd workers/tgk-email-orchestrator
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Worker deployed successfully"
else
    echo "❌ Worker deployment failed"
    exit 1
fi

echo "🎉 Email PR Telegram Integration deployed successfully!"
echo ""
echo "📧 Test by sending an email to: infra.sre.review.p0.gh.pr51@cloudflare.com"
echo "📱 The PR #51 should appear as a rich card in Telegram with interactive buttons"
echo ""
echo "🔧 Feature flags:"
echo "   EMAIL_PR_TELEGRAM=1 (enabled)"
echo "   SEND_EMAIL_REPLY=1 (optional, enable for email replies)"
