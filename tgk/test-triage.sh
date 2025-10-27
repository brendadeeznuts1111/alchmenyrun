#!/bin/bash

echo "🧪 Testing Issue Triage MVP"
echo "==========================="

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not set - running limited tests without API calls"
    echo ""
fi

echo "1️⃣ Running unit tests..."
cd /Users/nolarose/alchmenyrun/tgk
npm test

echo ""
echo "2️⃣ Testing CLI help..."
node cli.ts --help

echo ""
echo "3️⃣ Testing issue command help..."
node cli.ts issue --help

if [ -n "$GITHUB_TOKEN" ]; then
    echo ""
    echo "4️⃣ Testing triage command help..."
    node cli.ts issue triage --help

    echo ""
    echo "5️⃣ Testing analyze command help..."
    node cli.ts issue analyze --help
else
    echo ""
    echo "4️⃣ Skipping API-dependent tests (no GITHUB_TOKEN)"
fi

echo ""
echo "✅ Issue triage tests completed!"
