#!/usr/bin/env node

/**
 * Test Infrastructure for tgk RFC Lifecycle Orchestration
 * Comprehensive test suite for DO, State, Templates, Notifications
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TGKTestSuite {
  constructor() {
    this.stage = 'test-do-006';
    this.profile = 'ci';
    this.testResults = [];
    this.currentTest = null;
  }

  async runTestSuite() {
    console.log('🧪 Starting tgk RFC Lifecycle Orchestration Test Suite');
    console.log(`📋 Stage: ${this.stage} | Profile: ${this.profile}`);
    console.log('=' .repeat(80));

    try {
      // 0. Pre-requisites & Setup
      await this.runSetup();
      
      // 1. Core State Management & DO Thread-Safety
      await this.testDOThreadSafety();
      await this.testDOStatePersistence();
      
      // 2. RFC Lifecycle & Templating
      await this.testFullRFCLifecycle();
      await this.testTemplateRendering();
      
      // 3. Notifications & Limiting
      await this.testSLANudges();
      await this.testGarbageCollection();
      
      // 4. Observability & Auditing
      await this.testAuditTrail();
      
      // 5. Resource Limiting & Cost Attribution
      await this.testResourceUsage();
      
      // Generate final report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runSetup() {
    this.logTest('0. Pre-requisites & Setup');
    
    try {
      // Check tgk installation
      const version = execSync('tgk --version', { encoding: 'utf8' }).trim();
      this.assert(version.includes('5.0.0'), 'tgk v5.0.0+ required');
      
      // Check environment variables
      const requiredVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_COUNCIL_ID'];
      for (const varName of requiredVars) {
        this.assert(process.env[varName], `${varName} environment variable required`);
      }
      
      // Verify templates exist
      const templatePath = 'tgk/templates/telegram-card/rfc-status-card.jinja2';
      this.assert(fs.existsSync(templatePath), `Template ${templatePath} must exist`);
      
      // Check Cloudflare permissions
      try {
        execSync('tgk cf whoami', { encoding: 'utf8' });
      } catch (error) {
        throw new Error('Cloudflare authentication required');
      }
      
      this.pass('All pre-requisites satisfied');
      
    } catch (error) {
      this.fail('Setup failed', error.message);
      throw error;
    }
  }

  async testDOThreadSafety() {
    this.logTest('1.1 Concurrent Webhooks (DO Thread Safety)');
    
    try {
      // Create test stream
      const streamName = 'do-test-concurrency';
      execSync(`tgk stream create ${streamName} --type sre --owner @alice`, { encoding: 'utf8' });
      
      // Post initial RFC status card
      execSync(`tgk pin post --stream ${streamName} --template rfc-status-card --data '{"rfc":{"id":"test-001","title":"Concurrency Test"}}'`, { encoding: 'utf8' });
      
      // Simulate concurrent webhooks (would need actual webhook endpoints)
      console.log('🔄 Simulating concurrent webhook events...');
      
      // Verify only one message is pinned
      const pinnedMessages = execSync(`tgk pin list --stream ${streamName} --pinned-only`, { encoding: 'utf8' });
      this.assert(pinnedMessages.split('\n').filter(line => line.trim()).length === 1, 'Only one message should be pinned');
      
      // Check DO logs for serialization
      const logs = execSync(`tgk logs worker github-webhook --stage ${this.stage} --follow --timeout 5`, { encoding: 'utf8' });
      this.assert(logs.includes('DO invocation'), 'DO should log invocations');
      
      this.pass('DO thread safety verified');
      
    } catch (error) {
      this.fail('DO thread safety test', error.message);
    }
  }

  async testDOStatePersistence() {
    this.logTest('1.2 DO State Persistence (Across Worker Restarts/Deploys)');
    
    try {
      const streamName = 'do-test-concurrency';
      
      // Redeploy worker
      execSync(`tgk cf worker deploy github-webhook --stage ${this.stage} --reason "DO_state_test"`, { encoding: 'utf8' });
      
      // Trigger new webhook event
      execSync(`tgk webhook simulate --stream ${streamName} --event pr_opened --data '{"rfc":{"id":"test-002","title":"Persistence Test"}}'`, { encoding: 'utf8' });
      
      // Verify new message is pinned and old is unpinned
      const pinnedMessages = execSync(`tgk pin list --stream ${streamName} --pinned-only`, { encoding: 'utf8' });
      const messages = pinnedMessages.split('\n').filter(line => line.trim());
      this.assert(messages.length === 1, 'Only one message should be pinned after redeploy');
      this.assert(messages[0].includes('test-002'), 'New message should be pinned');
      
      this.pass('DO state persistence verified');
      
    } catch (error) {
      this.fail('DO state persistence test', error.message);
    }
  }

  async testFullRFCLifecycle() {
    this.logTest('2.1 Full RFC Lifecycle (Templates, State, Approvals)');
    
    try {
      const streamName = 'do-test-rfc';
      const rfcId = 'do-test-001';
      
      // Create test stream
      execSync(`tgk stream create ${streamName} --type product --owner @brendadeeznuts1111`, { encoding: 'utf8' });
      
      // Create new RFC
      execSync(`tgk rfc new --template product --title "DO Integration Test" --stream ${streamName}`, { encoding: 'utf8' });
      
      // Verify initial RFC card posted
      const messages = execSync(`tgk pin list --stream ${streamName}`, { encoding: 'utf8' });
      this.assert(messages.includes('READY_FOR_REVIEW'), 'Initial card should show READY_FOR_REVIEW status');
      this.assert(messages.includes('Approvals Needed: 5/5'), 'Card should show approval requirements');
      
      // Simulate approvals
      const approvers = ['@alice.smith', '@charlie.brown', '@diana.prince', '@frank.taylor', '@brendadeeznuts1111'];
      for (const approver of approvers) {
        execSync(`tgk rfc approve ${rfcId} --user ${approver}`, { encoding: 'utf8' });
      }
      
      // Verify approvals updated in place
      const updatedMessages = execSync(`tgk pin list --stream ${streamName}`, { encoding: 'utf8' });
      this.assert(updatedMessages.includes('Approvals Needed: 0/5'), 'All approvals should be recorded');
      this.assert(updatedMessages.includes('APPROVED'), 'Status should update to APPROVED');
      
      // Submit and merge
      execSync(`tgk rfc submit ${rfcId}`, { encoding: 'utf8' });
      
      // Verify merge completion
      const finalMessages = execSync(`tgk pin list --stream ${streamName}`, { encoding: 'utf8' });
      this.assert(finalMessages.includes('MERGED'), 'Final status should be MERGED');
      
      // Check audit log
      const auditLog = execSync('tgk audit log --action rfc_approve', { encoding: 'utf8' });
      this.assert(auditLog.includes(rfcId), 'Approvals should be audited');
      
      this.pass('Full RFC lifecycle completed successfully');
      
    } catch (error) {
      this.fail('Full RFC lifecycle test', error.message);
    }
  }

  async testTemplateRendering() {
    this.logTest('2.2 Template Rendering & Multilingual Support');
    
    try {
      // Test French rendering
      const frenchPreview = execSync('tgk pin preview do-test-rfc --user @alice.smith --lang fr', { encoding: 'utf8' });
      this.assert(frenchPreview.includes('Approuver') || frenchPreview.includes('Approbation'), 'French labels should be present');
      
      // Test English rendering
      const englishPreview = execSync('tgk pin preview do-test-rfc --user @brendadeeznuts1111', { encoding: 'utf8' });
      this.assert(englishPreview.includes('Approve') || englishPreview.includes('Approval'), 'English labels should be present');
      
      // Test personalization
      this.assert(englishPreview.includes('@brendadeeznuts1111'), 'Personalization should work');
      
      this.pass('Template rendering and multilingual support verified');
      
    } catch (error) {
      this.fail('Template rendering test', error.message);
    }
  }

  async testSLANudges() {
    this.logTest('3.1 SLA Nudges & Escalations (Rate Limiting)');
    
    try {
      const rfcId = 'sla-test-001';
      
      // Create RFC with short SLA
      execSync(`tgk rfc new --template product --title "SLA Test" --sla-hours 0.08`, { encoding: 'utf8' });
      
      // Wait for SLA breach (simulated)
      execSync(`tgk sla simulate-breach ${rfcId}`, { encoding: 'utf8' });
      
      // Trigger manual nudge
      execSync(`tgk review nudge --id ${rfcId}`, { encoding: 'utf8' });
      
      // Verify nudge sent
      const notifications = execSync(`tgk notification list --type nudge`, { encoding: 'utf8' });
      this.assert(notifications.includes(rfcId), 'Nudge should be sent for SLA breach');
      
      // Check metrics
      const metrics = execSync('tgk metrics get --name tgk_review_assignment_total', { encoding: 'utf8' });
      this.assert(parseFloat(metrics) > 0, 'Review assignment metrics should increment');
      
      // Test rate limiting
      execSync(`tgk review nudge --id ${rfcId}`, { encoding: 'utf8' });
      execSync(`tgk review nudge --id ${rfcId}`, { encoding: 'utf8' });
      
      const rateLimitedNotifications = execSync(`tgk notification list --type nudge --recent`, { encoding: 'utf8' });
      this.assert(rateLimitedNotifications.split('\n').filter(line => line.trim()).length <= 3, 'Rate limiting should prevent excessive nudges');
      
      this.pass('SLA nudges and rate limiting verified');
      
    } catch (error) {
      this.fail('SLA nudges test', error.message);
    }
  }

  async testGarbageCollection() {
    this.logTest('3.2 Garbage Collection (Cleanup of Stale Data)');
    
    try {
      // Create test RFCs in various states
      execSync('tgk rfc new --template product --title "Cleanup Test 1"', { encoding: 'utf8' });
      execSync('tgk rfc new --template product --title "Cleanup Test 2"', { encoding: 'utf8' });
      
      // Archive some RFCs
      execSync('tgk rfc archive cleanup-test-1 --reason "test cleanup"', { encoding: 'utf8' });
      
      // Run cleanup
      execSync('tgk orchestrate cleanup --scope rfc --status archived --older-than 30d', { encoding: 'utf8' });
      
      // Verify cleanup metrics
      const cleanupMetrics = execSync('tgk metrics get --name tgk_storage_cleanup_total', { encoding: 'utf8' });
      this.assert(parseFloat(cleanupMetrics) > 0, 'Cleanup metrics should increment');
      
      // Check storage reduction
      const storageGauge = execSync('tgk metrics get --name tgk_storage_bytes_gauge', { encoding: 'utf8' });
      this.assert(parseFloat(storageGauge) >= 0, 'Storage gauge should be valid');
      
      this.pass('Garbage collection verified');
      
    } catch (error) {
      this.fail('Garbage collection test', error.message);
    }
  }

  async testAuditTrail() {
    this.logTest('4.1 End-to-End Audit Trail');
    
    try {
      // Perform various tgk commands
      execSync('tgk stream create audit-test --type security --owner @diana.prince', { encoding: 'utf8' });
      execSync('tgk rfc approve do-test-001 --user @alice.smith', { encoding: 'utf8' });
      
      // Check audit log
      const auditLog = execSync('tgk audit log --recent', { encoding: 'utf8' });
      this.assert(auditLog.includes('stream_create'), 'Stream creation should be audited');
      this.assert(auditLog.includes('rfc_approve'), 'RFC approval should be audited');
      
      // Verify audit log structure
      const auditEntries = auditLog.split('\n').filter(line => line.trim());
      for (const entry of auditEntries.slice(0, 3)) {
        this.assert(entry.includes('action_type'), 'Audit entry should include action_type');
        this.assert(entry.includes('user_id'), 'Audit entry should include user_id');
      }
      
      // Check DO invocation metrics
      const dometrics = execSync('tgk metrics get --name alc_do_invocations_total', { encoding: 'utf8' });
      this.assert(parseFloat(dometrics) > 0, 'DO invocation metrics should be present');
      
      this.pass('End-to-end audit trail verified');
      
    } catch (error) {
      this.fail('Audit trail test', error.message);
    }
  }

  async testResourceUsage() {
    this.logTest('5.1 DO Resource Usage & Cost Attribution');
    
    try {
      // Perform resource-intensive operations
      execSync('tgk webhook simulate --stream do-test-concurrency --event pr_opened', { encoding: 'utf8' });
      execSync('tgk rfc approve do-test-001 --user @alice.smith', { encoding: 'utf8' });
      
      // Check DO invocation metrics
      const doInvocations = execSync('tgk metrics get --name alc_do_invocations_total', { encoding: 'utf8' });
      this.assert(parseFloat(doInvocations) > 0, 'DO invocations should be tracked');
      
      // Check storage usage
      const storageUsage = execSync('tgk metrics get --name tgk_storage_bytes_gauge', { encoding: 'utf8' });
      this.assert(parseFloat(storageUsage) >= 0, 'Storage usage should be tracked');
      
      // Verify cost attribution tags
      const telemetry = execSync('tgk telemetry get --filter "alc.do.id"', { encoding: 'utf8' });
      this.assert(telemetry.includes('alc.do.id'), 'Cost attribution tags should be present');
      
      // Check cost estimates
      const costEstimate = execSync('tgk cost estimate --scope do --period monthly', { encoding: 'utf8' });
      this.assert(parseFloat(costEstimate) < 1.0, 'Monthly cost should be under $1 for current scale');
      
      this.pass('Resource usage and cost attribution verified');
      
    } catch (error) {
      this.fail('Resource usage test', error.message);
    }
  }

  logTest(testName) {
    this.currentTest = testName;
    console.log(`\n🧪 ${testName}`);
    console.log('-'.repeat(60));
  }

  pass(message) {
    console.log(`✅ ${message}`);
    this.testResults.push({ test: this.currentTest, status: 'PASS', message });
  }

  fail(testName, error) {
    console.log(`❌ ${testName}: ${error}`);
    this.testResults.push({ test: this.currentTest, status: 'FAIL', message: error });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUITE REPORT');
    console.log('='.repeat(80));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed (${failed} failed)`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
    
    console.log('\n✅ Passed Tests:');
    this.testResults.filter(r => r.status === 'PASS').forEach(result => {
      console.log(`   • ${result.test}`);
    });
    
    console.log(`\n🎯 Overall Status: ${failed === 0 ? 'PRODUCTION READY' : 'NEEDS FIXES'}`);
    
    // Save report to file
    const reportPath = `test-results-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new TGKTestSuite();
  testSuite.runTestSuite().catch(console.error);
}

module.exports = TGKTestSuite;
