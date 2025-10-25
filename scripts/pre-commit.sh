#!/bin/bash

# Pre-commit hook following Alchemy contributing guidelines
# This script runs the exact commands specified in Alchemy's "Before Committing" section

echo "🔧 Running Alchemy pre-commit checks..."

echo "📝 Fixing code formatting and linting..."
if ! bun format; then
    echo "❌ Formatting failed. Please fix formatting issues before committing."
    exit 1
fi

echo "🧪 Running tests (targets changed files vs main)..."
if ! bun run test; then
    echo ""
    echo "❌ Tests failed. Before committing, ensure you have:"
    echo "   - Fixed any failing tests"
    echo "   - Run: bun format"
    echo "   - Run: bun run test" 
    echo "   - Or run specific tests: bun vitest ./src/tests/... -t \"...\""
    echo ""
    echo "💡 If tests are failing due to missing credentials, you can:"
    echo "   - Set up Cloudflare credentials in your environment"
    echo "   - Or run specific tests that don't require external services"
    echo ""
    echo "🚫 Please fix test failures before committing."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
echo "📋 Following Alchemy contributing guidelines:"
echo "   ✓ Code formatted with oxfmt"
echo "   ✓ Tests run successfully"
echo "   ✓ Ready to commit!"
echo ""
echo "🚀 Ready to commit!"
