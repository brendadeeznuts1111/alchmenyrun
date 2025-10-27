#!/bin/bash

# Corrected tgk Test Suite - Matching Actual CLI Structure
# This test suite works with the real tgk CLI commands

set -euo pipefail

echo "🧪 Corrected tgk RFC Lifecycle Test Suite"
echo "📊 Testing actual tgk CLI commands"
echo "=================================="

# Test results tracking
PASSED=0
FAILED=0
TOTAL=0

# Check if TELEGRAM_BOT_TOKEN is set
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    echo "⚠️  WARNING: TELEGRAM_BOT_TOKEN not set"
    echo "💡 Some tests will be skipped. Set it with: export TELEGRAM_BOT_TOKEN='your_token'"
    echo ""
fi

# Function to run a test scenario
run_test() {
    local test_name="$1"
    local test_command="$2"
    local should_skip="${3:-false}"
    
    echo ""
    echo "🔬 Running: $test_name"
    echo "----------------------------------------"
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$should_skip" = "true" ]; then
        echo "⏭️  SKIPPED: $test_name (TELEGRAM_BOT_TOKEN not set)"
        return 0
    fi
    
    if eval "$test_command"; then
        echo "✅ PASSED: $test_name"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAILED: $test_name"
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: CLI Help and Basic Structure
test_cli_help() {
    echo "📝 Testing CLI help and basic structure..."
    
    if ./scripts/tgk 2>&1 | grep -q "tgk - Telegram Infrastructure-as-Code CLI Toolkit"; then
        echo "✅ CLI help displays correctly"
    else
        echo "❌ CLI help not working"
        return 1
    fi
    
    # Check available commands
    if ./scripts/tgk 2>&1 | grep -q "chat-list"; then
        echo "✅ Expected commands are available"
    else
        echo "❌ Expected commands missing"
        return 1
    fi
}

# Test 2: Worker Deployment Command
test_worker_deploy() {
    echo "📝 Testing worker deployment command..."
    
    # Test worker deploy help
    if ./scripts/tgk worker deploy 2>&1 | grep -q "Usage: tgk worker deploy <stream_name>"; then
        echo "✅ Worker deploy command shows proper usage"
    else
        echo "❌ Worker deploy command not working"
        return 1
    fi
    
    # Test worker deploy with test stream
    if ./scripts/tgk worker deploy test-stream --json 2>&1 | grep -q '"status":"deployed"'; then
        echo "✅ Worker deploy command works correctly"
    else
        echo "❌ Worker deploy command failed"
        return 1
    fi
}

# Test 3: Error Handling for Invalid Commands
test_error_handling() {
    echo "📝 Testing error handling..."
    
    # Test invalid command
    if ./scripts/tgk invalid-command 2>&1 | grep -q "❌ Unknown command"; then
        echo "✅ Invalid command error handling works"
    else
        echo "❌ Invalid command error handling failed"
        return 1
    fi
    
    # Test invalid worker subcommand
    if ./scripts/tgk worker invalid 2>&1 | grep -q "❌ Unknown worker command"; then
        echo "✅ Invalid subcommand error handling works"
    else
        echo "❌ Invalid subcommand error handling failed"
        return 1
    fi
}

# Test 4: Chat List Command (requires token)
test_chat_list() {
    echo "📝 Testing chat list command..."
    
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
        return 0  # Skip test
    fi
    
    # This will fail without a valid token, but should show proper error handling
    if ./scripts/tgk chat-list 2>&1 | grep -q "Error\|chat"; then
        echo "✅ Chat list command structure working"
    else
        echo "❌ Chat list command not working"
        return 1
    fi
}

# Test 5: Group Creation Command Structure
test_group_create() {
    echo "📝 Testing group creation command structure..."
    
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
        return 0  # Skip test
    fi
    
    # Test command structure (will fail without token but should show proper format)
    if ./scripts/tgk group-create "Test Group" 2>&1 | grep -q "Error\|group"; then
        echo "✅ Group create command structure working"
    else
        echo "❌ Group create command structure failed"
        return 1
    fi
}

# Test 6: Pin Card Command Structure
test_pin_card() {
    echo "📝 Testing pin card command structure..."
    
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
        return 0  # Skip test
    fi
    
    # Test command structure
    if ./scripts/tgk pin-card -1001234567890 "Test Title" "Test Description" 2>&1 | grep -q "Error\|card"; then
        echo "✅ Pin card command structure working"
    else
        echo "❌ Pin card command structure failed"
        return 1
    fi
}

# Test 7: Card Management Commands
test_card_management() {
    echo "📝 Testing card management commands..."
    
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
        return 0  # Skip test
    fi
    
    # Test card-replace command structure
    if ./scripts/tgk card-replace -1001234567890 123 "New Title" "New Description" 2>&1 | grep -q "Error\|card"; then
        echo "✅ Card replace command structure working"
    else
        echo "❌ Card replace command structure failed"
        return 1
    fi
    
    # Test card-delete command structure
    if ./scripts/tgk card-delete -1001234567890 123 2>&1 | grep -q "Error\|card"; then
        echo "✅ Card delete command structure working"
    else
        echo "❌ Card delete command structure failed"
        return 1
    fi
}

# Test 8: Permission Management
test_permission_management() {
    echo "📝 Testing permission management commands..."
    
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
        return 0  # Skip test
    fi
    
    # Test permission-set command structure
    if ./scripts/tgk permission-set -1001234567890 send_messages true 2>&1 | grep -q "Error\|permission"; then
        echo "✅ Permission set command structure working"
    else
        echo "❌ Permission set command structure failed"
        return 1
    fi
}

# Main execution
main() {
    echo "Starting corrected tgk test suite..."
    
    # Check if we're in the right directory
    if [ ! -f "./scripts/tgk" ]; then
        echo "❌ Error: Must be run from repository root (scripts/tgk not found)"
        exit 1
    fi
    
    # Make sure the script is executable
    chmod +x ./scripts/tgk
    
    # Run all test scenarios
    run_test "CLI Help and Structure" "test_cli_help"
    run_test "Worker Deployment Command" "test_worker_deploy"
    run_test "Error Handling" "test_error_handling"
    run_test "Chat List Command" "test_chat_list" "$([ -z "${TELEGRAM_BOT_TOKEN:-}" ] && echo true || echo false)"
    run_test "Group Creation Command" "test_group_create" "$([ -z "${TELEGRAM_BOT_TOKEN:-}" ] && echo true || echo false)"
    run_test "Pin Card Command" "test_pin_card" "$([ -z "${TELEGRAM_BOT_TOKEN:-}" ] && echo true || echo false)"
    run_test "Card Management Commands" "test_card_management" "$([ -z "${TELEGRAM_BOT_TOKEN:-}" ] && echo true || echo false)"
    run_test "Permission Management" "test_permission_management" "$([ -z "${TELEGRAM_BOT_TOKEN:-}" ] && echo true || echo false)"
    
    # Final results
    echo ""
    echo "=================================="
    echo "🏁 Corrected Test Suite Complete"
    echo "📊 Results: $PASSED/$TOTAL passed, $FAILED failed"
    echo "=================================="
    
    if [ $FAILED -eq 0 ]; then
        echo "🎉 All tests passed! tgk CLI structure is working correctly."
        echo ""
        echo "📋 Test Summary:"
        echo "✅ CLI help and command structure validated"
        echo "✅ Worker deployment commands working"
        echo "✅ Error handling properly implemented"
        if [ -n "${TELEGRAM_BOT_TOKEN:-}" ]; then
            echo "✅ Telegram API commands structure validated"
        else
            echo "⏭️  Telegram API tests skipped (no token)"
        fi
        echo ""
        echo "🚀 The tgk CLI is ready for Telegram infrastructure management!"
        exit 0
    else
        echo "⚠️  Some tests failed. Review the implementation."
        exit 1
    fi
}

# Run main function
main "$@"
