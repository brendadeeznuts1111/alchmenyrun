#!/bin/bash

set -euo pipefail

# Cleanup Test Environment Script
# Usage: ./cleanup-test-environment.sh [--stage test-do-006]

STAGE=${1:-test-do-006}

echo "🧹 Cleaning up tgk Test Environment"
echo "📊 Stage: $STAGE"
echo "=================================="

# Function to cleanup test streams
cleanup_test_streams() {
    echo ""
    echo "🧹 Cleaning up test streams..."
    
    # List all test streams
    TEST_STREAMS=$(tgk stream list --stage "$STAGE" | jq -r '.[] | select(.name | contains("test") or contains("cleanup") or contains("do-test")) | .name')
    
    if [ -z "$TEST_STREAMS" ]; then
        echo "✅ No test streams found to cleanup"
        return 0
    fi
    
    echo "📝 Found test streams to cleanup:"
    echo "$TEST_STREAMS"
    
    # Delete each test stream
    for stream in $TEST_STREAMS; do
        echo "🗑️  Deleting stream: $stream"
        if tgk stream delete "$stream" --force --stage "$STAGE"; then
            echo "✅ Deleted stream: $stream"
        else
            echo "❌ Failed to delete stream: $stream"
        fi
    done
    
    echo "✅ Test streams cleanup complete"
}

# Function to cleanup test RFCs
cleanup_test_rfcs() {
    echo ""
    echo "🧹 Cleaning up test RFCs..."
    
    # List all test RFCs
    TEST_RFCS=$(tgk rfc list --stage "$STAGE" | jq -r '.[] | select(.title | contains("Test") or contains("test") or contains("Cleanup")) | .id')
    
    if [ -z "$TEST_RFCS" ]; then
        echo "✅ No test RFCs found to cleanup"
        return 0
    fi
    
    echo "📝 Found test RFCs to cleanup:"
    echo "$TEST_RFCS"
    
    # Delete each test RFC
    for rfc in $TEST_RFCS; do
        echo "🗑️  Deleting RFC: $rfc"
        if tgk rfc delete "$rfc" --force --stage "$STAGE"; then
            echo "✅ Deleted RFC: $rfc"
        else
            echo "❌ Failed to delete RFC: $rfc"
        fi
    done
    
    echo "✅ Test RFCs cleanup complete"
}

# Function to cleanup DO storage
cleanup_do_storage() {
    echo ""
    echo "🧹 Cleaning up DO storage..."
    
    # List all DO storage entries
    STORAGE_ENTRIES=$(tgk do list --stage "$STAGE" | jq -r '.[] | select(.key | contains("test") or contains("cleanup") or contains("memory_test")) | .key')
    
    if [ -z "$STORAGE_ENTRIES" ]; then
        echo "✅ No test storage entries found to cleanup"
        return 0
    fi
    
    echo "📝 Found test storage entries to cleanup:"
    echo "$STORAGE_ENTRIES"
    
    # Delete each storage entry
    for key in $STORAGE_ENTRIES; do
        echo "🗑️  Deleting storage entry: $key"
        if tgk do delete --key "$key" --stage "$STAGE"; then
            echo "✅ Deleted storage entry: $key"
        else
            echo "❌ Failed to delete storage entry: $key"
        fi
    done
    
    echo "✅ DO storage cleanup complete"
}

# Function to cleanup Telegram messages
cleanup_telegram_messages() {
    echo ""
    echo "🧹 Cleaning up Telegram test messages..."
    
    # Get list of test topics/streams
    TEST_TOPICS=$(tgk telegram list-topics --stage "$STAGE" | jq -r '.[] | select(.name | contains("test") or contains("cleanup") or contains("do-test")) | .id')
    
    if [ -z "$TEST_TOPICS" ]; then
        echo "✅ No test topics found to cleanup"
        return 0
    fi
    
    # Clean up messages in each test topic
    for topic in $TEST_TOPICS; do
        echo "🗑️  Cleaning up messages in topic: $topic"
        
        # Get messages in topic
        MESSAGES=$(tgk telegram list-messages --topic "$topic" --stage "$STAGE" | jq -r '.[] | .message_id')
        
        if [ -z "$MESSAGES" ]; then
            echo "✅ No messages found in topic: $topic"
            continue
        fi
        
        # Delete messages
        for message_id in $MESSAGES; do
            if tgk telegram delete-message "$message_id" --topic "$topic" --stage "$STAGE"; then
                echo "✅ Deleted message: $message_id"
            else
                echo "❌ Failed to delete message: $message_id"
            fi
        done
    done
    
    echo "✅ Telegram messages cleanup complete"
}

# Function to cleanup metrics
cleanup_metrics() {
    echo ""
    echo "🧹 Cleaning up test metrics..."
    
    # Reset test-specific metrics
    TEST_METRICS=(
        "tgk_storage_cleanup_total"
        "tgk_sla_breaches_total"
        "tgk_review_assignment_total"
        "tgk_orchestration_actions_total"
    )
    
    for metric in "${TEST_METRICS[@]}"; do
        echo "🗑️  Resetting metric: $metric"
        if tgk metrics reset "$metric" --stage "$STAGE"; then
            echo "✅ Reset metric: $metric"
        else
            echo "❌ Failed to reset metric: $metric"
        fi
    done
    
    echo "✅ Test metrics cleanup complete"
}

# Function to cleanup temporary files
cleanup_temp_files() {
    echo ""
    echo "🧹 Cleaning up temporary files..."
    
    # Remove webhook payload files
    if ls webhook_*.json >/dev/null 2>&1; then
        echo "🗑️  Removing webhook payload files"
        rm -f webhook_*.json
        echo "✅ Removed webhook payload files"
    fi
    
    # Remove rendered message files
    if ls rendered_message.txt >/dev/null 2>&1; then
        echo "🗑️  Removing rendered message files"
        rm -f rendered_message.txt
        echo "✅ Removed rendered message files"
    fi
    
    # Remove test logs
    if ls test_*.log >/dev/null 2>&1; then
        echo "🗑️  Removing test log files"
        rm -f test_*.log
        echo "✅ Removed test log files"
    fi
    
    echo "✅ Temporary files cleanup complete"
}

# Function to verify cleanup
verify_cleanup() {
    echo ""
    echo "🔍 Verifying cleanup completion..."
    
    # Check for remaining test streams
    REMAINING_STREAMS=$(tgk stream list --stage "$STAGE" | jq -r '.[] | select(.name | contains("test") or contains("cleanup") or contains("do-test")) | .name' | wc -l)
    
    # Check for remaining test RFCs
    REMAINING_RFCS=$(tgk rfc list --stage "$STAGE" | jq -r '.[] | select(.title | contains("Test") or contains("test") or contains("Cleanup")) | .id' | wc -l)
    
    # Check for remaining test storage
    REMAINING_STORAGE=$(tgk do list --stage "$STAGE" | jq -r '.[] | select(.key | contains("test") or contains("cleanup") or contains("memory_test")) | .key' | wc -l)
    
    echo "📊 Cleanup verification results:"
    echo "   Remaining test streams: $REMAINING_STREAMS"
    echo "   Remaining test RFCs: $REMAINING_RFCS"
    echo "   Remaining test storage entries: $REMAINING_STORAGE"
    
    if [ "$REMAINING_STREAMS" -eq 0 ] && [ "$REMAINING_RFCS" -eq 0 ] && [ "$REMAINING_STORAGE" -eq 0 ]; then
        echo "✅ Cleanup verification passed - all test data removed"
        return 0
    else
        echo "⚠️  Some test data remains - manual cleanup may be required"
        return 1
    fi
}

# Main execution
main() {
    echo "Starting test environment cleanup..."
    
    # Run cleanup operations
    cleanup_test_streams
    cleanup_test_rfcs
    cleanup_do_storage
    cleanup_telegram_messages
    cleanup_metrics
    cleanup_temp_files
    
    # Verify cleanup
    if verify_cleanup; then
        echo ""
        echo "🎉 Test environment cleanup completed successfully!"
        echo "📊 Environment is ready for fresh testing"
    else
        echo ""
        echo "⚠️  Cleanup completed with some remaining data"
        echo "📊 Review remaining items and clean manually if needed"
    fi
    
    echo "=================================="
}

# Run main function
main "$@"
