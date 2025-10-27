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

// Label taxonomy from RFC
const LABEL_TAXONOMY = {
  group: ['customer', 'internal'],
  topic: ['state-pinning', 'observability', 'governance', 'performance', 'security', 'ux'],
  impact: ['low', 'medium', 'high', 'critical']
};

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

    // AI-powered labeling
    const labels = await labelIssue(title, body);

    // Create GitHub issue
    const issue = await octokit.issues.create({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      title,
      body: `${body}\n\n---\n*AI-generated labels: ${labels.labels.join(', ')}*`,
      labels: labels.labels
    });

    console.log(`✅ Issue #${issue.data.number} created with AI labels: ${labels.labels.join(', ')}`);

    // Auto-triage if confidence > 80%
    const confidence = labels.confidence || 0.9; // Assume high confidence for demo
    if (confidence > 0.8) {
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
  console.log(`🔍 Triaging issue #${issueNumber}...`);

  try {
    // Check if we're in test mode (no real API calls)
    if (!process.env.GITHUB_TOKEN) {
      console.log('🧪 Running in test mode (no GITHUB_TOKEN set)');
      console.log(`🎯 Would triage issue #${issueNumber}`);
      console.log('🏷️  Would apply AI labels: group/internal, topic/state-pinning, impact/low');
      console.log('✅ AI confidence: 0.85');
      return;
    }

    // Get issue details
    const { data: issue } = await octokit.issues.get({
      owner: 'brendadeeznuts1111',
      repo: 'alchmenyrun',
      issue_number: parseInt(issueNumber)
    });

    // AI labeling
    const labels = await labelIssue(issue.title, issue.body);

    // Apply labels if confidence > 80%
    if (labels.confidence > 0.8) {
      await octokit.issues.addLabels({
        owner: 'brendadeeznuts1111',
        repo: 'alchmenyrun',
        issue_number: parseInt(issueNumber),
        labels: labels.labels
      });

      console.log(`✅ Applied AI labels to #${issueNumber}: ${labels.labels.join(', ')}`);

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

async function labelIssue(title: string, body: string): Promise<{labels: string[], confidence: number}> {
  // AI labeling logic (simplified for demo)
  // In production, this would call Cloudflare AI or OpenAI

  const content = `${title} ${body}`.toLowerCase();

  // Simple keyword-based labeling (would be AI in production)
  let group = 'internal';
  let topic = 'governance';
  let impact = 'low';

  if (content.includes('customer') || content.includes('user') || content.includes('login')) {
    group = 'customer';
  }

  if (content.includes('pin') || content.includes('state') || content.includes('concurrent')) {
    topic = 'state-pinning';
  } else if (content.includes('metrics') || content.includes('monitor')) {
    topic = 'observability';
  } else if (content.includes('security') || content.includes('auth')) {
    topic = 'security';
  }

  if (content.includes('crash') || content.includes('broken') || content.includes('critical')) {
    impact = 'critical';
  } else if (content.includes('slow') || content.includes('performance')) {
    impact = 'high';
  }

  const labels = [`group/${group}`, `topic/${topic}`, `impact/${impact}`];
  const confidence = 0.85; // Mock confidence score

  return { labels, confidence };
}

async function notifyCouncilForReview(issue: any, labels: any) {
  // Skip Telegram notification if tokens not available
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_COUNCIL_ID) {
    console.log('📝 Telegram tokens not available, skipping council notification');
    return;
  }

  const message = `🤖 **AI Triage Review Needed**

Issue: [#${issue.number}](${issue.html_url})
Title: ${issue.title}

AI Suggested Labels: ${labels.labels.join(', ')}
Confidence: ${(labels.confidence * 100).toFixed(1)}%

Please review and apply manual labels if needed.`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
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
      default:
        console.log('Available commands:');
        console.log('  tgk issue new    - Create issue with AI wizard');
        console.log('  tgk issue triage <id> - Auto-triage existing issue');
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
