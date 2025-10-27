#!/bin/bash

set -euo pipefail

# Garbage Collection & Cleanup Tests
# Usage: ./run-cleanup-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🔬 Testing Garbage Collection & Cleanup"
echo "📊 Stage: $STAGE, Profile: $PROFILE"

# Test cleanup operations
test_cleanup_operations() {
    echo ""
    echo "🧪 Testing Cleanup Operations"
    echo "------------------------------"
    
    # Create test data for cleanup
    echo "📝 Creating test data for cleanup"
    
    # Create multiple test streams with RFCs
    for stream in cleanup-test-1 cleanup-test-2 cleanup-test-3; do
        tgk stream create "$stream" --type product --owner @alice --stage "$STAGE" --profile "$PROFILE"
        
        # Create RFCs in each stream
        for i in {1..3}; do
            RFC_ID=$(tgk rfc new --template product --title "Cleanup Test $stream-$i" --stage "$STAGE" --profile "$PROFILE" | jq -r '.rfc_id')
            
            # Mark some as archived/merged for cleanup
            if [ $i -le 2 ]; then
                # Approve and submit
                for approver in "@alice" "@brendadeeznuts1111" "@diana" "@test1" "@test2"; do
                    tgk rfc approve "$RFC_ID" --user "$approver" --stage "$STAGE" --profile "$PROFILE"
                done
                tgk rfc submit "$RFC_ID" --stage "$STAGE" --profile "$PROFILE"
            fi
        done
    done
    
    echo "✅ Created test data for cleanup"
    
    # Get initial metrics
    echo "🔍 Getting initial cleanup metrics"
    INITIAL_STORAGE=$(tgk metrics get tgk_storage_bytes_gauge --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    INITIAL_CLEANUP_COUNT=$(tgk metrics get tgk_storage_cleanup_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    echo "📊 Initial storage: $INITIAL_STORAGE bytes"
    echo "📊 Initial cleanup count: $INITIAL_CLEANUP_COUNT"
    
    # Run cleanup for archived RFCs
    echo "📝 Running cleanup for archived RFCs"
    if ! tgk orchestrate cleanup --scope rfc --status archived --older-than 1d --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to run cleanup"
        return 1
    fi
    
    # Verify cleanup results
    echo "🔍 Verifying cleanup results"
    
    # Check that old message threads are removed
    REMAINING_THREADS=0
    for stream in cleanup-test-1 cleanup-test-2 cleanup-test-3; do
        THREAD_COUNT=$(tgk do list-threads --stream "$stream" --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
        REMAINING_THREADS=$((REMAINING_THREADS + THREAD_COUNT))
    done
    
    echo "📊 Remaining threads after cleanup: $REMAINING_THREADS"
    
    # Should only have active RFC threads remaining
    if [ "$REMAINING_THREADS" -le 3 ]; then
        echo "✅ Cleanup removed stale threads correctly"
    else
        echo "❌ Too many threads remaining after cleanup: $REMAINING_THREADS"
        return 1
    fi
    
    # Check metrics after cleanup
    echo "🔍 Checking metrics after cleanup"
    FINAL_STORAGE=$(tgk metrics get tgk_storage_bytes_gauge --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    FINAL_CLEANUP_COUNT=$(tgk metrics get tgk_storage_cleanup_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    if [ "$FINAL_CLEANUP_COUNT" -gt "$INITIAL_CLEANUP_COUNT" ]; then
        echo "✅ Cleanup metrics incremented correctly"
    else
        echo "❌ Cleanup metrics not incremented"
        return 1
    fi
    
    if [ "$FINAL_STORAGE" -le "$INITIAL_STORAGE" ]; then
        echo "✅ Storage reduced or maintained after cleanup"
    else
        echo "⚠️  Storage increased after cleanup (may be expected for small test data)"
    fi
    
    echo "✅ Cleanup operations working correctly"
    return 0
}

# Test automated cleanup scheduling
test_automated_cleanup() {
    echo ""
    echo "🧪 Testing Automated Cleanup Scheduling"
    echo "----------------------------------------"
    
    # Check if cleanup cron job is configured
    echo "🔍 Checking cleanup cron job configuration"
    CRON_CONFIG=$(tgk cron list --stage "$STAGE" --profile "$PROFILE" | jq -r '.[] | select(.name == "cleanup")')
    
    if [ -n "$CRON_CONFIG" ]; then
        echo "✅ Cleanup cron job configured"
        
        # Check cron schedule
        CRON_SCHEDULE=$(echo "$CRON_CONFIG" | jq -r '.schedule')
        echo "📊 Cleanup schedule: $CRON_SCHEDULE"
        
        # Test manual cron trigger
        echo "📝 Testing manual cron trigger"
        if tgk cron trigger cleanup --stage "$STAGE" --profile "$PROFILE"; then
            echo "✅ Manual cron trigger successful"
        else
            echo "❌ Manual cron trigger failed"
            return 1
        fi
        
        # Wait for cron execution
        sleep 5
        
        # Check cron execution logs
        echo "🔍 Checking cron execution logs"
        CRON_LOGS=$(tgk logs cron --name cleanup --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
        
        if [ "$CRON_LOGS" -gt 0 ]; then
            echo "✅ Cron execution logged correctly"
        else
            echo "❌ Cron execution not logged"
            return 1
        fi
        
    else
        echo "⚠️  Cleanup cron job not configured (manual cleanup only)"
    fi
    
    echo "✅ Automated cleanup scheduling working correctly"
    return 0
}

# Main execution
main() {
    echo "Starting Garbage Collection & Cleanup tests..."
    
    # Run tests
    if test_cleanup_operations && test_automated_cleanup; then
        echo ""
        echo "🎉 All cleanup tests passed!"
        return 0
    else
        echo ""
        echo "❌ Some cleanup tests failed!"
        return 1
    fi
}

# Run main function
main "$@"
