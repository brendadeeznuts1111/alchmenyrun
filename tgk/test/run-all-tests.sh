#!/bin/bash

set -euo pipefail

# Comprehensive Test Runner for tgk RFC Lifecycle Orchestration
# Usage: ./run-all-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🧪 Starting Comprehensive tgk Test Suite"
echo "📊 Stage: $STAGE"
echo "👤 Profile: $PROFILE"
echo "=================================="

# Set environment variables
export TGK_STAGE=$STAGE
export TGK_PROFILE=$PROFILE

# Test results tracking
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test scenario
run_test() {
    local test_name="$1"
    local test_script="$2"
    
    echo ""
    echo "🔬 Running: $test_name"
    echo "----------------------------------------"
    
    TOTAL=$((TOTAL + 1))
    
    if bash "$test_script" --stage "$STAGE" --profile "$PROFILE"; then
        echo "✅ PASSED: $test_name"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAILED: $test_name"
        FAILED=$((FAILED + 1))
    fi
}

# Run all test categories
run_test "DO Thread Safety & State Persistence" "./run-do-tests.sh"
run_test "RFC Lifecycle & Templating" "./run-rfc-lifecycle-tests.sh"
run_test "Notifications & Rate Limiting" "./run-notification-tests.sh"
run_test "Garbage Collection & Cleanup" "./run-cleanup-tests.sh"
run_test "Observability & Auditing" "./run-observability-tests.sh"
run_test "Resource Usage & Cost Attribution" "./run-resource-tests.sh"

# Final results
echo ""
echo "=================================="
echo "🏁 Test Suite Complete"
echo "📊 Results: $PASSED/$TOTAL passed, $FAILED failed"
echo "=================================="

if [ $FAILED -eq 0 ]; then
    echo "🎉 All tests passed! System is production ready."
    exit 0
else
    echo "⚠️  Some tests failed. Review logs and fix issues."
    exit 1
fi
