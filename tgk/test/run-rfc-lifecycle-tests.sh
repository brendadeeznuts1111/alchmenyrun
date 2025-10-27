#!/bin/bash

set -euo pipefail

# RFC Lifecycle & Templating Tests
# Usage: ./run-rfc-lifecycle-tests.sh [--stage test-do-006] [--profile ci]

STAGE=${1:-test-do-006}
PROFILE=${2:-ci}

echo "🔬 Testing RFC Lifecycle & Templating"
echo "📊 Stage: $STAGE, Profile: $PROFILE"

# Test 2.1: Full RFC Lifecycle (Templates, State, Approvals)
test_full_rfc_lifecycle() {
    echo ""
    echo "🧪 Test 2.1: Full RFC Lifecycle (Templates, State, Approvals)"
    echo "-------------------------------------------------------------"
    
    # Create test RFC stream
    echo "📝 Creating test RFC stream: do-test-rfc"
    if ! tgk stream create do-test-rfc --type product --owner @brendadeeznuts1111 --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to create test RFC stream"
        return 1
    fi
    
    # Initiate new RFC
    echo "📝 Creating new RFC: DO Integration Test"
    RFC_ID=$(tgk rfc new --template product --title "DO Integration Test" --stage "$STAGE" --profile "$PROFILE" | jq -r '.rfc_id')
    
    if [ -z "$RFC_ID" ] || [ "$RFC_ID" = "null" ]; then
        echo "❌ Failed to create new RFC"
        return 1
    fi
    
    echo "✅ RFC created with ID: $RFC_ID"
    
    # Simulate PR opening (this would normally be done by GitHub webhook)
    echo "📝 Simulating PR opening and initial status card posting"
    if ! tgk rfc update-status "$RFC_ID" --status READY_FOR_REVIEW --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to update RFC status"
        return 1
    fi
    
    # Check that initial RFC card was posted to topic
    echo "🔍 Verifying initial RFC card in do-test-rfc topic"
    if ! tgk telegram list-messages do-test-rfc --stage "$STAGE" --profile "$PROFILE" | grep -q "RFC: $RFC_ID"; then
        echo "❌ Initial RFC card not found in topic"
        return 1
    fi
    
    # Verify card content contains required elements
    echo "🔍 Verifying RFC card content"
    CARD_CONTENT=$(tgk telegram get-latest-message do-test-rfc --stage "$STAGE" --profile "$PROFILE")
    
    REQUIRED_ELEMENTS=("RFC ID" "Title" "Status: READY_FOR_REVIEW" "Approvals Needed" "PR Link" "Approve RFC")
    for element in "${REQUIRED_ELEMENTS[@]}"; do
        if ! echo "$CARD_CONTENT" | grep -q "$element"; then
            echo "❌ Missing required element in RFC card: $element"
            return 1
        fi
    done
    
    echo "✅ RFC card contains all required elements"
    
    # Simulate approvals (need 5 approvals based on CODEOWNERS)
    echo "📝 Simulating RFC approvals"
    APPROVERS=("@alice.smith" "@brendadeeznuts1111" "@diana.prince" "@test.user1" "@test.user2")
    
    for approver in "${APPROVERS[@]}"; do
        echo "📝 Adding approval from $approver"
        if ! tgk rfc approve "$RFC_ID" --user "$approver" --stage "$STAGE" --profile "$PROFILE"; then
            echo "❌ Failed to add approval from $approver"
            return 1
        fi
        
        # Check that pinned message updates in place
        sleep 2
        UPDATED_CARD=$(tgk telegram get-pinned-message do-test-rfc --stage "$STAGE" --profile "$PROFILE")
        if echo "$UPDATED_CARD" | grep -q "Approvals Received"; then
            echo "✅ Pinned message updated after approval from $approver"
        else
            echo "❌ Pinned message not updated after approval from $approver"
            return 1
        fi
    done
    
    # Verify audit log
    echo "🔍 Checking audit log for approval actions"
    AUDIT_ENTRIES=$(tgk audit log --action rfc_approve --rfc-id "$RFC_ID" --stage "$STAGE" --profile "$PROFILE" | jq '. | length')
    
    if [ "$AUDIT_ENTRIES" -eq 5 ]; then
        echo "✅ All approval actions logged correctly"
    else
        echo "❌ Expected 5 audit entries, found $AUDIT_ENTRIES"
        return 1
    fi
    
    # Submit RFC for merge
    echo "📝 Submitting RFC for merge"
    if ! tgk rfc submit "$RFC_ID" --stage "$STAGE" --profile "$PROFILE"; then
        echo "❌ Failed to submit RFC for merge"
        return 1
    fi
    
    # Verify final status
    echo "🔍 Verifying final RFC status"
    FINAL_CARD=$(tgk telegram get-pinned-message do-test-rfc --stage "$STAGE" --profile "$PROFILE")
    
    if echo "$FINAL_CARD" | grep -q "Status: MERGED"; then
        echo "✅ RFC correctly shows MERGED status"
    else
        echo "❌ RFC does not show MERGED status after submit"
        return 1
    fi
    
    echo "✅ Test 2.1 passed: Full RFC lifecycle completed successfully"
    return 0
}

# Test 2.2: Template Rendering & Multilingual Support
test_template_rendering() {
    echo ""
    echo "🧪 Test 2.2: Template Rendering & Multilingual Support"
    echo "-------------------------------------------------------"
    
    # Test French template rendering
    echo "📝 Testing French template rendering"
    FRENCH_RENDER=$(tgk pin preview do-test-rfc --user @alice.smith --lang fr --stage "$STAGE" --profile "$PROFILE")
    
    if echo "$FRENCH_RENDER" | grep -q "Approuver RFC\|Approbations Requises"; then
        echo "✅ French template rendered correctly"
    else
        echo "❌ French template not rendered correctly"
        return 1
    fi
    
    # Test English template rendering
    echo "📝 Testing English template rendering"
    ENGLISH_RENDER=$(tgk pin preview do-test-rfc --user @brendadeeznuts1111 --stage "$STAGE" --profile "$PROFILE")
    
    if echo "$ENGLISH_RENDER" | grep -q "Approve RFC\|Approvals Needed"; then
        echo "✅ English template rendered correctly"
    else
        echo "❌ English template not rendered correctly"
        return 1
    fi
    
    # Test personalization
    echo "🔍 Testing template personalization"
    if echo "$ENGLISH_RENDER" | grep -q "@brendadeeznuts1111"; then
        echo "✅ Template personalization working correctly"
    else
        echo "❌ Template personalization not working"
        return 1
    fi
    
    echo "✅ Test 2.2 passed: Template rendering and multilingual support working"
    return 0
}

# Main execution
main() {
    echo "Starting RFC Lifecycle & Templating tests..."
    
    # Run tests
    if test_full_rfc_lifecycle && test_template_rendering; then
        echo ""
        echo "🎉 All RFC lifecycle tests passed!"
        return 0
    else
        echo ""
        echo "❌ Some RFC lifecycle tests failed!"
        return 1
    fi
}

# Run main function
main "$@"
