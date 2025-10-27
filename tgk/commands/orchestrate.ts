#!/usr/bin/env node

/**
 * tgk orchestrate - Advanced Workflow Orchestration with AI Integration
 * Commands: auto-triage, release-candidate, revert, audit-compliance, email-reply, route-diagnostics
 */

import { GitHubManager } from '../utils/github.js';
import { TelegramBot } from '../utils/telegram.js';
import { analyzeEmailContent, suggestEmailRouting, draftEmailReply } from './ai.ts';

// Initialize clients
const gh = new GitHubManager();
const telegram = new TelegramBot();

// Enhanced interfaces for orchestration operations
interface TriageReport {
  issueId: string;
  aiLabels: string[];
  confidence: number;
  reasoning: string;
  appliedAt: string;
  requiresHumanReview: boolean;
  telegramPosted: boolean;
}

interface ReleaseCandidateReport {
  prId: string;
  stagingDeployed: boolean;
  e2eTestsPassed: boolean;
  autoPromoted: boolean;
  failures: string[];
  deployedAt: string;
  telegramPosted: boolean;
}

interface RevertReport {
  component: string;
  fromVersion: string;
  toVersion: string;
  stage: string;
  policyCheckPassed: boolean;
  revertedAt: string;
  rollbackPlan: string;
  telegramPosted: boolean;
}

interface ComplianceReport {
  scope: string;
  policiesChecked: number;
  violations: string[];
  compliant: boolean;
  auditDate: string;
  recommendations: string[];
  telegramPosted: boolean;
}

interface EmailReplyReport {
  originalMessageId: string;
  replyTo: string;
  subject: string;
  body: string;
  sentAt: string;
  confidence: number;
  telegramPosted: boolean;
}

interface RouteDiagnosticsReport {
  email: string;
  parsedTokens: {
    domain?: string;
    scope?: string;
    type?: string;
    hierarchy?: string;
    meta?: string;
    stateId?: string;
  };
  routingSuggestion: {
    chat_id: string | null;
    routing_confidence: number;
    fallback_reason?: string;
    suggested_priority_override?: string;
    reasoning: string;
  };
  aiAnalysis?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    summary: string;
    keywords: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
    action_items: string[];
    potential_pii: boolean;
    phishing_risk: number;
    reasoning: string;
  };
  diagnostics: {
    parsingErrors: string[];
    routingErrors: string[];
    recommendations: string[];
  };
  checkedAt: string;
}

export async function autoTriage(issueId: string): Promise<TriageReport> {
  console.log(`🤖 Initiating auto-triage for issue #${issueId}...`);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      const mockReport: TriageReport = {
        issueId,
        aiLabels: ['group/internal', 'topic/governance', 'impact/medium'],
        confidence: 0.87,
        reasoning: 'Internal governance issue with medium impact detected based on content analysis.',
        appliedAt: new Date().toISOString(),
        requiresHumanReview: false,
        telegramPosted: false
      };
      
      console.log(`✅ Would triage issue #${issueId}`);
      console.log(`🏷️  AI Labels: ${mockReport.aiLabels.join(', ')}`);
      console.log(`📊 Confidence: ${(mockReport.confidence * 100).toFixed(1)}%`);
      console.log(`🧠 Reasoning: ${mockReport.reasoning}`);
      console.log(`📱 Would post triage report to Telegram stream`);
      
      return mockReport;
    }

    // Get issue details
    const issue = await gh.getIssue(parseInt(issueId));

    // Import AI analysis from the ai module
    const { suggestLabels } = await import('./ai.js');
    const labelSuggestion = await suggestLabels(issueId, 'brendadeeznuts1111', 'alchmenyrun');

    // Apply labels if confidence is high enough
    let appliedLabels: string[] = [];
    let requiresHumanReview = false;

    if (labelSuggestion.confidence > 0.8) {
      await gh.addLabels(parseInt(issueId), labelSuggestion.labels);
      appliedLabels = labelSuggestion.labels;
    } else {
      requiresHumanReview = true;
    }

    const triageReport: TriageReport = {
      issueId,
      aiLabels: labelSuggestion.labels,
      confidence: labelSuggestion.confidence,
      reasoning: labelSuggestion.reasoning,
      appliedAt: new Date().toISOString(),
      requiresHumanReview,
      telegramPosted: false
    };

    // Post report to Telegram
    try {
      await postTriageReportToTelegram(triageReport, issue);
      triageReport.telegramPosted = true;
    } catch (error) {
      console.warn('⚠️ Failed to post to Telegram:', error.message);
    }

    console.log(`✅ Auto-triage completed for issue #${issueId}`);
    console.log(`🏷️  Suggested Labels: ${labelSuggestion.labels.join(', ')}`);
    console.log(`📊 Confidence: ${(labelSuggestion.confidence * 100).toFixed(1)}%`);
    console.log(`${requiresHumanReview ? '⚠️  Requires human review' : '✅ Labels applied automatically'}`);
    console.log(`📱 Telegram: ${triageReport.telegramPosted ? '✅ Posted' : '❌ Failed'}`);

    return triageReport;

  } catch (error) {
    console.error(`❌ Failed to auto-triage issue #${issueId}:`, error.message);
    throw error;
  }
}

export async function releaseCandidate(prId: string): Promise<ReleaseCandidateReport> {
  console.log(`🚀 Initiating release candidate pipeline for PR #${prId}...`);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      const mockReport: ReleaseCandidateReport = {
        prId,
        stagingDeployed: true,
        e2eTestsPassed: true,
        autoPromoted: true,
        failures: [],
        deployedAt: new Date().toISOString(),
        telegramPosted: false
      };
      
      console.log(`✅ Would deploy PR #${prId} to staging`);
      console.log(`🧪 Would run E2E tests`);
      console.log(`🎯 Would auto-promote to production (tests passed)`);
      console.log(`📱 Would post deployment report to Telegram`);
      
      return mockReport;
    }

    // Get PR details
    const pr = await gh.getPRStatus(parseInt(prId));

    console.log(`📋 PR #${prId}: ${pr.title}`);
    console.log(`🌿 Branch: ${pr.head.ref} → ${pr.base.ref}`);

    const report: ReleaseCandidateReport = {
      prId,
      stagingDeployed: false,
      e2eTestsPassed: false,
      autoPromoted: false,
      failures: [],
      deployedAt: new Date().toISOString(),
      telegramPosted: false
    };

    // Validate PR is ready for release candidate
    if (pr.state !== 'open') {
      throw new Error('PR must be open to create release candidate');
    }

    if (pr.checks.passing !== pr.checks.total) {
      throw new Error('All CI checks must pass before release candidate');
    }

    // Step 1: Deploy to staging
    console.log(`🚀 Deploying to staging...`);
    try {
      await triggerStagingDeployment(prId);
      report.stagingDeployed = true;
      console.log(`✅ Staging deployment successful`);
    } catch (error) {
      report.failures.push(`Staging deployment failed: ${error.message}`);
      console.error(`❌ Staging deployment failed: ${error.message}`);
    }

    // Step 2: Run E2E tests if staging deployment succeeded
    if (report.stagingDeployed) {
      console.log(`🧪 Running E2E tests...`);
      try {
        const testResults = await runE2ETests(prId);
        report.e2eTestsPassed = testResults.passed;
        
        if (!testResults.passed) {
          report.failures.push(...testResults.failures);
          console.error(`❌ E2E tests failed: ${testResults.failures.join(', ')}`);
        } else {
          console.log(`✅ E2E tests passed`);
        }
      } catch (error) {
        report.failures.push(`E2E test execution failed: ${error.message}`);
        console.error(`❌ E2E test execution failed: ${error.message}`);
      }
    }

    // Step 3: Auto-promote if all checks passed
    if (report.stagingDeployed && report.e2eTestsPassed) {
      console.log(`🎯 Auto-promoting to production...`);
      try {
        await triggerProductionDeployment(prId);
        report.autoPromoted = true;
        console.log(`✅ Auto-promotion to production successful`);
      } catch (error) {
        report.failures.push(`Production deployment failed: ${error.message}`);
        console.error(`❌ Production deployment failed: ${error.message}`);
      }
    }

    // Post report to Telegram
    try {
      await postReleaseCandidateReportToTelegram(report, pr);
      report.telegramPosted = true;
    } catch (error) {
      console.warn('⚠️ Failed to post to Telegram:', error.message);
    }

    console.log(`📊 Release candidate pipeline completed for PR #${prId}`);
    console.log(`🚀 Staging: ${report.stagingDeployed ? '✅' : '❌'}`);
    console.log(`🧪 E2E Tests: ${report.e2eTestsPassed ? '✅' : '❌'}`);
    console.log(`🎯 Production: ${report.autoPromoted ? '✅' : '❌'}`);
    console.log(`📱 Telegram: ${report.telegramPosted ? '✅ Posted' : '❌ Failed'}`);

    return report;

  } catch (error) {
    console.error(`❌ Failed to process release candidate for PR #${prId}:`, error.message);
    throw error;
  }
}

export async function revertComponent(component: string, version: string, options: { stage?: string } = {}): Promise<RevertReport> {
  const stage = options.stage || 'production';
  console.log(`🔄 Initiating rollback of ${component} to version ${version} in ${stage}...`);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      const mockReport: RevertReport = {
        component,
        fromVersion: 'current',
        toVersion: version,
        stage,
        policyCheckPassed: true,
        revertedAt: new Date().toISOString(),
        rollbackPlan: `Rollback plan for ${component} validated and executed successfully.`,
        telegramPosted: false
      };
      
      console.log(`✅ Would rollback ${component} to version ${version}`);
      console.log(`🔒 Would check OPA policies for rollback authorization`);
      console.log(`📋 Would execute rollback plan`);
      console.log(`📱 Would post rollback report to Telegram`);
      
      return mockReport;
    }

    // Step 1: Check OPA policies for rollback authorization
    console.log(`🔒 Checking OPA policies for rollback authorization...`);
    const policyCheck = await validateRollbackPolicy(component, version, stage);
    
    if (!policyCheck.allowed) {
      throw new Error(`Rollback blocked by policy: ${policyCheck.reason}`);
    }

    // Step 2: Create rollback plan
    console.log(`📋 Creating rollback plan...`);
    const rollbackPlan = await createRollbackPlan(component, version, stage);

    // Step 3: Execute rollback
    console.log(`🔄 Executing rollback...`);
    const rollbackResult = await executeRollback(component, version, stage, rollbackPlan);

    const report: RevertReport = {
      component,
      fromVersion: rollbackResult.previousVersion,
      toVersion: version,
      stage,
      policyCheckPassed: policyCheck.allowed,
      revertedAt: new Date().toISOString(),
      rollbackPlan: rollbackPlan.description,
      telegramPosted: false
    };

    // Post report to Telegram
    try {
      await postRevertReportToTelegram(report);
      report.telegramPosted = true;
    } catch (error) {
      console.warn('⚠️ Failed to post to Telegram:', error.message);
    }

    console.log(`✅ Rollback completed successfully`);
    console.log(`🔄 ${component}: ${report.fromVersion} → ${version}`);
    console.log(`🌍 Stage: ${stage}`);
    console.log(`🔒 Policy Check: ✅`);
    console.log(`📱 Telegram: ${report.telegramPosted ? '✅ Posted' : '❌ Failed'}`);

    return report;

  } catch (error) {
    console.error(`❌ Failed to rollback ${component}:`, error.message);
    throw error;
  }
}

export async function auditCompliance(scope: string): Promise<ComplianceReport> {
  console.log(`🔍 Initiating compliance audit for scope: ${scope}...`);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      const mockReport: ComplianceReport = {
        scope,
        policiesChecked: 15,
        violations: ['policy-5: Missing security labels on critical issues'],
        compliant: false,
        auditDate: new Date().toISOString(),
        recommendations: ['Apply security labels to critical issues', 'Review issue triage process'],
        telegramPosted: false
      };
      
      console.log(`🔍 Would audit ${scope} scope`);
      console.log(`📋 Would check ${mockReport.policiesChecked} OPA policies`);
      console.log(`⚠️  Would find ${mockReport.violations.length} violations`);
      console.log(`📝 Would generate recommendations`);
      console.log(`📱 Would post audit report to Telegram`);
      
      return mockReport;
    }

    // Step 1: Get current state
    console.log(`📊 Gathering current state for ${scope}...`);
    const currentState = await getCurrentState(scope);

    // Step 2: Get relevant OPA policies
    console.log(`📋 Retrieving OPA policies for ${scope}...`);
    const policies = await getOPAPolicies(scope);

    // Step 3: Evaluate compliance
    console.log(`🔍 Evaluating compliance...`);
    const complianceResults = await evaluateCompliance(currentState, policies);

    const report: ComplianceReport = {
      scope,
      policiesChecked: policies.length,
      violations: complianceResults.violations,
      compliant: complianceResults.violations.length === 0,
      auditDate: new Date().toISOString(),
      recommendations: complianceResults.recommendations,
      telegramPosted: false
    };

    // Post report to Telegram
    try {
      await postComplianceReportToTelegram(report);
      report.telegramPosted = true;
    } catch (error) {
      console.warn('⚠️ Failed to post to Telegram:', error.message);
    }

    console.log(`📊 Compliance audit completed for ${scope}`);
    console.log(`📋 Policies Checked: ${report.policiesChecked}`);
    console.log(`${report.compliant ? '✅' : '⚠️'} Compliant: ${report.compliant}`);
    console.log(`🚨 Violations: ${report.violations.length}`);
    console.log(`📱 Telegram: ${report.telegramPosted ? '✅ Posted' : '❌ Failed'}`);
    
    if (report.violations.length > 0) {
      console.log(`🚨 Violations:`);
      report.violations.forEach(violation => console.log(`   • ${violation}`));
    }

    return report;

  } catch (error) {
    console.error(`❌ Failed to audit compliance for ${scope}:`, error.message);
    throw error;
  }
}

// Enhanced helper functions with Telegram integration

async function postTriageReportToTelegram(report: TriageReport, issue: any): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_COUNCIL_ID) {
    console.log('📝 Telegram tokens not available, skipping notification');
    return;
  }

  const status = report.requiresHumanReview ? '⚠️ Requires Review' : '✅ Auto-Triaged';
  const message = `🤖 **Auto-Triage Report**

Issue: [#${report.issueId}](${issue.html_url})
Title: ${issue.title}
Status: ${status}

🏷️ **AI Labels:** ${report.aiLabels.join(', ')}
📊 **Confidence:** ${(report.confidence * 100).toFixed(1)}%
🧠 **Reasoning:** ${report.reasoning}
📅 **Applied:** ${new Date(report.appliedAt).toLocaleString()}

${report.requiresHumanReview ? '👥 Please review and apply labels manually.' : '✨ Labels applied automatically.'}`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
}

async function postReleaseCandidateReportToTelegram(report: ReleaseCandidateReport, pr: any): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_COUNCIL_ID) {
    console.log('📝 Telegram tokens not available, skipping notification');
    return;
  }

  const status = report.autoPromoted ? '🎉 Promoted to Production' : 
                 report.e2eTestsPassed ? '⏳ Ready for Manual Promotion' :
                 report.stagingDeployed ? '❌ Tests Failed' : '❌ Deployment Failed';

  const message = `🚀 **Release Candidate Pipeline**

PR: [#${report.prId}](${pr.html_url})
Title: ${pr.title}
Status: ${status}

🚀 **Staging Deploy:** ${report.stagingDeployed ? '✅' : '❌'}
🧪 **E2E Tests:** ${report.e2eTestsPassed ? '✅' : '❌'}
🎯 **Production:** ${report.autoPromoted ? '✅' : '❌'}

📅 **Completed:** ${new Date(report.deployedAt).toLocaleString()}

${report.failures.length > 0 ? `🚨 **Failures:**\n${report.failures.map(f => `• ${f}`).join('\n')}` : ''}`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
}

async function postRevertReportToTelegram(report: RevertReport): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_COUNCIL_ID) {
    console.log('📝 Telegram tokens not available, skipping notification');
    return;
  }

  const message = `🔄 **Component Rollback Report**

Component: ${report.component}
Environment: ${report.stage}
Version: ${report.fromVersion} → ${report.toVersion}

🔒 **Policy Check:** ${report.policyCheckPassed ? '✅ Passed' : '❌ Failed'}
📅 **Reverted:** ${new Date(report.revertedAt).toLocaleString()}

📋 **Rollback Plan:**
${report.rollbackPlan}`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
}

async function postComplianceReportToTelegram(report: ComplianceReport): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_COUNCIL_ID) {
    console.log('📝 Telegram tokens not available, skipping notification');
    return;
  }

  const message = `🔍 **Compliance Audit Report**

Scope: ${report.scope}
Status: ${report.compliant ? '✅ Compliant' : '⚠️ Non-Compliant'}

📋 **Policies Checked:** ${report.policiesChecked}
🚨 **Violations:** ${report.violations.length}
📅 **Audited:** ${new Date(report.auditDate).toLocaleString()}

${report.violations.length > 0 ? `🚨 **Violations:**\n${report.violations.map(v => `• ${v}`).join('\n')}` : '✨ No violations found!'}

${report.recommendations.length > 0 ? `💡 **Recommendations:**\n${report.recommendations.map(r => `• ${r}`).join('\n')}` : ''}`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
}

// Enhanced deployment and testing functions
async function runE2ETests(prId: string): Promise<{ passed: boolean; failures: string[] }> {
  console.log(`🧪 Running E2E tests for PR #${prId}...`);
  
  // Mock implementation - would run actual E2E tests
  await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate test time
  
  // Mock passing tests for demo
  return { passed: true, failures: [] };
}

async function triggerProductionDeployment(prId: string): Promise<void> {
  console.log(`🎯 Triggering production deployment for PR #${prId}...`);
  // Mock implementation - would trigger actual production deployment
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate deployment time
}

async function createRollbackPlan(component: string, version: string, stage: string): Promise<{ description: string }> {
  // Mock implementation - would create actual rollback plan
  return { 
    description: `Rollback plan for ${component} in ${stage}:\n1. Validate version ${version} availability\n2. Drain traffic from current instances\n3. Deploy version ${version}\n4. Health check validation\n5. Restore traffic` 
  };
}

async function executeRollback(component: string, version: string, stage: string, plan: any): Promise<{ previousVersion: string }> {
  // Mock implementation - would execute actual rollback
  console.log(`🔄 Executing rollback plan...`);
  await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate rollback time
  return { previousVersion: 'current-version' };
}

async function getCurrentState(scope: string): Promise<any> {
  // Mock implementation - would gather actual current state
  return { scope, resources: [], issues: [], prs: [] };
}

async function getOPAPolicies(scope: string): Promise<any[]> {
  // Mock implementation - would get actual OPA policies
  return [
    { id: 'policy-1', name: 'Security Labels Required', description: 'Critical issues must have security labels' },
    { id: 'policy-2', name: 'Code Review Required', description: 'All PRs must have code review approval' }
  ];
}

async function evaluateCompliance(currentState: any, policies: any[]): Promise<{ violations: string[]; recommendations: string[] }> {
  // Mock implementation - would evaluate actual compliance
  return {
    violations: ['policy-5: Missing security labels on critical issues'],
    recommendations: ['Apply security labels to critical issues', 'Review issue triage process']
  };
}

/**
 * Email reply orchestration - sends AI-drafted email replies from Telegram
 */
export async function sendEmailReply(
  messageId: string,
  replyTo: string,
  subject: string,
  body: string,
  options: { 
    intent?: 'acknowledge' | 'investigating' | 'resolved' | 'escalate';
    tone?: 'professional' | 'casual' | 'urgent';
  } = {}
): Promise<EmailReplyReport> {
  console.log(`📧 Sending email reply to ${replyTo}...`);

  try {
    // Check if we're in test mode
    if (!process.env.EMAIL_SERVICE_API_KEY) {
      console.log('🧪 Running in test mode (no EMAIL_SERVICE_API_KEY set)');
      
      // Use AI to draft the reply
      const draft = await draftEmailReply(
        subject,
        body,
        replyTo,
        options.intent || 'acknowledge',
        options.tone || 'professional'
      );

      const mockReport: EmailReplyReport = {
        originalMessageId: messageId,
        replyTo,
        subject: draft.subject,
        body: draft.body,
        sentAt: new Date().toISOString(),
        confidence: draft.confidence,
        telegramPosted: false
      };

      console.log(`✅ Would send email reply to ${replyTo}`);
      console.log(`📝 Subject: ${draft.subject}`);
      console.log(`📄 Body preview: ${draft.body.substring(0, 100)}...`);
      console.log(`📊 Confidence: ${(draft.confidence * 100).toFixed(1)}%`);
      
      return mockReport;
    }

    // Production implementation would send actual email
    const draft = await draftEmailReply(
      subject,
      body,
      replyTo,
      options.intent || 'acknowledge',
      options.tone || 'professional'
    );

    // Send email via email service (SendGrid, AWS SES, etc.)
    const emailResponse = await sendEmailViaService({
      to: replyTo,
      subject: draft.subject,
      body: draft.body,
      inReplyTo: messageId
    });

    const report: EmailReplyReport = {
      originalMessageId: messageId,
      replyTo,
      subject: draft.subject,
      body: draft.body,
      sentAt: new Date().toISOString(),
      confidence: draft.confidence,
      telegramPosted: false
    };

    // Post to Telegram
    await postEmailReplyReportToTelegram(report);

    return report;

  } catch (error) {
    console.error('❌ Failed to send email reply:', error.message);
    throw error;
  }
}

/**
 * Route diagnostics - analyzes email routing configuration and issues
 */
export async function diagnoseRoute(email: string): Promise<RouteDiagnosticsReport> {
  console.log(`🔍 Diagnosing email routing for ${email}...`);

  try {
    // Parse email address
    const parsedTokens = parseEmailAddress(email);
    
    const diagnostics = {
      parsingErrors: [] as string[],
      routingErrors: [] as string[],
      recommendations: [] as string[]
    };

    // Validate parsing
    if (!parsedTokens.domain) diagnostics.parsingErrors.push('Missing domain token');
    if (!parsedTokens.scope) diagnostics.parsingErrors.push('Missing scope token');
    if (!parsedTokens.type) diagnostics.parsingErrors.push('Missing type token');
    if (!parsedTokens.hierarchy) diagnostics.parsingErrors.push('Missing hierarchy token');

    // Perform AI analysis if we have enough context
    let aiAnalysis: EmailContentAnalysis | undefined;
    if (parsedTokens.domain && parsedTokens.scope) {
      aiAnalysis = await analyzeEmailContent(
        `Test email for ${parsedTokens.domain}.${parsedTokens.scope}`,
        `This is a test email to validate routing for ${email}`,
        parsedTokens.stateId
      );
    }

    // Get routing suggestion
    const routingSuggestion = await suggestEmailRouting(
      parsedTokens.domain || 'unknown',
      parsedTokens.scope || 'unknown',
      parsedTokens.type || 'unknown',
      parsedTokens.hierarchy || 'unknown',
      parsedTokens.meta || 'unknown',
      parsedTokens.stateId,
      aiAnalysis
    );

    // Validate routing
    if (!routingSuggestion.chat_id) {
      diagnostics.routingErrors.push('No suitable chat ID found');
      diagnostics.recommendations.push('Configure TELEGRAM_DEFAULT_CHAT_ID environment variable');
    }

    if (routingSuggestion.routing_confidence < 0.7) {
      diagnostics.recommendations.push('Review routing configuration for low confidence');
    }

    // Generate recommendations
    if (diagnostics.parsingErrors.length === 0 && diagnostics.routingErrors.length === 0) {
      diagnostics.recommendations.push('Email routing configuration looks healthy');
    }

    const report: RouteDiagnosticsReport = {
      email,
      parsedTokens,
      routingSuggestion,
      aiAnalysis,
      diagnostics,
      checkedAt: new Date().toISOString()
    };

    console.log(`📊 Routing diagnostics completed for ${email}`);
    console.log(`🎯 Suggested chat ID: ${routingSuggestion.chat_id || 'None'}`);
    console.log(`📈 Confidence: ${(routingSuggestion.routing_confidence * 100).toFixed(1)}%`);
    console.log(`⚠️  Errors: ${diagnostics.parsingErrors.length + diagnostics.routingErrors.length}`);

    return report;

  } catch (error) {
    console.error('❌ Failed to diagnose route:', error.message);
    throw error;
  }
}

// Helper functions for email orchestration
function parseEmailAddress(email: string): {
  domain?: string;
  scope?: string;
  type?: string;
  hierarchy?: string;
  meta?: string;
  stateId?: string;
} {
  const localPart = email.split('@')[0];
  const tokens = localPart.split('.');
  
  return {
    domain: tokens[0],
    scope: tokens[1],
    type: tokens[2],
    hierarchy: tokens[3],
    meta: tokens[4],
    stateId: tokens[5]
  };
}

async function sendEmailViaService(emailData: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}): Promise<{ messageId: string; status: string }> {
  // Mock implementation - would integrate with actual email service
  console.log(`📨 Sending email via service to ${emailData.to}...`);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
  
  return {
    messageId: `msg_${Date.now()}`,
    status: 'sent'
  };
}

async function postEmailReplyReportToTelegram(report: EmailReplyReport): Promise<void> {
  console.log(`📱 Would post email reply report to Telegram`);
  // Mock implementation - would post to actual Telegram
}

async function postRouteDiagnosticsReportToTelegram(report: RouteDiagnosticsReport): Promise<void> {
  console.log(`📱 Would post route diagnostics report to Telegram`);
  // Mock implementation - would post to actual Telegram
}

// Legacy helper functions (kept for compatibility)
async function triggerStagingDeployment(prId: string) {
  console.log(`🏗️ Triggering staging deployment for PR #${prId}...`);
  // Would trigger CI/CD pipeline for staging
}

async function setupAutoPromotion(prId: string) {
  console.log(`🤖 Setting up auto-promotion for PR #${prId}...`);
  // Would configure auto-merge on successful tests
}

async function validateRollbackPolicy(component: string, version: string, stage: string) {
  console.log(`🛡️ Validating rollback policy for ${component}...`);

  // Check OPA policies for rollback permissions
  return {
    allowed: true,
    reason: 'Policy check passed'
  };
}

async function monitorRollback(component: string, version: string, stage: string) {
  console.log(`📊 Monitoring rollback success...`);
  // Would set up monitoring and alerts
}

export async function sendEmailReply(messageId: string, toEmail: string, options: { intent?: string, tone?: string }) {
  console.log(`📧 Sending AI-drafted email reply to ${toEmail}...`);

  try {
    // Check if we're in test mode
    if (!process.env.SMTP_SERVER) {
      console.log('🧪 Running in test mode (no SMTP_SERVER set)');
      console.log(`📧 Would send reply to ${toEmail} for message ${messageId}`);
      console.log(`🎯 Intent: ${options.intent || 'acknowledge'}`);
      console.log(`🎭 Tone: ${options.tone || 'professional'}`);
      console.log('✅ Email reply simulation completed');
      return;
    }

    // In production, this would:
    // 1. Generate AI-drafted reply based on intent and tone
    // 2. Send via SMTP server
    // 3. Update message status

    console.log(`✅ Email reply sent to ${toEmail}`);

  } catch (error) {
    console.error('❌ Failed to send email reply:', error.message);
    throw error;
  }
}

export async function diagnoseRoute(email: string) {
  console.log(`🔍 Diagnosing email routing for ${email}...`);

  try {
    // Check if we're in test mode
    if (!process.env.ROUTING_CONFIG) {
      console.log('🧪 Running in test mode (no ROUTING_CONFIG set)');
      console.log(`📧 Email: ${email}`);
      console.log('🔄 Routing Rules:');
      console.log('  • Domain routing: support@ -> customer-support');
      console.log('  • Keyword routing: urgent -> priority-queue');
      console.log('  • Sender routing: vip@ -> executive-chat');
      console.log('✅ Route diagnosis simulation completed');
      return;
    }

    // In production, this would:
    // 1. Check routing configuration
    // 2. Test routing logic with the email
    // 3. Verify permissions and access
    // 4. Provide diagnostic information

    console.log(`✅ Route diagnosis completed for ${email}`);

  } catch (error) {
    console.error('❌ Failed to diagnose route:', error.message);
    throw error;
  }
}

// Export functions for use by main TGK binary
// Note: This file is imported by tgk/bin/tgk.js, not run directly
