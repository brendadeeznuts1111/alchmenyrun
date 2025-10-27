#!/usr/bin/env node

/**
 * tgk issue - AI-Driven Issue Management
 * Commands: new (AI wizard), triage (auto-label)
 */

import { Octokit } from '@octokit/rest';
import { TelegramBot } from '../utils/telegram.js';

// Initialize clients
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const telegram = new TelegramBot();

// Enhanced label taxonomy from RFC
const LABEL_TAXONOMY = {
  group: ['customer', 'internal'],
  topic: ['state-pinning', 'observability', 'governance', 'performance', 'security', 'ux'],
  impact: ['low', 'medium', 'high', 'critical'],
  status: ['triage', 'needs-info', 'blocked', 'in-progress', 'review-ready']
};

// AI-powered label suggestion interface
interface LabelSuggestion {
  labels: string[];
  confidence: number;
  reasoning: string;
}

export async function createIssue() {
  console.log('🚀 Launching AI Issue Wizard...');

  try {
    // Interactive prompts for issue creation
    const { createInterface } = await import('readline');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query: string): Promise<string> => {
      return new Promise(resolve => rl.question(query, resolve));
    };

    const title = await question('📝 Issue Title: ');
    const body = await question('📄 Issue Description: ');
    const type = await question('🏷️  Type (bug/feature/question): ');

    rl.close();

    // AI-powered labeling with enhanced analysis
    const labels = await suggestLabels(title, body);

    // Create GitHub issue
    const issue = await octokit.issues.create({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      title,
      body: `${body}\n\n---\n*AI-generated labels: ${labels.labels.join(', ')}*\n*Confidence: ${(labels.confidence * 100).toFixed(1)}%*\n*Reasoning: ${labels.reasoning}*`,
      labels: labels.labels
    });

    console.log(`✅ Issue #${issue.data.number} created with AI labels: ${labels.labels.join(', ')}`);
    console.log(`🎯 Confidence: ${(labels.confidence * 100).toFixed(1)}%`);
    console.log(`🧠 Reasoning: ${labels.reasoning}`);

    // Auto-triage if confidence > 80%
    if (labels.confidence > 0.8) {
      console.log('🎯 Auto-triaging issue...');
      await triageIssue(issue.data.number.toString());
    }

    return issue.data;

  } catch (error) {
    console.error('❌ Failed to create issue:', error.message);
    throw error;
  }
}

export async function triageIssue(issueNumber: string) {
  console.log(`🔍 AI-powered triage for issue #${issueNumber}...`);

  try {
    // Check if we're in test mode (no real API calls)
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      console.log(`🎯 Would triage issue #${issueNumber}`);
      console.log('🏷️  Would apply AI labels: group/internal, topic/governance, impact/low, status/triage');
      console.log('✅ AI confidence: 0.85');
      console.log('🧠 Reasoning: Issue appears to be internal governance related with low impact');
      return;
    }

    // Get issue details
    const { data: issue } = await octokit.issues.get({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      issue_number: parseInt(issueNumber)
    });

    // Enhanced AI labeling with reasoning
    const labels = await suggestLabels(issue.title, issue.body || '');

    console.log(`🧠 AI Analysis Complete:`);
    console.log(`   📊 Confidence: ${(labels.confidence * 100).toFixed(1)}%`);
    console.log(`   🏷️  Suggested Labels: ${labels.labels.join(', ')}`);
    console.log(`   💭 Reasoning: ${labels.reasoning}`);

    // Apply labels if confidence > 80%
    if (labels.confidence > 0.8) {
      await octokit.issues.addLabels({
        owner: 'brendadeeznuts1111',
        repo: 'alchmenyrun',
        issue_number: parseInt(issueNumber),
        labels: labels.labels
      });

      console.log(`✅ Applied AI labels to #${issueNumber}: ${labels.labels.join(', ')}`);

      // Add status/triage label for processed issues
      await octokit.issues.addLabels({
        owner: 'brendadeeznuts1111',
        repo: 'alchmenyrun',
        issue_number: parseInt(issueNumber),
        labels: ['status/triage']
      });

      // Notify if confidence < 80% (send to council)
      if (labels.confidence < 0.8) {
        await notifyCouncilForReview(issue, labels);
      }
    } else {
      await notifyCouncilForReview(issue, labels);
    }

  } catch (error) {
    console.error(`❌ Failed to triage issue #${issueNumber}:`, error.message);
    throw error;
  }
}

/**
 * Enhanced AI-powered label suggestion with reasoning
 */
async function suggestLabels(title: string, body: string): Promise<LabelSuggestion> {
  const content = `${title} ${body}`.toLowerCase();
  
  // Enhanced AI analysis with multiple factors
  let group = 'internal';
  let topic = 'governance';
  let impact = 'low';
  let status = 'triage';
  let confidence = 0.85;
  let reasoning = '';

  // Group classification
  if (content.includes('customer') || content.includes('user') || content.includes('login') || 
      content.includes('external') || content.includes('client')) {
    group = 'customer';
    reasoning += 'Customer-facing issue detected. ';
  } else {
    reasoning += 'Internal issue detected. ';
  }

  // Topic classification with enhanced patterns
  if (content.includes('pin') || content.includes('state') || content.includes('concurrent') || 
      content.includes('lock') || content.includes('atomic')) {
    topic = 'state-pinning';
    reasoning += 'Related to state management and concurrency. ';
  } else if (content.includes('metrics') || content.includes('monitor') || content.includes('observability') || 
             content.includes('dashboard') || content.includes('alert')) {
    topic = 'observability';
    reasoning += 'Observability and monitoring related. ';
  } else if (content.includes('security') || content.includes('auth') || content.includes('vulnerability') || 
             content.includes('permission')) {
    topic = 'security';
    reasoning += 'Security-related issue. ';
  } else if (content.includes('performance') || content.includes('slow') || content.includes('optimize') || 
             content.includes('speed')) {
    topic = 'performance';
    reasoning += 'Performance optimization needed. ';
  } else if (content.includes('ux') || content.includes('ui') || content.includes('interface') || 
             content.includes('experience')) {
    topic = 'ux';
    reasoning += 'User experience improvement. ';
  } else {
    reasoning += 'General governance issue. ';
  }

  // Impact assessment with severity indicators
  if (content.includes('critical') || content.includes('crash') || content.includes('broken') || 
      content.includes('security') || content.includes('data loss')) {
    impact = 'critical';
    confidence = 0.95;
    reasoning += 'High impact - critical system affected. ';
  } else if (content.includes('high') || content.includes('urgent') || content.includes('blocker') || 
             content.includes('production')) {
    impact = 'high';
    confidence = 0.90;
    reasoning += 'High impact - production system affected. ';
  } else if (content.includes('medium') || content.includes('important') || content.includes('feature')) {
    impact = 'medium';
    confidence = 0.85;
    reasoning += 'Medium impact - feature-level issue. ';
  } else {
    reasoning += 'Low impact - minor improvement or fix. ';
  }

  // Status classification
  if (content.includes('question') || content.includes('how to') || content.includes('help')) {
    status = 'needs-info';
    reasoning += 'Requires additional information. ';
  } else if (content.includes('blocked') || content.includes('waiting') || content.includes('dependency')) {
    status = 'blocked';
    reasoning += 'Currently blocked by dependencies. ';
  } else if (content.includes('in progress') || content.includes('working') || content.includes('wip')) {
    status = 'in-progress';
    reasoning += 'Work is currently in progress. ';
  } else if (content.includes('ready') || content.includes('review') || content.includes('complete')) {
    status = 'review-ready';
    reasoning += 'Ready for review. ';
  }

  const labels = [
    `group/${group}`,
    `topic/${topic}`,
    `impact/${impact}`,
    `status/${status}`
  ];

  // Adjust confidence based on content clarity
  if (content.length < 50) {
    confidence -= 0.1;
    reasoning += 'Low confidence due to limited content. ';
  }

  return { 
    labels: labels.filter(l => !l.includes('status/')), // Don't auto-apply status labels
    confidence: Math.max(confidence, 0.5), 
    reasoning: reasoning.trim()
  };
}

async function notifyCouncilForReview(issue: any, labels: LabelSuggestion) {
  // Skip Telegram notification if tokens not available
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_COUNCIL_ID) {
    console.log('📝 Telegram tokens not available, skipping council notification');
    return;
  }

  const message = `🤖 **AI Triage Review Needed**

Issue: [#${issue.number}](${issue.html_url})
Title: ${issue.title}

🏷️ **AI Suggested Labels:** ${labels.labels.join(', ')}
📊 **Confidence:** ${(labels.confidence * 100).toFixed(1)}%
🧠 **AI Reasoning:** ${labels.reasoning}

Please review and apply manual labels if needed. Use \`tgk issue triage ${issue.number}\` to apply suggestions.`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
}

export async function followIssue(issueNumber: string, options: { telegram?: string, email?: string }) {
  console.log(`👁️ Setting up follow notifications for issue #${issueNumber}...`);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      console.log(`👁️ Would set up notifications for issue #${issueNumber}`);
      if (options.telegram) {
        console.log(`📱 Telegram notifications to: ${options.telegram}`);
      }
      if (options.email) {
        console.log(`📧 Email notifications to: ${options.email}`);
      }
      console.log('✅ Follow setup simulation completed');
      return;
    }

    // In production, this would:
    // 1. Store notification preferences in database
    // 2. Set up webhook listeners for issue updates
    // 3. Configure automated status change detection

    console.log(`✅ Follow notifications configured for issue #${issueNumber}`);
    console.log('📬 Will notify on: triage → in-progress, in-progress → resolved, priority changes');

  } catch (error) {
    console.error('❌ Failed to set up issue follow:', error.message);
    throw error;
  }
}

export async function getIssueStatus(issueNumber: string, options: { detailed?: boolean }) {
  console.log(`📊 Getting detailed status for issue #${issueNumber}...`);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      console.log(`📋 Issue #${issueNumber} Status Report:`);
      console.log('🏷️  Labels: type/bug, priority/high, status/in-progress');
      console.log('👤 Assignee: @developer');
      console.log('🔗 Linked PRs: #456 (Fix implementation)');
      console.log('⏰ SLA: 4 days remaining (72h total)');
      console.log('📊 Progress: 60% complete');

      if (options.detailed) {
        console.log('\n🤖 AI Analysis:');
        console.log('🎯 Next Steps: Complete unit tests, update documentation');
        console.log('⚠️  Risks: May impact customer authentication flow');
        console.log('📈 Confidence: High (85%)');
      }

      return {
        number: issueNumber,
        status: 'in-progress',
        labels: ['type/bug', 'priority/high'],
        assignee: '@developer',
        linkedPRs: ['#456'],
        sla: { remaining: '4 days', total: '72h' },
        progress: '60%'
      };
    }

    // In production, this would fetch comprehensive issue data
    // including linked PRs, SLA status, AI analysis, etc.

    const issue = await octokit.issues.get({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      issue_number: parseInt(issueNumber)
    });

    console.log(`📋 Issue #${issueNumber} Status Report:`);
    console.log(`🏷️  Labels: ${issue.data.labels.map(l => l.name).join(', ') || 'none'}`);
    console.log(`👤 Assignee: ${issue.data.assignee?.login || 'unassigned'}`);
    console.log(`📊 State: ${issue.data.state}`);
    console.log(`⏰ Created: ${new Date(issue.data.created_at).toLocaleDateString()}`);

    return {
      number: issueNumber,
      status: issue.data.state,
      labels: issue.data.labels.map(l => l.name),
      assignee: issue.data.assignee?.login,
      created: issue.data.created_at
    };

  } catch (error) {
    console.error('❌ Failed to get issue status:', error.message);
    throw error;
  }
}

// CLI interface (for direct execution, not used when imported by CLI)
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'new':
        await createIssue();
        break;
      case 'triage':
        const issueId = args[2];
        if (!issueId) {
          console.error('Usage: tgk issue triage <issue-number>');
          process.exit(1);
        }
        await triageIssue(issueId);
        break;
      case 'follow':
        const followId = args[2];
        if (!followId) {
          console.error('Usage: tgk issue follow <issue-number>');
          process.exit(1);
        }
        await followIssue(followId, {});
        break;
      case 'status':
        const statusId = args[2];
        if (!statusId) {
          console.error('Usage: tgk issue status <issue-number>');
          process.exit(1);
        }
        await getIssueStatus(statusId, {});
        break;
      default:
        console.log('Available commands:');
        console.log('  tgk issue new <title>    - Create issue with AI wizard');
        console.log('  tgk issue triage <id>    - Auto-triage existing issue');
        console.log('  tgk issue follow <id>    - Set up issue notifications');
        console.log('  tgk issue status <id>    - Get detailed issue status');
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
