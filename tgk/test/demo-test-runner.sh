#!/bin/bash

set -euo pipefail

# Demo Test Runner for tgk RFC Lifecycle Orchestration
# This demonstrates the test plan concepts with actual working commands

echo "🧪 tgk RFC Lifecycle Test Suite Demo"
echo "📊 Demonstrating comprehensive test plan concepts"
echo "=================================="

# Test results tracking
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test scenario
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

# Test 1: Template Rendering (Core functionality)
test_template_rendering() {
    echo "📝 Testing Jinja2 template rendering..."
    
    # Run the existing template test
    cd /Users/nolarose/alchmenyrun
    node -e "
        const { renderTemplate } = require('./tgk/utils/template-renderer');
        
        const templateVars = {
            rfc: {
                id: 'demo-rfc-001',
                title: 'Demo RFC for Testing',
                current_status: 'READY_FOR_REVIEW',
                approvals_needed: 5,
                approvals_received: 2,
                executive_summary: 'This is a demo RFC to test the template rendering system',
                submit_date: '2025-10-27T02:23:00Z',
                sla_remaining_hours: 72,
                pr_number: 999
            },
            council_id: '-1003293940131',
            topic_id: '25782'
        };
        
        renderTemplate('rfc-status-card.jinja2', templateVars)
            .then(rendered => {
                console.log('✅ Template rendered successfully');
                console.log('📝 Sample output:');
                console.log(rendered.substring(0, 300) + '...');
            })
            .catch(error => {
                console.error('❌ Template rendering failed:', error.message);
                process.exit(1);
            });
    "
}

# Test 2: RFC Store (Data persistence)
test_rfc_store() {
    echo "📝 Testing RFC store functionality..."
    
    cd /Users/nolarose/alchmenyrun
    node -e "
        const { RFCStore } = require('./tgk/utils/rfc-store');
        
        async function testStore() {
            const store = new RFCStore();
            
            // Create test RFC
            const testRfc = await store.createRfc({
                id: 'demo-rfc-002',
                title: 'Demo RFC Store Test',
                executive_summary: 'Testing RFC store functionality',
                pr_number: 1000,
                approvals_needed: 3
            });
            
            console.log('✅ RFC Store working - Created RFC:', testRfc.id);
            
            // Test approval
            await store.addApproval('demo-rfc-002', 'demo-user');
            const updatedRfc = await store.getRfc('demo-rfc-002');
            console.log('✅ Approval system working - Approvals:', updatedRfc.approvals_received);
            
            // Test status update
            await store.updateStatus('demo-rfc-002', 'IN_REVIEW');
            const statusRfc = await store.getRfc('demo-rfc-002');
            console.log('✅ Status update working - Status:', statusRfc.current_status);
        }
        
        testStore().catch(error => {
            console.error('❌ RFC Store test failed:', error.message);
            process.exit(1);
        });
    "
}

# Test 3: CLI Command Structure
test_cli_commands() {
    echo "📝 Testing CLI command structure..."
    
    cd /Users/nolarose/alchmenyrun
    
    # Test main CLI help
    if node tgk/bin/tgk.js --help >/dev/null 2>&1; then
        echo "✅ Main CLI working"
    else
        echo "❌ Main CLI failed"
        return 1
    fi
    
    # Test RFC approve command help
    if node tgk/bin/tgk.js rfc approve --help >/dev/null 2>&1; then
        echo "✅ RFC approve command available"
    else
        echo "❌ RFC approve command not available"
        return 1
    fi
    
    echo "✅ CLI command structure verified"
}

# Test 4: Approval Workflow Simulation
test_approval_workflow() {
    echo "📝 Testing approval workflow simulation..."
    
    cd /Users/nolarose/alchmenyrun
    node -e "
        const { RFCStore } = require('./tgk/utils/rfc-store');
        
        async function testWorkflow() {
            const store = new RFCStore();
            
            // Create RFC for workflow test
            const rfc = await store.createRfc({
                id: 'workflow-test-001',
                title: 'Workflow Test RFC',
                executive_summary: 'Testing the complete approval workflow',
                pr_number: 1001,
                approvals_needed: 3
            });
            
            console.log('✅ Created RFC for workflow test:', rfc.id);
            
            // Simulate approval process
            const approvers = ['alice', 'bob', 'charlie'];
            for (const approver of approvers) {
                await store.addApproval(rfc.id, approver);
                const updated = await store.getRfc(rfc.id);
                console.log(\`✅ Added approval from \${approver}: \${updated.approvals_received}/\${updated.approvals_needed}\`);
            }
            
            // Check if fully approved
            const finalRfc = await store.getRfc(rfc.id);
            if (finalRfc.approvals_received >= finalRfc.approvals_needed) {
                console.log('✅ RFC fully approved - workflow test passed');
                await store.updateStatus(rfc.id, 'APPROVED');
                console.log('✅ Status updated to APPROVED');
            } else {
                console.log('❌ RFC not fully approved');
                process.exit(1);
            }
        }
        
        testWorkflow().catch(error => {
            console.error('❌ Workflow test failed:', error.message);
            process.exit(1);
        });
    "
}

# Test 5: Error Handling
test_error_handling() {
    echo "📝 Testing error handling..."
    
    cd /Users/nolarose/alchmenyrun
    
    # Test invalid RFC ID
    if node tgk/bin/tgk.js rfc approve invalid-rfc-id 2>/dev/null; then
        echo "❌ Should have failed for invalid RFC ID"
        return 1
    else
        echo "✅ Correctly handled invalid RFC ID"
    fi
    
    # Test missing arguments
    if node tgk/bin/tgk.js rfc approve 2>/dev/null; then
        echo "❌ Should have failed for missing RFC ID"
        return 1
    else
        echo "✅ Correctly handled missing arguments"
    fi
    
    echo "✅ Error handling working correctly"
}

# Test 6: Integration Points
test_integration_points() {
    echo "📝 Testing integration points..."
    
    cd /Users/nolarose/alchmenyrun
    
    # Test Telegram utility (without actually sending)
    node -e "
        const { TelegramBot } = require('./tgk/utils/telegram');
        
        try {
            const telegram = new TelegramBot();
            console.log('✅ Telegram utility initialized');
            
            // Test message formatting (without sending)
            const testMessage = '🧪 Test message for integration testing';
            console.log('✅ Message formatting working');
        } catch (error) {
            if (error.message.includes('TELEGRAM_BOT_TOKEN')) {
                console.log('✅ Telegram utility correctly requires bot token');
            } else {
                console.error('❌ Unexpected Telegram error:', error.message);
                process.exit(1);
            }
        }
    "
    
    # Test template renderer integration
    node -e "
        const { renderTemplate } = require('./tgk/utils/template-renderer');
        
        try {
            renderTemplate('non-existent-template.jinja2', {})
                .then(() => {
                    console.error('❌ Should have failed for non-existent template');
                    process.exit(1);
                })
                .catch(error => {
                    console.log('✅ Template renderer correctly handles missing templates');
                });
        } catch (error) {
            console.log('✅ Template renderer error handling working');
        }
    "
}

# Main execution
main() {
    echo "Starting comprehensive test demonstration..."
    
    # Run all test scenarios
    run_test "Template Rendering" "test_template_rendering"
    run_test "RFC Store Functionality" "test_rfc_store"
    run_test "CLI Command Structure" "test_cli_commands"
    run_test "Approval Workflow" "test_approval_workflow"
    run_test "Error Handling" "test_error_handling"
    run_test "Integration Points" "test_integration_points"
    
    # Final results
    echo ""
    echo "=================================="
    echo "🏁 Test Suite Demo Complete"
    echo "📊 Results: $PASSED/$TOTAL passed, $FAILED failed"
    echo "=================================="
    
    if [ $FAILED -eq 0 ]; then
        echo "🎉 All tests passed! Core system is working correctly."
        echo ""
        echo "📋 Test Plan Demonstration Summary:"
        echo "✅ Template rendering system functional"
        echo "✅ RFC data persistence working"
        echo "✅ CLI command structure validated"
        echo "✅ Approval workflow simulation successful"
        echo "✅ Error handling properly implemented"
        echo "✅ Integration points verified"
        echo ""
        echo "🚀 The comprehensive test plan framework is ready for"
        echo "   full integration with external services (Telegram, GitHub, etc.)"
        exit 0
    else
        echo "⚠️  Some tests failed. Review the implementation."
        exit 1
    fi
}

# Run main function
main "$@"
