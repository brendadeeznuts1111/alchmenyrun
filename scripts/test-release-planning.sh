#!/bin/bash
# test-release-planning.sh - Release planning testing

echo "🧪 Testing Release Planning Core"

# Test 1: Basic release plan generation
echo "1️⃣ Testing basic release plan generation..."
tgk release plan --type patch --components core --dry-run

# Test 2: Minor release with policy check
echo "2️⃣ Testing minor release with policy..."
tgk release plan --type minor --components core,ui --urgency normal --dry-run

# Test 3: Major release (high confidence scenario)
echo "3️⃣ Testing major release..."
tgk release plan --type major --components core,ui,workers --urgency high --dry-run

# Test 4: Policy validation
echo "4️⃣ Testing OPA policy..."
tgk policy test --file infra/telegram/policies/release-basic.rego

echo "✅ Release planning tests completed!"
