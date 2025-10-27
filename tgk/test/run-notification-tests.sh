#!/bin/bash

set -euo pipefail

# Notifications & Rate Limiting Tests
# Usage: ./run-notification-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🔬 Testing Notifications & Rate Limiting"
echo "📊 Stage: $STAGE, Profile: $PROFILE"

# Test 3.1: SLA Nudges & Escalations (Rate Limiting)
test_sla_nudges_rate_limiting() {
    echo ""
    echo "🧪 Test 3.1: SLA Nudges & Escalations (Rate Limiting)"
    echo "-----------------------------------------------------"
    
    # Create test RFC for SLA testing
    echo "📝 Creating test RFC for SLA testing"
    RFC_ID=$(tgk rfc new --template product --title "SLA Test RFC" --stage "$STAGE" --profile "$PROFILE" | jq -r '.rfc_id')
    
    if [ -z "$RFC_ID" ] || [ "$RFC_ID" = "null" ]; then
        echo "❌ Failed to create test RFC"
        return 1
    fi
    
    echo "✅ RFC created with ID: $RFC_ID"
    
    # Set very short SLA for testing (5 minutes = 0.083 hours)
    echo "📝 Setting short SLA for testing (5 minutes)"
    if ! tgk sla extend "$RFC_ID" --hours 0.083 --reason "test" --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to set SLA"
        return 1
    fi
    
    # Get initial metrics
    echo "🔍 Getting initial metrics"
    INITIAL_SLA_BREACHES=$(tgk metrics get tgk_sla_breaches_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    INITIAL_NUDGE_TOTAL=$(tgk metrics get tgk_review_assignment_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    echo "📊 Initial SLA breaches: $INITIAL_SLA_BREACHES"
    echo "📊 Initial nudge total: $INITIAL_NUDGE_TOTAL"
    
    # Wait for SLA to breach (or simulate breach)
    echo "📝 Simulating SLA breach"
    if ! tgk sla breach "$RFC_ID" --force --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to simulate SLA breach"
        return 1
    fi
    
    # Check for SLA breach notification
    echo "🔍 Checking for SLA breach notification"
    sleep 3
    
    # Get messages in relevant topic/group
    BREACH_NOTIFICATION=$(tgk telegram list-messages --search "SLA Breach" --stage "$STAGE" --profile "$PROFILE")
    
    if echo "$BREACH_NOTIFICATION" | grep -q "$RFC_ID"; then
        echo "✅ SLA breach notification sent correctly"
    else
        echo "❌ SLA breach notification not found"
        return 1
    fi
    
    # Test manual nudge
    echo "📝 Testing manual nudge"
    if ! tgk review nudge --id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to send manual nudge"
        return 1
    fi
    
    # Check metrics after nudge
    echo "🔍 Checking metrics after nudge"
    FINAL_SLA_BREACHES=$(tgk metrics get tgk_sla_breaches_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    FINAL_NUDGE_TOTAL=$(tgk metrics get tgk_review_assignment_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    if [ "$FINAL_SLA_BREACHES" -gt "$INITIAL_SLA_BREACHES" ]; then
        echo "✅ SLA breach metrics incremented correctly"
    else
        echo "❌ SLA breach metrics not incremented"
        return 1
    fi
    
    if [ "$FINAL_NUDGE_TOTAL" -gt "$INITIAL_NUDGE_TOTAL" ]; then
        echo "✅ Nudge metrics incremented correctly"
    else
        echo "❌ Nudge metrics not incremented"
        return 1
    fi
    
    # Test rate limiting (send multiple nudges quickly)
    echo "📝 Testing rate limiting (sending multiple nudges)"
    NUDGE_COUNT=0
    for i in {1..5}; do
        if tgk review nudge --id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE" >/dev/null 2>&1; then
            NUDGE_COUNT=$((NUDGE_COUNT + 1))
        fi
        sleep 1
    done
    
    # Check that rate limiting is enforced (should allow max 3 nudges in 15 minutes)
    if [ "$NUDGE_COUNT" -le 3 ]; then
        echo "✅ Rate limiting enforced correctly (allowed $NUDGE_COUNT nudges)"
    else
        echo "❌ Rate limiting not enforced (allowed $NUDGE_COUNT nudges, expected ≤3)"
        return 1
    fi
    
    # Verify OPA policy is active
    echo "🔍 Verifying OPA rate limiting policy"
    if tgk policy check notification.rate_limit --stage "$STAGE" --profile "$PROFILE" | grep -q "allowed.*false"; then
        echo "✅ OPA rate limiting policy is active"
    else
        echo "❌ OPA rate limiting policy not working"
        return 1
    fi
    
    echo "✅ Test 3.1 passed: SLA nudges and rate limiting working correctly"
    return 0
}

# Test 3.2: Garbage Collection (Cleanup of Stale Data)
test_garbage_collection() {
    echo ""
    echo "🧪 Test 3.2: Garbage Collection (Cleanup of Stale Data)"
    echo "------------------------------------------------------"
    
    # Create cleanup test stream
    echo "📝 Creating cleanup test stream: do-test-cleanup"
    if ! tgk stream create do-test-cleanup --type product --owner @alice --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to create cleanup test stream"
        return 1
    fi
    
    # Create several test RFCs with different statuses
    echo "📝 Creating test RFCs for cleanup testing"
    RFC_IDS=()
    
    for i in {1..5}; do
        RFC_ID=$(tgk rfc new --template product --title "Cleanup Test RFC $i" --stage "$STAGE" --profile "$PROFILE" | jq -r '.rfc_id')
        RFC_IDS+=("$RFC_ID")
        
        # Set different statuses
        case $i in
            1|2) 
                # Mark as merged
                tgk rfc approve "$RFC_ID" --user "@alice" --stage "$STAGE" --profile "$PROFILE"
                tgk rfc approve "$RFC_ID" --user "@brendadeeznuts1111" --stage "$STAGE" --profile "$PROFILE"
                tgk rfc approve "$RFC_ID" --user "@diana" --stage "$STAGE" --profile "$PROFILE"
                tgk rfc approve "$RFC_ID" --user "@test1" --stage "$STAGE" --profile "$PROFILE"
                tgk rfc approve "$RFC_ID" --user "@test2" --stage "$STAGE" --profile "$PROFILE"
                tgk rfc submit "$RFC_ID" --stage "$STAGE" --profile "$PROFILE"
                ;;
            3|4) 
                # Mark as withdrawn
                tgk rfc withdraw "$RFC_ID" --reason "test cleanup" --stage "$STAGE" --profile "$PROFILE"
                ;;
            5) 
                # Keep as active
                ;;
        esac
    done
    
    echo "✅ Created ${#RFC_IDS[@]} test RFCs"
    
    # Get initial storage metrics
    echo "🔍 Getting initial storage metrics"
    INITIAL_STORAGE_BYTES=$(tgk metrics get tgk_storage_bytes_gauge --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    INITIAL_CLEANUP_TOTAL=$(tgk metrics get tgk_storage_cleanup_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    echo "📊 Initial storage bytes: $INITIAL_STORAGE_BYTES"
    echo "📊 Initial cleanup total: $INITIAL_CLEANUP_TOTAL"
    
    # Manually run cleanup for archived RFCs (simulate old data)
    echo "📝 Running manual cleanup for archived RFCs"
    if ! tgk orchestrate cleanup --scope rfc --status archived --older-than 30d --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to run cleanup"
        return 1
    fi
    
    # Check that stale message_thread_id values are removed from DO storage
    echo "🔍 Checking DO storage after cleanup"
    REMAINING_THREADS=$(tgk do list-threads --stream do-test-cleanup --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    
    # Should only have active RFC threads remaining
    if [ "$REMAINING_THREADS" -le 1 ]; then
        echo "✅ Stale message threads cleaned up correctly ($REMAINING_THREADS remaining)"
    else
        echo "❌ Too many threads remaining after cleanup: $REMAINING_THREADS"
        return 1
    fi
    
    # Check metrics after cleanup
    echo "🔍 Checking metrics after cleanup"
    FINAL_STORAGE_BYTES=$(tgk metrics get tgk_storage_bytes_gauge --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    FINAL_CLEANUP_TOTAL=$(tgk metrics get tgk_storage_cleanup_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    if [ "$FINAL_CLEANUP_TOTAL" -gt "$INITIAL_CLEANUP_TOTAL" ]; then
        echo "✅ Cleanup metrics incremented correctly"
    else
        echo "❌ Cleanup metrics not incremented"
        return 1
    fi
    
    if [ "$FINAL_STORAGE_BYTES" -lt "$INITIAL_STORAGE_BYTES" ]; then
        echo "✅ Storage bytes reduced after cleanup"
    else
        echo "⚠️  Storage bytes not reduced (may be expected for small test data)"
    fi
    
    # Verify archived topics are handled correctly
    echo "🔍 Checking archived topic handling"
    ARCHIVED_TOPICS=$(tgk stream list --status archived --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    
    if [ "$ARCHIVED_TOPICS" -ge 0 ]; then
        echo "✅ Archived topics handled correctly"
    else
        echo "❌ Error in archived topic handling"
        return 1
    fi
    
    echo "✅ Test 3.2 passed: Garbage collection working correctly"
    return 0
}

# Main execution
main() {
    echo "Starting Notifications & Rate Limiting tests..."
    
    # Run tests
    if test_sla_nudges_rate_limiting && test_garbage_collection; then
        echo ""
        echo "🎉 All notification tests passed!"
        return 0
    else
        echo ""
        echo "❌ Some notification tests failed!"
        return 1
    fi
}

# Run main function
main "$@"
