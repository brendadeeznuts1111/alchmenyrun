import { Command } from 'commander';
import { makeRpcCall } from '../core/rpc.js';
import { evaluatePolicy } from '../core/policy.js';

export function createReleaseCommands(): Command {
  const release = new Command('release')
    .description('AI-powered release planning and orchestration');

  release
    .command('plan')
    .description('Generate AI-powered release plan')
    .requiredOption('--type <type>', 'Release type (patch, minor, major)', 'patch')
    .option('--components <components>', 'Components to include (comma-separated)', 'core,ui,workers')
    .option('--urgency <urgency>', 'Release urgency (low, normal, high, critical)', 'normal')
    .option('--dry-run', 'Show plan without approval process')
    .action(async (options) => {
      try {
        console.log(`🚀 Generating ${options.type} release plan...`);
        
        // Generate release plan
        const plan = await generateReleasePlan({
          type: options.type as 'patch' | 'minor' | 'major',
          components: options.components.split(',').map((c: string) => c.trim()),
          urgency: options.urgency as 'low' | 'normal' | 'high' | 'critical'
        });
        
        console.log('\n📋 Release Plan Generated:');
        console.log('─'.repeat(60));
        console.log(`Type: ${plan.type}`);
        console.log(`Components: ${plan.components.join(', ')}`);
        console.log(`Estimated Duration: ${plan.estimatedDuration}`);
        console.log(`Risk Level: ${plan.riskLevel}`);
        console.log(`Steps: ${plan.steps.length}`);
        console.log('\n📝 Plan Steps:');
        plan.steps.forEach((step, index) => {
          console.log(`${index + 1}. ${step}`);
        });
        console.log(`\n🔄 Rollback Plan: ${plan.rollbackPlan}`);
        console.log('─'.repeat(60));
        
        if (options.dryRun) {
          console.log('\nℹ️  Dry run - no approval process initiated');
          return;
        }
        
        // Check policy compliance
        console.log('\n🔍 Checking policy compliance...');
        const policyResult = await checkPolicyCompliance(plan);
        
        if (!policyResult.allowed) {
          console.error(`❌ Policy check failed: ${policyResult.reason}`);
          console.log('\n📝 Required approvals:');
          policyResult.requiredApprovals.forEach(approval => {
            console.log(`   - ${approval.role}: ${approval.count} required`);
          });
          return;
        }
        
        console.log('✅ Policy check passed');
        
        // Send to Telegram for approval
        console.log('\n📤 Sending to Telegram for approval...');
        const approvalMessage = await sendToTelegramForApproval(plan);
        console.log(`✅ Approval request sent: ${approvalMessage.messageId}`);
        console.log('\n⏳ Awaiting approvals in Telegram topic...');
        console.log('   Use /lgtm to approve, /hold to request changes');
        
      } catch (error) {
        console.error(`❌ Release planning failed: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  release
    .command('approve')
    .description('Approve a pending release (Telegram integration)')
    .argument('<release-id>', 'Release ID from Telegram message')
    .option('--role <role>', 'Your approval role', 'tech-lead')
    .action(async (releaseId: string, options) => {
      try {
        console.log(`✅ Approving release ${releaseId} as ${options.role}...`);
        
        const result = await approveRelease(releaseId, options.role);
        
        if (result.success) {
          console.log('🎉 Release approved!');
          console.log('🚀 Deployment will begin automatically...');
        } else {
          console.error(`❌ Approval failed: ${result.error}`);
          process.exit(1);
        }
        
      } catch (error) {
        console.error(`❌ Approval error: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  release
    .command('status')
    .description('Check release status and approvals')
    .argument('<release-id>', 'Release ID')
    .action(async (releaseId: string) => {
      try {
        const status = await getReleaseStatus(releaseId);
        
        console.log('\n📊 Release Status:');
        console.log('─'.repeat(50));
        console.log(`Release ID: ${status.id}`);
        console.log(`Status: ${status.status}`);
        console.log(`Type: ${status.type}`);
        console.log(`Created: ${status.createdAt}`);
        
        console.log('\n✅ Approvals:');
        status.approvals.forEach(approval => {
          console.log(`   ${approval.role}: ${approval.count}/${approval.required} (${approval.status})`);
        });
        
        if (status.blockers.length > 0) {
          console.log('\n🚧 Blockers:');
          status.blockers.forEach(blocker => {
            console.log(`   - ${blocker}`);
          });
        }
        
        console.log('─'.repeat(50));
        
      } catch (error) {
        console.error(`❌ Status check failed: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  return release;
}

// Core release planning logic
export async function generateReleasePlan(config: ReleaseConfig): Promise<ReleasePlan> {
  // AI-generated release steps based on type and components
  const baseSteps = [
    'Run comprehensive test suite',
    'Build and package components',
    'Deploy to staging environment',
    'Run smoke tests'
  ];
  
  const additionalSteps = [];
  
  // Add type-specific steps
  if (config.type === 'major') {
    additionalSteps.push(
      'Run extended integration tests',
      'Perform canary deployment',
      'Monitor for 2 hours',
      'Gradual rollout to 50% traffic'
    );
  } else if (config.type === 'minor') {
    additionalSteps.push(
      'Run integration tests',
      'Monitor for 1 hour',
      'Gradual rollout to 100% traffic'
    );
  } else {
    // Patch release
    additionalSteps.push(
      'Deploy to production',
      'Monitor for 30 minutes'
    );
  }
  
  // Component-specific steps
  if (config.components.includes('workers')) {
    additionalSteps.push('Deploy Cloudflare Workers');
  }
  
  if (config.components.includes('database')) {
    additionalSteps.push('Run database migrations');
  }
  
  const allSteps = [...baseSteps, ...additionalSteps];
  
  return {
    id: `release-${Date.now()}`,
    type: config.type,
    components: config.components,
    steps: allSteps,
    estimatedDuration: getEstimatedDuration(config.type, config.urgency),
    riskLevel: assessRisk(config),
    rollbackPlan: 'git revert HEAD && wrangler deploy --env production',
    createdAt: new Date().toISOString(),
    status: 'planned'
  };
}

export function getEstimatedDuration(type: string, urgency: string): string {
  const baseDuration = {
    patch: '30m',
    minor: '2h',
    major: '4h'
  };
  
  const urgencyMultiplier = {
    low: 1.5,
    normal: 1.0,
    high: 0.8,
    critical: 0.5
  };
  
  return baseDuration[type as keyof typeof baseDuration] || '2h';
}

export function assessRisk(config: ReleaseConfig): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // Type risk
  if (config.type === 'major') riskScore += 3;
  if (config.type === 'minor') riskScore += 2;
  if (config.type === 'patch') riskScore += 1;
  
  // Urgency risk
  if (config.urgency === 'critical') riskScore += 3;
  if (config.urgency === 'high') riskScore += 2;
  if (config.urgency === 'normal') riskScore += 1;
  
  // Component risk
  if (config.components.includes('database')) riskScore += 2;
  if (config.components.includes('core')) riskScore += 1;
  
  if (riskScore >= 6) return 'high';
  if (riskScore >= 4) return 'medium';
  return 'low';
}

export async function checkPolicyCompliance(plan: ReleasePlan): Promise<PolicyResult> {
  // Basic OPA policy check
  const policyInput = {
    action: 'deploy',
    release: {
      type: plan.type,
      riskLevel: plan.riskLevel,
      components: plan.components
    },
    timestamp: new Date().toISOString()
  };
  
  const result = await evaluatePolicy('release.deployment', policyInput);
  
  return {
    allowed: result.allowed,
    reason: result.reason,
    requiredApprovals: result.requiredApprovals || [],
    currentApprovals: result.currentApprovals || []
  };
}

export async function sendToTelegramForApproval(plan: ReleasePlan): Promise<TelegramMessage> {
  const message = buildTelegramApprovalMessage(plan);
  
  return await makeRpcCall('telegram.sendMessage', {
    chatId: process.env.TELEGRAM_COUNCIL_ID,
    text: message.text,
    parseMode: 'Markdown',
    replyMarkup: {
      inlineKeyboard: [
        [
          { text: '✅ Approve', callback_data: `release_approve:${plan.id}:tech-lead` },
          { text: '✅ Approve', callback_data: `release_approve:${plan.id}:security` }
        ],
        [
          { text: '🚧 Request Changes', callback_data: `release_hold:${plan.id}` },
          { text: '❌ Reject', callback_data: `release_reject:${plan.id}` }
        ]
      ]
    }
  });
}

export function buildTelegramApprovalMessage(plan: ReleasePlan): { text: string } {
  const text = [
    '🚀 *Release Approval Request*',
    '',
    `*Type:* ${plan.type}`,
    `*Components:* ${plan.components.join(', ')}`,
    `*Risk Level:* ${plan.riskLevel}`,
    `*Estimated Duration:* ${plan.estimatedDuration}`,
    '',
    '*Steps:*',
    ...plan.steps.map((step, i) => `${i + 1}. ${step}`),
    '',
    `*Rollback Plan:* ${plan.rollbackPlan}`,
    '',
    '👇 Please review and approve using the buttons below'
  ].join('\n');
  
  return { text };
}

// Types
export interface ReleaseConfig {
  type: 'patch' | 'minor' | 'major';
  components: string[];
  urgency: 'low' | 'normal' | 'high' | 'critical';
}

export interface ReleasePlan {
  id: string;
  type: string;
  components: string[];
  steps: string[];
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
  rollbackPlan: string;
  createdAt: string;
  status: string;
}

export interface PolicyResult {
  allowed: boolean;
  reason: string;
  requiredApprovals: Array<{ role: string; count: number }>;
  currentApprovals: Array<{ role: string; count: number }>;
}

export interface TelegramMessage {
  messageId: string;
  chatId: string;
}

export interface ReleaseStatus {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  approvals: Array<{
    role: string;
    count: number;
    required: number;
    status: string;
  }>;
  blockers: string[];
}

export interface ApprovalResult {
  success: boolean;
  error?: string;
}


// Helper functions for approval and status
export async function approveRelease(releaseId: string, role: string): Promise<ApprovalResult> {
  try {
    // Record approval in database/state
    await makeRpcCall('release.addApproval', {
      releaseId,
      role,
      timestamp: new Date().toISOString()
    });
    
    // Check if all required approvals are met
    const status = await getReleaseStatus(releaseId);
    const allApproved = status.approvals.every(approval => 
      approval.count >= approval.required
    );
    
    if (allApproved) {
      // Trigger deployment
      await makeRpcCall('release.deploy', { releaseId });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getReleaseStatus(releaseId: string): Promise<ReleaseStatus> {
  return await makeRpcCall('release.getStatus', { releaseId });
}
