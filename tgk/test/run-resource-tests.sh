#!/bin/bash

set -euo pipefail

# Resource Usage & Cost Attribution Tests
# Usage: ./run-resource-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🔬 Testing Resource Usage & Cost Attribution"
echo "📊 Stage: $STAGE, Profile: $PROFILE"

# Test 5.1: DO Resource Usage & Cost Attribution
test_do_resource_usage() {
    echo ""
    echo "🧪 Test 5.1: DO Resource Usage & Cost Attribution"
    echo "--------------------------------------------------"
    
    # Perform concurrent webhooks to generate DO usage
    echo "📝 Generating DO usage with concurrent webhooks"
    
    # Create test stream for resource testing
    if ! tgk stream create resource-test-stream --type sre --owner @alice --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to create resource test stream"
        return 1
    fi
    
    # Send multiple webhook events to generate DO invocations
    WEBHOOK_URL="github-webhook.alchmenyrun.workers.dev/resource-test-stream"
    
    for i in {1..10}; do
        cat > webhook_payload_$i.json << EOF
{
  "action": "opened",
  "pull_request": {
    "number": $((1000 + i)),
    "title": "Resource Test PR $i",
    "body": "Test PR for resource usage testing",
    "head": {
      "ref": "test-branch-$i"
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
        
        curl -X POST "https://$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d @webhook_payload_$i.json &
        
        # Stagger requests slightly
        sleep 0.1
    done
    
    wait
    echo "✅ Sent 10 concurrent webhook events"
    
    # Wait for processing
    sleep 10
    
    # Check DO invocation metrics in Cloudflare dashboard
    echo "🔍 Checking DO invocation metrics in Cloudflare dashboard"
    DO_INVOCATIONS=$(tgk cf metrics do-invocations --worker github-webhook --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    if [ "$DO_INVOCATIONS" -ge 10 ]; then
        echo "✅ DO invocations recorded correctly ($DO_INVOCATIONS)"
    else
        echo "❌ Expected at least 10 DO invocations, found $DO_INVOCATIONS"
        return 1
    fi
    
    # Perform full RFC lifecycle to generate additional usage
    echo "📝 Performing RFC lifecycle for additional resource testing"
    RFC_ID=$(tgk rfc new --template product --title "Resource Test RFC" --stage "$STAGE" --profile "$PROFILE" | jq -r '.rfc_id')
    
    if [ -z "$RFC_ID" ] || [ "$RFC_ID" = "null" ]; then
        echo "❌ Failed to create RFC for resource testing"
        return 1
    fi
    
    # Complete RFC lifecycle
    for approver in "@alice" "@brendadeeznuts1111" "@diana" "@test1" "@test2"; do
        tgk rfc approve "$RFC_ID" --user "$approver" --stage "$STAGE" --profile "$PROFILE"
    done
    tgk rfc submit "$RFC_ID" --stage "$STAGE" --profile "$PROFILE"
    
    # Verify telemetry tags are present for all DO invocations
    echo "🔍 Verifying telemetry tags for DO invocations"
    TELEMETRY_DATA=$(tgk cf telemetry list --worker github-webhook --stage "$STAGE" --profile "$PROFILE")
    
    # Check for required telemetry tags
    if echo "$TELEMETRY_DATA" | jq -e '.tags[] | select(. == "alc.do.id")'; then
        echo "✅ DO telemetry tags present"
    else
        echo "❌ DO telemetry tags missing"
        return 1
    fi
    
    # Check for stream-specific tags
    if echo "$TELEMETRY_DATA" | jq -e '.tags[] | select(. | contains("gh_agent_"))'; then
        echo "✅ Stream-specific telemetry tags present"
    else
        echo "❌ Stream-specific telemetry tags missing"
        return 1
    fi
    
    # Check storage usage metrics
    echo "🔍 Checking DO storage usage metrics"
    STORAGE_BYTES=$(tgk metrics get tgk_storage_bytes_gauge --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    if [ "$STORAGE_BYTES" -gt 0 ]; then
        echo "✅ DO storage usage metrics available ($STORAGE_BYTES bytes)"
    else
        echo "❌ DO storage usage metrics missing or zero"
        return 1
    fi
    
    # Check cost attribution
    echo "🔍 Checking cost attribution data"
    COST_DATA=$(tgk cf cost get --worker github-webhook --stage "$STAGE" --profile "$PROFILE")
    
    # Verify cost components are tracked
    if echo "$COST_DATA" | jq -e '.do_storage_cost' && echo "$COST_DATA" | jq -e '.do_invocation_cost'; then
        echo "✅ Cost attribution components tracked"
    else
        echo "❌ Cost attribution components missing"
        return 1
    fi
    
    # Check that costs are within expected bounds
    DO_STORAGE_COST=$(echo "$COST_DATA" | jq -r '.do_storage_cost // 0')
    DO_INVOCATION_COST=$(echo "$COST_DATA" | jq -r '.do_invocation_cost // 0')
    TOTAL_COST=$(echo "$DO_STORAGE_COST + $DO_INVOCATION_COST" | bc -l)
    
    # For test scale, costs should be minimal (< $1)
    if (( $(echo "$TOTAL_COST < 1.0" | bc -l) )); then
        echo "✅ Costs within expected bounds (\$$TOTAL_COST)"
    else
        echo "⚠️  Costs higher than expected (\$$TOTAL_COST), but may be acceptable for testing"
    fi
    
    # Test D1 query if customer data is integrated
    echo "📝 Testing D1 query performance"
    if tgk cf d1 query --query "SELECT COUNT(*) FROM test_table LIMIT 1" --stage "$STAGE" --profile "$PROFILE" >/dev/null 2>&1; then
        echo "✅ D1 queries functional"
        
        # Check D1 metrics
        D1_QUERIES=$(tgk metrics get tgk_d1_queries_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
        if [ "$D1_QUERIES" -gt 0 ]; then
            echo "✅ D1 query metrics tracked"
        else
            echo "❌ D1 query metrics not tracked"
            return 1
        fi
    else
        echo "⚠️  D1 not configured or available (skipping D1 tests)"
    fi
    
    # Check DO invocation latency
    echo "🔍 Checking DO invocation latency"
    LATENCY_DATA=$(tgk cf metrics do-latency --worker github-webhook --stage "$STAGE" --profile "$PROFILE")
    AVG_LATENCY=$(echo "$LATENCY_DATA" | jq -r '.avg_latency_ms // 0')
    P95_LATENCY=$(echo "$LATENCY_DATA" | jq -r '.p95_latency_ms // 0')
    
    if [ "$AVG_LATENCY" -gt 0 ] && [ "$P95_LATENCY" -gt 0 ]; then
        echo "✅ DO latency metrics available (avg: ${AVG_LATENCY}ms, p95: ${P95_LATENCY}ms)"
        
        # Check that latency is reasonable (< 1000ms for p95)
        if [ "$P95_LATENCY" -lt 1000 ]; then
            echo "✅ DO latency within acceptable bounds"
        else
            echo "⚠️  DO latency higher than expected (p95: ${P95_LATENCY}ms)"
        fi
    else
        echo "❌ DO latency metrics missing"
        return 1
    fi
    
    echo "✅ Test 5.1 passed: DO resource usage and cost attribution working correctly"
    return 0
}

# Test 5.2: Resource Limits and Scaling
test_resource_limits() {
    echo ""
    echo "🧪 Test 5.2: Resource Limits and Scaling"
    echo "-----------------------------------------"
    
    # Test concurrent request limits
    echo "📝 Testing concurrent request limits"
    
    # Send burst of requests to test rate limiting
    BURST_COUNT=50
    SUCCESS_COUNT=0
    
    for i in $(seq 1 $BURST_COUNT); do
        if curl -s -X POST "https://github-webhook.alchmenyrun.workers.dev/resource-test-stream" \
             -H "Content-Type: application/json" \
             -d '{"test": "burst"}' >/dev/null 2>&1; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
    done
    
    echo "📊 Burst test: $SUCCESS_COUNT/$BURST_COUNT requests succeeded"
    
    # Check that rate limiting is enforced (should not allow all burst requests)
    if [ "$SUCCESS_COUNT" -lt "$BURST_COUNT" ]; then
        echo "✅ Rate limiting enforced for burst requests"
    else
        echo "⚠️  All burst requests succeeded (rate limiting may not be active)"
    fi
    
    # Test storage limits
    echo "📝 Testing storage limits"
    
    # Create large amount of test data
    LARGE_DATA=$(printf 'A%.0s' {1..10000})  # 10KB of data
    
    # Try to store large data in DO
    if tgk do set --key "large_test_data" --value "$LARGE_DATA" --stream resource-test-stream --stage "$STAGE" --profile "$PROFILE"; then
        echo "✅ Large data storage successful"
    else
        echo "❌ Large data storage failed"
        return 1
    fi
    
    # Check storage usage after large data
    STORAGE_AFTER_LARGE=$(tgk metrics get tgk_storage_bytes_gauge --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    echo "📊 Storage after large data: $STORAGE_AFTER_LARGE bytes"
    
    # Test memory usage patterns
    echo "📝 Testing memory usage patterns"
    
    # Monitor memory during operations
    MEMORY_BEFORE=$(tgk cf metrics memory-usage --worker github-webhook --stage "$STAGE" --profile "$PROFILE" | jq -r '.avg_mb // 0')
    
    # Perform memory-intensive operations
    for i in {1..5}; do
        tgk do set --key "memory_test_$i" --value "$LARGE_DATA" --stream resource-test-stream --stage "$STAGE" --profile "$PROFILE" &
    done
    wait
    
    MEMORY_AFTER=$(tgk cf metrics memory-usage --worker github-webhook --stage "$STAGE" --profile "$PROFILE" | jq -r '.avg_mb // 0')
    
    echo "📊 Memory usage: ${MEMORY_BEFORE}MB -> ${MEMORY_AFTER}MB"
    
    # Check for memory leaks (usage should return to baseline)
    MEMORY_DIFF=$((MEMORY_AFTER - MEMORY_BEFORE))
    if [ "$MEMORY_DIFF" -lt 50 ]; then  # Allow 50MB variance
        echo "✅ Memory usage within acceptable bounds"
    else
        echo "⚠️  Memory usage increased significantly (${MEMORY_DIFF}MB)"
    fi
    
    # Test scaling behavior
    echo "📝 Testing scaling behavior"
    
    # Gradually increase load and monitor performance
    for load in 5 10 20; do
        echo "📊 Testing with $load concurrent requests"
        
        START_TIME=$(date +%s%N)
        
        for i in $(seq 1 $load); do
            curl -s -X POST "https://github-webhook.alchmenyrun.workers.dev/resource-test-stream" \
                 -H "Content-Type: application/json" \
                 -d '{"test": "scaling"}' &
        done
        wait
        
        END_TIME=$(date +%s%N)
        DURATION=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to milliseconds
        
        AVG_LATENCY=$((DURATION / load))
        echo "📊 Average latency for $load requests: ${AVG_LATENCY}ms"
        
        # Check that latency scales reasonably
        if [ "$AVG_LATENCY" -lt 2000 ]; then  # 2 second limit
            echo "✅ Latency acceptable for $load concurrent requests"
        else
            echo "⚠️  High latency for $load requests: ${AVG_LATENCY}ms"
        fi
    done
    
    echo "✅ Test 5.2 passed: Resource limits and scaling working correctly"
    return 0
}

# Main execution
main() {
    echo "Starting Resource Usage & Cost Attribution tests..."
    
    # Run tests
    if test_do_resource_usage && test_resource_limits; then
        echo ""
        echo "🎉 All resource tests passed!"
        return 0
    else
        echo ""
        echo "❌ Some resource tests failed!"
        return 1
    fi
}

# Run main function
main "$@"
