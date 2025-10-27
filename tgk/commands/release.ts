#!/usr/bin/env node

/**
 * tgk release - AI-Driven Release Orchestration
 * Commands: plan (AI drafts), approve (OPA gate), deploy (CI trigger)
 */

import { Octokit } from '@octokit/rest';
import { TelegramBot } from '../utils/telegram.js';
import { RFCStore } from '../utils/rfc-store.js';

// Initialize clients
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const telegram = new TelegramBot();
const rfcStore = new RFCStore();

interface ReleasePlan {
  id: string;
  type: 'patch' | 'minor' | 'major';
  version: string;
  changelog: string;
  impact: string;
  approvers: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'deployed';
  created_at: string;
  telegram_message_id?: string;
}

export async function planRelease(options: { type: 'patch' | 'minor' | 'major' }) {
  console.log(`🎯 Planning ${options.type} release with AI...`);

  try {
    // Check if we're in test mode (no real API calls)
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      const nextVersion = bumpVersion('0.5.0', options.type);
      console.log(`📋 Would create release plan for v${nextVersion}`);
      console.log(`🎯 Impact: ${options.type === 'major' ? 'high' : 'medium'}`);
      console.log('📨 Would post to Alchemists Council for approval');
      console.log('✅ Release plan simulation completed');
      return { id: `release-test-${Date.now()}`, version: nextVersion, type: options.type };
    }

    // Get recent commits and PRs for changelog
    const { data: commits } = await octokit.repos.listCommits({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      per_page: 50
    });

    // AI-generated changelog (simplified)
    const changelog = await generateChangelog(commits, options.type);

    // Determine next version
    const currentVersion = await getCurrentVersion();
    const nextVersion = bumpVersion(currentVersion, options.type);

    // Assess impact
    const impact = assessReleaseImpact(commits, options.type);

    // Create release plan
    const releaseId = `release-${Date.now()}`;
    const releasePlan: ReleasePlan = {
      id: releaseId,
      type: options.type,
      version: nextVersion,
      changelog,
      impact,
      approvers: [],
      status: 'draft',
      created_at: new Date().toISOString()
    };

    // Store release plan
    await storeReleasePlan(releasePlan);

    // Post to council for approval
    await postReleasePlanToCouncil(releasePlan);

    console.log(`📋 Release plan ${releaseId} created for v${nextVersion}`);
    console.log(`🎯 Impact: ${impact}`);
    console.log(`📨 Posted to Alchemists Council for approval`);

    return releasePlan;

  } catch (error) {
    console.error('❌ Failed to plan release:', error.message);
    throw error;
  }
}

export async function approveRelease(releaseId: string, approver: string) {
  console.log(`✅ Approving release ${releaseId}...`);

  try {
    // Get release plan
    const releasePlan = await getReleasePlan(releaseId);
    if (!releasePlan) {
      throw new Error(`Release plan ${releaseId} not found`);
    }

    // Check OPA policy
    const policyCheck = await checkReleasePolicy(releasePlan, approver);
    if (!policyCheck.allowed) {
      throw new Error(`Policy violation: ${policyCheck.message}`);
    }

    // Record approval
    releasePlan.approvers.push(approver);
    releasePlan.status = 'approved';
    await storeReleasePlan(releasePlan);

    // Update Telegram message
    await updateReleaseMessage(releasePlan);

    console.log(`🎉 Release ${releaseId} approved by ${approver}`);
    console.log(`🚀 Ready for deployment`);

    return releasePlan;

  } catch (error) {
    console.error(`❌ Failed to approve release ${releaseId}:`, error.message);
    throw error;
  }
}

export async function deployRelease(releaseId: string) {
  console.log(`🚀 Deploying release ${releaseId}...`);

  try {
    // Get approved release plan
    const releasePlan = await getReleasePlan(releaseId);
    if (!releasePlan || releasePlan.status !== 'approved') {
      throw new Error(`Release ${releaseId} is not approved for deployment`);
    }

    // Final policy check
    const policyCheck = await checkReleasePolicy(releasePlan);
    if (!policyCheck.allowed) {
      throw new Error(`Deployment blocked by policy: ${policyCheck.message}`);
    }

    // Trigger CI deployment
    await triggerDeployment(releasePlan);

    // Update status
    releasePlan.status = 'deployed';
    await storeReleasePlan(releasePlan);

    // Update Telegram
    await updateReleaseMessage(releasePlan);

    console.log(`✅ Release ${releaseId} deployed successfully`);
    console.log(`🎊 v${releasePlan.version} is now live!`);

    return releasePlan;

  } catch (error) {
    console.error(`❌ Failed to deploy release ${releaseId}:`, error.message);
    throw error;
  }
}

async function generateChangelog(commits: any[], type: string): Promise<string> {
  // AI-powered changelog generation (simplified)
  const changes = commits.slice(0, 20).map(commit => {
    const message = commit.commit.message.split('\n')[0];
    return `- ${message}`;
  });

  return `# Release Notes

## Changes
${changes.join('\n')}

## Impact
${type === 'major' ? 'Breaking changes included' : 'Backward compatible'}`;
}

async function getCurrentVersion(): Promise<string> {
  try {
    const { data: release } = await octokit.repos.getLatestRelease({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun'
    });
    return release.tag_name.replace('v', '');
  } catch {
    return '0.1.0'; // Default if no releases
  }
}

function bumpVersion(current: string, type: 'patch' | 'minor' | 'major'): string {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
  }
}

function assessReleaseImpact(commits: any[], type: string): string {
  if (type === 'major') return 'high';
  if (type === 'minor') return 'medium';
  return 'low';
}

async function storeReleasePlan(plan: ReleasePlan): Promise<void> {
  // Store in RFC store for now (could be dedicated storage later)
  const key = `release:${plan.id}`;
  await (rfcStore as any).storage.set(key, plan);
}

async function getReleasePlan(releaseId: string): Promise<ReleasePlan | null> {
  const key = `release:${releaseId}`;
  return await (rfcStore as any).storage.get(key);
}

async function checkReleasePolicy(plan: ReleasePlan, approver?: string): Promise<{allowed: boolean, message: string}> {
  // Call OPA policy evaluation (simplified - would call tgk-orchestrator worker)
  const policyInput = {
    release: {
      type: plan.type,
      impact: plan.impact,
      approvers: plan.approvers
    },
    approver: approver || 'unknown'
  };

  // Mock OPA evaluation
  if (plan.type === 'major' && !plan.approvers.includes('@alchemist/core')) {
    return { allowed: false, message: 'Major releases require @alchemist/core approval' };
  }

  return { allowed: true, message: 'Policy check passed' };
}

async function postReleasePlanToCouncil(plan: ReleasePlan): Promise<void> {
  const message = `🚀 **Release Plan: ${plan.version}**

Type: ${plan.type.toUpperCase()}
Impact: ${plan.impact}

${plan.changelog}

Approvers needed: ${plan.type === 'major' ? '@alchemist/core' : '2 council members'}`;

  const buttons = {
    inline_keyboard: [[
      { text: "✅ Approve Release", callback_data: `/tgk release approve ${plan.id}` },
      { text: "❌ Reject", callback_data: `/tgk release reject ${plan.id}` }
    ]]
  };

  const telegramMessage = await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    {
      message_thread_id: '25782',
      reply_markup: buttons
    }
  );

  // Pin the message
  await telegram.pinMessage(process.env.TELEGRAM_COUNCIL_ID, telegramMessage.message_id);

  // Store message ID
  plan.telegram_message_id = telegramMessage.message_id;
  await storeReleasePlan(plan);
}

async function updateReleaseMessage(plan: ReleasePlan): Promise<void> {
  if (!plan.telegram_message_id) return;

  const statusEmoji = {
    draft: '📝',
    pending_approval: '⏳',
    approved: '✅',
    deployed: '🎉'
  };

  const message = `${statusEmoji[plan.status]} **Release ${plan.version}** - ${plan.status.replace('_', ' ').toUpperCase()}

Type: ${plan.type.toUpperCase()}
Impact: ${plan.impact}
Approvers: ${plan.approvers.join(', ') || 'None'}

${plan.status === 'deployed' ? '🎊 Successfully deployed!' : 'Waiting for approval...'}`;

  await telegram.updatePinnedMessage(plan.telegram_message_id, message);
}

async function triggerDeployment(plan: ReleasePlan): Promise<void> {
  // Trigger GitHub Actions deployment
  const { execSync } = await import('child_process');

  execSync(`gh workflow run deploy.yml -f version=${plan.version} -f type=${plan.type}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'plan':
        const type = args.find(arg => arg.startsWith('--type='))?.split('=')[1] as 'patch' | 'minor' | 'major';
        if (!type) {
          console.error('Usage: tgk release plan --type=<patch|minor|major>');
          process.exit(1);
        }
        await planRelease({ type });
        break;
      case 'approve':
        const releaseId = args[2];
        const approver = process.env.TGK_USER || process.env.USER || 'unknown';
        if (!releaseId) {
          console.error('Usage: tgk release approve <release-id>');
          process.exit(1);
        }
        await approveRelease(releaseId, approver);
        break;
      case 'deploy':
        const deployId = args[2];
        if (!deployId) {
          console.error('Usage: tgk release deploy <release-id>');
          process.exit(1);
        }
        await deployRelease(deployId);
        break;
      default:
        console.log('Available commands:');
        console.log('  tgk release plan --type=<patch|minor|major>  - AI-generated release plan');
        console.log('  tgk release approve <id>                     - Approve release (OPA gated)');
        console.log('  tgk release deploy <id>                      - Deploy approved release');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
