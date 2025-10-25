#!/usr/bin/env bash
# Test GitHub webhook endpoint

set -e

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <webhook-url>"
  echo "Example: $0 https://website-prod.your-account.workers.dev/api/github/webhook"
  exit 1
fi

WEBHOOK_URL="$1"

echo "Testing GitHub webhook endpoint: $WEBHOOK_URL"
echo ""

# Test push event
echo "1. Testing push event..."
PUSH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-push-$(date +%s)" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "full_name": "test-user/test-repo",
      "name": "test-repo"
    },
    "head_commit": {
      "id": "abc123def456",
      "message": "Test commit",
      "timestamp": "2025-10-25T12:00:00Z"
    }
  }')

PUSH_BODY=$(echo "$PUSH_RESPONSE" | sed '$d')
PUSH_CODE=$(echo "$PUSH_RESPONSE" | tail -n1)

echo "Response code: $PUSH_CODE"
echo "Response body: $PUSH_BODY"
echo ""

if [ "$PUSH_CODE" = "200" ]; then
  echo "✅ Push event test passed"
else
  echo "❌ Push event test failed"
fi
echo ""

# Test pull request event
echo "2. Testing pull_request event..."
PR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: test-pr-$(date +%s)" \
  -d '{
    "action": "opened",
    "pull_request": {
      "number": 42,
      "title": "Test PR",
      "head": {
        "ref": "feature-branch"
      }
    },
    "repository": {
      "full_name": "test-user/test-repo",
      "name": "test-repo"
    }
  }')

PR_BODY=$(echo "$PR_RESPONSE" | sed '$d')
PR_CODE=$(echo "$PR_RESPONSE" | tail -n1)

echo "Response code: $PR_CODE"
echo "Response body: $PR_BODY"
echo ""

if [ "$PR_CODE" = "200" ]; then
  echo "✅ Pull request event test passed"
else
  echo "❌ Pull request event test failed"
fi
echo ""

# Summary
echo "=== Test Summary ==="
if [ "$PUSH_CODE" = "200" ] && [ "$PR_CODE" = "200" ]; then
  echo "✅ All webhook tests passed!"
  exit 0
else
  echo "❌ Some webhook tests failed"
  exit 1
fi

