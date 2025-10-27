#!/bin/bash

set -euo pipefail

# Observability & Auditing Tests
# Usage: ./run-observability-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🔬 Testing Observability & Auditing"
echo "📊 Stage: $STAGE, Profile: $PROFILE"

# Test 4.1: End-to-End Audit Trail
test_audit_trail() {
    echo ""
    echo "🧪 Test 4.1: End-to-End Audit Trail"
    echo "------------------------------------"
    
    # Create test RFC for audit testing
    echo "📝 Creating test RFC for audit testing"
    RFC_ID=$(tgk rfc new --template product --title "Audit Test RFC" --stage "$STAGE" --profile "$PROFILE" | jq -r '.rfc_id')
    
    if [ -z "$RFC_ID" ] || [ "$RFC_ID" = "null" ]; then
        echo "❌ Failed to create test RFC"
        return 1
    fi
    
    echo "✅ RFC created with ID: $RFC_ID"
    
    # Perform full RFC lifecycle to generate audit events
    echo "📝 Performing RFC lifecycle to generate audit events"
    
    # Stream create
    tgk stream create audit-test-stream --type product --owner @alice --stage "$STAGE" --profile "$PROFILE"
    
    # RFC approvals
    tgk rfc approve "$RFC_ID" --user "@alice.smith" --stage "$STAGE" --profile "$PROFILE"
    tgk rfc approve "$RFC_ID" --user "@brendadeeznuts1111" --stage "$STAGE" --profile "$PROFILE"
    tgk rfc approve "$RFC_ID" --user "@diana.prince" --stage "$STAGE" --profile "$PROFILE"
    tgk rfc approve "$RFC_ID" --user "@test.user1" --stage "$STAGE" --profile "$PROFILE"
    tgk rfc approve "$RFC_ID" --user "@test.user2" --stage "$STAGE" --profile "$PROFILE"
    
    # RFC submit
    tgk rfc submit "$RFC_ID" --stage "$STAGE" --profile "$PROFILE"
    
    # Wait for audit logs to be processed
    sleep 5
    
    # Check that all commands are logged to Loki
    echo "🔍 Checking audit logs in Loki"
    
    # Test stream create audit
    STREAM_AUDIT=$(tgk audit log --action stream_create --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    if [ "$STREAM_AUDIT" -gt 0 ]; then
        echo "✅ Stream create actions logged"
    else
        echo "❌ Stream create actions not logged"
        return 1
    fi
    
    # Test RFC new audit
    RFC_NEW_AUDIT=$(tgk audit log --action rfc_new --rfc-id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    if [ "$RFC_NEW_AUDIT" -gt 0 ]; then
        echo "✅ RFC new actions logged"
    else
        echo "❌ RFC new actions not logged"
        return 1
    fi
    
    # Test RFC approve audits
    RFC_APPROVE_AUDIT=$(tgk audit log --action rfc_approve --rfc-id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    if [ "$RFC_APPROVE_AUDIT" -eq 5 ]; then
        echo "✅ All RFC approve actions logged (5)"
    else
        echo "❌ Expected 5 RFC approve actions, found $RFC_APPROVE_AUDIT"
        return 1
    fi
    
    # Test RFC submit audit
    RFC_SUBMIT_AUDIT=$(tgk audit log --action rfc_submit --rfc-id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    if [ "$RFC_SUBMIT_AUDIT" -gt 0 ]; then
        echo "✅ RFC submit actions logged"
    else
        echo "❌ RFC submit actions not logged"
        return 1
    fi
    
    # Verify audit log structure
    echo "🔍 Verifying audit log structure"
    SAMPLE_AUDIT=$(tgk audit log --action rfc_approve --rfc-id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE" | jq '.[0]')
    
    # Check required fields
    REQUIRED_FIELDS=("action_type" "user_id" "chat_id" "timestamp" "diff")
    for field in "${REQUIRED_FIELDS[@]}"; do
        if ! echo "$SAMPLE_AUDIT" | jq -e ".$field"; then
            echo "❌ Missing required field in audit log: $field"
            return 1
        fi
    done
    
    echo "✅ Audit log structure is correct"
    
    # Check DO invocation metrics in Cloudflare dashboard
    echo "🔍 Checking DO invocation metrics"
    DO_INVOCATIONS=$(tgk cf metrics do-invocations --worker github-webhook --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    
    if [ "$DO_INVOCATIONS" -gt 0 ]; then
        echo "✅ DO invocations recorded in metrics ($DO_INVOCATIONS)"
    else
        echo "❌ No DO invocations found in metrics"
        return 1
    fi
    
    # Verify telemetry tags
    echo "🔍 Verifying telemetry tags"
    TELEMETRY_TAGS=$(tgk cf telemetry list --worker github-webhook --stage "$STAGE" --profile "$PROFILE" | jq -r '.tags[]? // empty')
    
    if echo "$TELEMETRY_TAGS" | grep -q "alc.do.id"; then
        echo "✅ DO telemetry tags present"
    else
        echo "❌ DO telemetry tags missing"
        return 1
    fi
    
    # Check Grafana dashboard metrics (simulated)
    echo "🔍 Checking Grafana dashboard metrics"
    
    # RFC review duration metrics
    REVIEW_DURATION=$(tgk metrics get tgk_rfc_review_duration_seconds --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    if [ "$REVIEW_DURATION" -gt 0 ]; then
        echo "✅ RFC review duration metrics available"
    else
        echo "❌ RFC review duration metrics missing"
        return 1
    fi
    
    # Orchestration actions metrics
    ORCHESTRATION_ACTIONS=$(tgk metrics get tgk_orchestration_actions_total --stage "$STAGE" --profile "$PROFILE" | jq -r '.value // 0')
    if [ "$ORCHESTRATION_ACTIONS" -gt 0 ]; then
        echo "✅ Orchestration actions metrics available"
    else
        echo "❌ Orchestration actions metrics missing"
        return 1
    fi
    
    echo "✅ Test 4.1 passed: End-to-end audit trail working correctly"
    return 0
}

# Test 4.2: Dashboard Integration
test_dashboard_integration() {
    echo ""
    echo "🧪 Test 4.2: Dashboard Integration"
    echo "-----------------------------------"
    
    # Test Alchemist Comms Health dashboard
    echo "📝 Testing Alchemist Comms Health dashboard"
    
    # Get dashboard health metrics
    HEALTH_METRICS=$(tgk dashboard get alchemist-comms-health --stage "$STAGE" --profile "$PROFILE")
    
    # Check key health indicators
    if echo "$HEALTH_METRICS" | jq -e '.telegram_connectivity.status == "healthy"'; then
        echo "✅ Telegram connectivity healthy"
    else
        echo "❌ Telegram connectivity not healthy"
        return 1
    fi
    
    if echo "$HEALTH_METRICS" | jq -e '.do_storage.status == "healthy"'; then
        echo "✅ DO storage healthy"
    else
        echo "❌ DO storage not healthy"
        return 1
    fi
    
    if echo "$HEALTH_METRICS" | jq -e '.template_rendering.status == "healthy"'; then
        echo "✅ Template rendering healthy"
    else
        echo "❌ Template rendering not healthy"
        return 1
    fi
    
    # Test AI Ops Insights dashboard
    echo "📝 Testing AI Ops Insights dashboard"
    
    AI_METRICS=$(tgk dashboard get ai-ops-insights --stage "$STAGE" --profile "$PROFILE")
    
    # Check AI metrics
    if echo "$AI_METRICS" | jq -e '.rfc_processing_rate.value > 0'; then
        echo "✅ RFC processing rate metrics available"
    else
        echo "❌ RFC processing rate metrics missing or zero"
        return 1
    fi
    
    if echo "$AI_METRICS" | jq -e '.approval_efficiency.value > 0'; then
        echo "✅ Approval efficiency metrics available"
    else
        echo "❌ Approval efficiency metrics missing or zero"
        return 1
    fi
    
    # Test alerting integration
    echo "📝 Testing alerting integration"
    
    # Trigger a test alert
    if tgk alert test --type telegram_connectivity --stage "$STAGE" --profile "$PROFILE"; then
        echo "✅ Alert system functional"
    else
        echo "❌ Alert system not functional"
        return 1
    fi
    
    # Check alert delivery
    sleep 3
    ALERT_DELIVERY=$(tgk alert list --delivered --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    
    if [ "$ALERT_DELIVERY" -gt 0 ]; then
        echo "✅ Alert delivery working"
    else
        echo "❌ Alert delivery not working"
        return 1
    fi
    
    echo "✅ Test 4.2 passed: Dashboard integration working correctly"
    return 0
}

# Main execution
main() {
    echo "Starting Observability & Auditing tests..."
    
    # Run tests
    if test_audit_trail && test_dashboard_integration; then
        echo ""
        echo "🎉 All observability tests passed!"
        return 0
    else
        echo ""
        echo "❌ Some observability tests failed!"
        return 1
    fi
}

# Run main function
main "$@"
