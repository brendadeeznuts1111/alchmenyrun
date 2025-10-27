#!/bin/bash

set -euo pipefail

# DO Thread Safety & State Persistence Tests
# Usage: ./run-do-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🔬 Testing DO Thread Safety & State Persistence"
echo "📊 Stage: $STAGE, Profile: $PROFILE"

# Test 1.1: Concurrent Webhooks (DO Thread Safety)
test_concurrent_webhooks() {
    echo ""
    echo "🧪 Test 1.1: Concurrent Webhooks (DO Thread Safety)"
    echo "----------------------------------------------------"
    
    # Create test stream
    echo "📝 Creating test stream: do-test-concurrency"
    if ! tgk stream create do-test-concurrency --type sre --owner @alice --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to create test stream"
        return 1
    fi
    
    # Post initial RFC status card
    echo "📝 Posting initial RFC status card"
    if ! tgk pin post do-test-concurrency --template rfc-status --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to post initial status card"
        return 1
    fi
    
    # Get webhook URL
    WEBHOOK_URL="github-webhook.alchmenyrun.workers.dev/do-test-concurrency"
    
    # Trigger concurrent webhooks (simulate within 500ms)
    echo "📝 Triggering concurrent webhook events"
    
    # Prepare webhook payload
    cat > webhook_payload.json << EOF
{
  "action": "opened",
  "pull_request": {
    "number": 999,
    "title": "Test PR for Concurrent Webhooks",
    "body": "Test PR body",
    "head": {
      "ref": "test-branch"
    },
    "base": {
      "ref": "main"
    }
  },
  "repository": {
    "name": "alchmenyrun",
    "full_name": "brendadeeznuts1111/alchmenyrun"
  }
}
EOF
    
    # Send two concurrent requests
    (curl -X POST "https://$WEBHOOK_URL" -H "Content-Type: application/json" -d @webhook_payload.json &) &
    (curl -X POST "https://$WEBHOOK_URL" -H "Content-Type: application/json" -d @webhook.json &) &
    wait
    
    # Wait for processing
    sleep 5
    
    # Check pinned messages
    echo "🔍 Checking pinned messages in Telegram"
    PINNED_COUNT=$(tgk telegram list-pinned do-test-concurrency --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    
    if [ "$PINNED_COUNT" -eq 1 ]; then
        echo "✅ Only one message pinned (correct)"
    else
        echo "❌ Expected 1 pinned message, found $PINNED_COUNT"
        return 1
    fi
    
    # Check DO logs
    echo "🔍 Checking DO invocation logs"
    if tgk logs worker github-webhook --stage "$STAGE" --follow --count 10 | grep -q "DO invoked"; then
        echo "✅ DO invocations logged correctly"
    else
        echo "❌ DO invocations not found in logs"
        return 1
    fi
    
    echo "✅ Test 1.1 passed: Concurrent webhooks handled correctly"
    return 0
}

# Test 1.2: DO State Persistence (Across Worker Restarts/Deploys)
test_state_persistence() {
    echo ""
    echo "🧪 Test 1.2: DO State Persistence (Across Worker Restarts)"
    echo "----------------------------------------------------------"
    
    # Ensure we have a pinned message from previous test
    echo "🔍 Verifying initial pinned message exists"
    if ! tgk telegram list-pinned do-test-concurrency --stage "$STAGE" --profile "$PROFILE" | jq -e '.[0]'; then
        echo "❌ No pinned message found from previous test"
        return 1
    fi
    
    # Get current pinned message ID
    OLD_MESSAGE_ID=$(tgk telegram list-pinned do-test-concurrency --stage "$STAGE" --profile "$PROFILE" | jq -r '.[0].message_id')
    echo "📝 Current pinned message ID: $OLD_MESSAGE_ID"
    
    # Redeploy the github-webhook worker
    echo "📝 Redeploying github-webhook worker"
    if ! tgk cf worker deploy github-webhook --stage "$STAGE" --reason "DO_state_test" --profile "$PROFILE"; then
        echo "❌ Failed to deploy worker"
        return 1
    fi
    
    # Wait for deployment to complete
    sleep 10
    
    # Trigger a new webhook event with different content
    echo "📝 Triggering new webhook event after redeploy"
    cat > webhook_payload_new.json << EOF
{
  "action": "opened",
  "pull_request": {
    "number": 1000,
    "title": "Test PR After Redeploy - NEW CONTENT",
    "body": "Updated test PR body after worker redeploy",
    "head": {
      "ref": "test-branch-new"
    },
    "base": {
      "ref": "main"
    }
  },
  "repository": {
    "name": "alchmenyrun",
    "full_name": "brendadeeznuts1111/alchmenyrun"
  }
}
EOF
    
    curl -X POST "https://github-webhook.alchmenyrun.workers.dev/do-test-concurrency" \
         -H "Content-Type: application/json" \
         -d @webhook_payload_new.json
    
    # Wait for processing
    sleep 5
    
    # Check that new message is pinned
    echo "🔍 Checking new pinned message"
    NEW_MESSAGE_ID=$(tgk telegram list-pinned do-test-concurrency --stage "$STAGE" --profile "$PROFILE" | jq -r '.[0].message_id')
    
    if [ "$NEW_MESSAGE_ID" != "$OLD_MESSAGE_ID" ]; then
        echo "✅ New message pinned correctly after redeploy"
    else
        echo "❌ Same message still pinned - state may not have persisted correctly"
        return 1
    fi
    
    # Verify new message content
    echo "🔍 Verifying new message content"
    MESSAGE_CONTENT=$(tgk telegram get-message "$NEW_MESSAGE_ID" --stage "$STAGE" --profile "$PROFILE")
    
    if echo "$MESSAGE_CONTENT" | grep -q "NEW CONTENT"; then
        echo "✅ New message content is correct"
    else
        echo "❌ New message content doesn't match expected"
        return 1
    fi
    
    echo "✅ Test 1.2 passed: DO state persisted correctly across worker restarts"
    return 0
}

# Main execution
main() {
    echo "Starting DO Thread Safety & State Persistence tests..."
    
    # Run tests
    if test_concurrent_webhooks && test_state_persistence; then
        echo ""
        echo "🎉 All DO tests passed!"
        return 0
    else
        echo ""
        echo "❌ Some DO tests failed!"
        return 1
    fi
}

# Run main function
main "$@"
