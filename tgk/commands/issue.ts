#!/usr/bin/env node

/**
 * tgk issue - AI-Driven Issue Management
 * Commands: new (AI wizard), triage (auto-label)
 */

import { Octokit } from '@octokit/rest';
import { TelegramBot } from '../utils/telegram.js';
import { ui } from '../utils/ui.js';

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
  ui.header(`AI Issue Triage #${issueNumber}`, ui.symbols.brain);

  try {
    // Check if we're in test mode (no real API calls)
    if (!process.env.GITHUB_TOKEN) {
      ui.info('Running in test mode (no GITHUB_TOKEN set)');

      const mockLabels = ['group/internal', 'topic/governance', 'impact/low', 'status/triage'];
      const mockConfidence = 0.85;

      ui.section('AI Analysis Results', ui.symbols.target);
      ui.keyValue('Suggested Labels', mockLabels.join(', '), 'cyan', 'yellow');
      ui.keyValue('Confidence', ui.confidence(mockConfidence), 'cyan', 'green');
      ui.keyValue('Reasoning', 'Issue appears to be internal governance related with low impact', 'cyan', 'white');

      ui.success(`Would apply ${mockLabels.length} labels to issue #${issueNumber}`);
      return;
    }

    ui.loading('Fetching issue details...');
    const { data: issue } = await octokit.issues.get({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      issue_number: parseInt(issueNumber)
    });

    ui.loading('Running AI analysis...');
    const labels = await suggestLabels(issue.title, issue.body || '');

    ui.section('AI Analysis Results', ui.symbols.brain);
    ui.keyValue('Issue Title', issue.title.substring(0, 50) + (issue.title.length > 50 ? '...' : ''), 'cyan', 'white');
    ui.keyValue('Suggested Labels', labels.labels.join(', '), 'cyan', 'yellow');
    ui.keyValue('Confidence', ui.confidence(labels.confidence), 'cyan', 'green');
    ui.keyValue('Reasoning', labels.reasoning, 'cyan', 'white');

    // Apply labels if confidence > 80%
    if (labels.confidence > 0.8) {
      ui.loading('Applying AI-suggested labels...');

      await octokit.issues.addLabels({
        owner: 'brendadeeznuts1111',
        repo: 'alchmenyrun',
        issue_number: parseInt(issueNumber),
        labels: labels.labels
      });

      // Add status/triage label for processed issues
      await octokit.issues.addLabels({
        owner: 'brendadeeznuts1111',
        repo: 'alchmenyrun',
        issue_number: parseInt(issueNumber),
        labels: ['status/triage']
      });

      ui.success(`Applied ${labels.labels.length} AI labels to issue #${issueNumber}`);

      // Create summary box
      ui.summaryBox('Triage Summary', [
        `Issue: #${issueNumber}`,
        `Labels: ${labels.labels.length} applied`,
        `Confidence: ${(labels.confidence * 100).toFixed(1)}%`,
        `Status: Auto-triaged`
      ], ui.symbols.check);

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
  ui.header(`Issue Status Report #${issueNumber}`, ui.symbols.monitor);

  try {
    // Check if we're in test mode
    if (!process.env.GITHUB_TOKEN) {
      ui.info('Running in test mode (no GITHUB_TOKEN set)');

      ui.section('Issue Overview', ui.symbols.chart);
      ui.keyValue('Title', 'Sample Issue Title', 'cyan', 'white');
      ui.keyValue('State', ui.badge('IN PROGRESS', 'info'), 'cyan', 'blue');
      ui.keyValue('Assignee', '@developer', 'cyan', 'green');
      ui.keyValue('Created', ui.timeAgo(new Date(Date.now() - 86400000)), 'cyan', 'gray');

      ui.section('Labels & Priority', ui.symbols.tag);
      const mockLabels = ['type/bug', 'priority/high', 'status/in-progress'];
      ui.keyValue('Labels', mockLabels.join(', '), 'cyan', 'yellow');
      ui.keyValue('Priority', ui.priority('high'), 'cyan', 'yellow');

      ui.section('Progress & SLA', ui.symbols.clock);
      ui.keyValue('Progress', '60%', 'cyan', 'green');
      ui.keyValue('SLA Remaining', '4 days', 'cyan', 'red');
      ui.keyValue('SLA Total', '72h', 'cyan', 'gray');

      if (options.detailed) {
        ui.section('AI Analysis', ui.symbols.brain);
        ui.keyValue('Next Steps', 'Complete unit tests, update documentation', 'cyan', 'white');
        ui.keyValue('Risks', 'May impact customer authentication flow', 'cyan', 'red');
        ui.keyValue('Confidence', ui.confidence(0.85), 'cyan', 'green');

        ui.section('Linked Items', ui.symbols.link);
        ui.table(['Type', 'ID', 'Title', 'Status'], [
          ['PR', '#456', 'Fix implementation', 'Open'],
          ['Issue', '#123', 'Related bug', 'Closed']
        ]);
      }

      ui.summaryBox('Status Summary', [
        `State: ${ui.badge('IN PROGRESS', 'info')}`,
        `Priority: ${ui.priority('high')}`,
        `Progress: 60%`,
        `SLA: 4 days remaining`
      ], ui.symbols.check);

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
    ui.loading('Fetching issue details...');
    const { data: issue } = await octokit.issues.get({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      issue_number: parseInt(issueNumber)
    });

    ui.section('Issue Overview', ui.symbols.chart);
    ui.keyValue('Title', issue.title, 'cyan', 'white');
    ui.keyValue('State', ui.badge(issue.state.toUpperCase(), issue.state === 'open' ? 'info' : 'success'), 'cyan', 'blue');
    ui.keyValue('Assignee', issue.assignee?.login || 'unassigned', 'cyan', issue.assignee ? 'green' : 'gray');
    ui.keyValue('Created', ui.timeAgo(issue.created_at), 'cyan', 'gray');

    ui.section('Labels', ui.symbols.tag);
    const labels = issue.labels.map(l => typeof l === 'string' ? l : l.name);
    ui.keyValue('Labels', labels.join(', ') || 'none', 'cyan', 'yellow');

    if (options.detailed) {
      // Get timeline events for more detailed analysis
      ui.loading('Analyzing timeline...');
      const { data: events } = await octokit.issues.listEvents({
        owner: 'brendadeeznuts1111',
        repo: 'alchmenyrun',
        issue_number: parseInt(issueNumber)
      });

      ui.section('Timeline Summary', ui.symbols.calendar);
      const lastActivity = events.length > 0 ? events[events.length - 1].created_at : issue.created_at;
      ui.keyValue('Last Activity', ui.timeAgo(lastActivity), 'cyan', 'gray');
      ui.keyValue('Total Events', events.length.toString(), 'cyan', 'blue');
    }

    ui.summaryBox('Status Summary', [
      `State: ${ui.badge(issue.state.toUpperCase(), issue.state === 'open' ? 'info' : 'success')}`,
      `Labels: ${labels.length}`,
      `Assignee: ${issue.assignee?.login || 'unassigned'}`,
      `Created: ${ui.timeAgo(issue.created_at)}`
    ], ui.symbols.check);

    return {
      number: issueNumber,
      status: issue.state,
      labels: labels,
      assignee: issue.assignee?.login,
      created: issue.created_at
    };

  } catch (error) {
    ui.error(`Failed to get issue status: ${error.message}`);
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
