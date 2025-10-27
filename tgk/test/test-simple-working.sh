#!/bin/bash

# Simple Working tgk Test Suite
# Tests the actual tgk CLI that exists

set -euo pipefail

echo "🧪 Simple Working tgk Test Suite"
echo "📊 Testing actual available commands"
echo "=================================="

PASSED=0
FAILED=0
TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    echo "🔬 Running: $test_name"
    echo "----------------------------------------"
    
    TOTAL=$((TOTAL + 1))
    
    if eval "$test_command"; then
        echo "✅ PASSED: $test_name"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAILED: $test_name"
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: CLI Basic Functionality
test_cli_basic() {
    echo "📝 Testing CLI basic functionality..."
    
    # Test that CLI shows help
    if ./scripts/tgk 2>&1 | grep -q "tgk - Telegram Infrastructure-as-Code CLI Toolkit"; then
        echo "✅ CLI help displays correctly"
        return 0
    else
        echo "❌ CLI help not working"
        return 1
    fi
}

# Test 2: Available Commands
test_available_commands() {
    echo "📝 Testing available commands..."
    
    # Check for key commands
    local commands=("chat-list" "group-create" "pin-card" "worker")
    for cmd in "${commands[@]}"; do
        if ./scripts/tgk 2>&1 | grep -q "$cmd"; then
            echo "✅ Found command: $cmd"
        else
            echo "❌ Missing command: $cmd"
            return 1
        fi
    done
    
    return 0
}

# Test 3: Worker Command Structure
test_worker_command() {
    echo "📝 Testing worker command structure..."
    
    # Test worker help
    if ./scripts/tgk worker 2>&1 | grep -q "❌ Unknown worker command"; then
        echo "✅ Worker error handling works"
    else
        echo "⚠️  Worker error handling may differ"
    fi
    
    # Test worker deploy help
    if ./scripts/tgk worker deploy 2>&1 | grep -q "Usage: tgk worker deploy <stream_name>"; then
        echo "✅ Worker deploy shows proper usage"
        return 0
    else
        echo "❌ Worker deploy usage not working"
        return 1
    fi
}

# Test 4: Worker Deploy Functionality
test_worker_deploy() {
    echo "📝 Testing worker deploy functionality..."
    
    # Test with a sample stream
    local result
    result=$(./scripts/tgk worker deploy test-stream --json 2>&1)
    
    if echo "$result" | grep -q '"status":"deployed"'; then
        echo "✅ Worker deploy works correctly"
        echo "🌐 Worker URL: $(echo "$result" | jq -r '.worker_url')"
        return 0
    else
        echo "❌ Worker deploy failed"
        echo "Output: $result"
        return 1
    fi
}

# Test 5: Error Handling
test_error_handling() {
    echo "📝 Testing error handling..."
    
    # Test invalid command (should show help, not crash)
    if ./scripts/tgk invalid-command 2>&1 | grep -q "Usage:"; then
        echo "✅ Invalid command shows help (good error handling)"
        return 0
    else
        echo "❌ Invalid command handling failed"
        return 1
    fi
}

# Test 6: Command Arguments
test_command_arguments() {
    echo "📝 Testing command argument handling..."
    
    # Test worker deploy without args
    if ./scripts/tgk worker deploy 2>&1 | grep -q "Usage:"; then
        echo "✅ Missing arguments handled correctly"
        return 0
    else
        echo "❌ Missing arguments not handled"
        return 1
    fi
}

# Main execution
main() {
    echo "Starting simple tgk test suite..."
    
    # Check if we're in the right directory
    if [ ! -f "./scripts/tgk" ]; then
        echo "❌ Error: Must be run from repository root"
        exit 1
    fi
    
    # Make script executable
    chmod +x ./scripts/tgk
    
    # Run tests
    run_test "CLI Basic Functionality" "test_cli_basic"
    run_test "Available Commands" "test_available_commands"
    run_test "Worker Command Structure" "test_worker_command"
    run_test "Worker Deploy Functionality" "test_worker_deploy"
    run_test "Error Handling" "test_error_handling"
    run_test "Command Arguments" "test_command_arguments"
    
    # Results
    echo ""
    echo "=================================="
    echo "🏁 Test Suite Complete"
    echo "📊 Results: $PASSED/$TOTAL passed, $FAILED failed"
    echo "=================================="
    
    if [ $FAILED -eq 0 ]; then
        echo "🎉 All tests passed!"
        echo ""
        echo "📋 What was validated:"
        echo "✅ tgk CLI is functional"
        echo "✅ Core commands are available"
        echo "✅ Worker deployment works"
        echo "✅ Error handling is proper"
        echo "✅ Command structure is correct"
        echo ""
        echo "🚀 The tgk CLI is ready for Telegram infrastructure management!"
        exit 0
    else
        echo "⚠️  Some tests failed"
        exit 1
    fi
}

main "$@"
