#!/usr/bin/env node

/**
 * tgk pr-telegram - Telegram-based PR Management
 * Enables PR answering, reviewing, and acceptance through Telegram
 */

import { GitHubManager } from '../utils/github.js';
import { TelegramBot } from '../utils/telegram.js';

// Initialize clients
const gh = new GitHubManager();
const telegram = new TelegramBot();

interface PRTelegramReport {
  prId: string;
  action: string;
  message: string;
  processedAt: string;
  telegramPosted: boolean;
  githubUpdated: boolean;
}

export async function handlePRCallback(callbackData: string): Promise<PRTelegramReport> {
  console.log(`🔧 Handling PR Telegram callback...`);

  try {
    const data = JSON.parse(callbackData);
    const { prId, action, message } = data;

    const report: PRTelegramReport = {
      prId,
      action,
      message: message || '',
      processedAt: new Date().toISOString(),
      telegramPosted: false,
      githubUpdated: false
    };

    // Get PR details first
    const pr = await gh.getPullRequest(parseInt(prId));
    
    // Execute the requested action
    switch (action) {
      case 'approve':
        await gh.approvePullRequest(parseInt(prId), message || 'Approved via Telegram');
        report.githubUpdated = true;
        break;

      case 'request-changes':
        await gh.requestChangesOnPullRequest(parseInt(prId), message || 'Changes requested via Telegram');
        report.githubUpdated = true;
        break;

      case 'comment':
        await gh.commentOnPullRequest(parseInt(prId), message || '');
        report.githubUpdated = true;
        break;

      case 'merge':
        await gh.mergePullRequest(parseInt(prId), 'squash');
        report.githubUpdated = true;
        break;

      case 'automate':
        await gh.enableAutoMerge(parseInt(prId));
        report.githubUpdated = true;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Post confirmation to Telegram
    await postPRActionConfirmation(report, pr);
    report.telegramPosted = true;

    console.log(`✅ PR #${prId} ${action} completed via Telegram`);
    return report;

  } catch (error) {
    console.error('❌ Failed to handle PR callback:', error.message);
    throw error;
  }
}

export async function sendPRToTelegram(prId: string, chatId?: string): Promise<void> {
  console.log(`📱 Sending PR #${prId} to Telegram...`);

  try {
    const pr = await gh.getPullRequest(parseInt(prId));
    const status = await gh.getPRStatus(parseInt(prId), true);

    const targetChatId = chatId || process.env.TELEGRAM_COUNCIL_ID;
    
    if (!targetChatId) {
      throw new Error('No Telegram chat ID configured');
    }

    // Extract topic from PR body if present
    const topicMatch = pr.body?.match(/\*\*Topic:\*\* (.+)/i);
    const topic = topicMatch ? topicMatch[1] : 'No topic specified';

    const message = `📋 **Pull Request Review**

**PR:** [#${pr.number}](${pr.html_url})
**Title:** ${pr.title}
**Author:** ${pr.user?.login || 'Unknown'}
**Topic:** ${topic}

📊 **Status:**
• **State:** ${pr.state}
• **Mergeable:** ${pr.mergeable ? '✅ Yes' : '❌ No'}
• **Draft:** ${pr.draft ? 'Yes' : 'No'}
• **Checks:** ${status.checks.passing}/${status.checks.total} passing

👥 **Reviews:** ${status.reviews.length} reviews
${status.reviews.map(review => `• ${review.user?.login}: ${review.state}`).join('\n')}

🏷️ **Labels:** ${pr.labels?.map(label => label.name).join(', ') || 'None'}

${status.ai ? `
🤖 **AI Analysis:**
• **Risk Level:** ${status.ai.risk}
• **Test Coverage:** ${status.ai.coverage}
• **Breaking Changes:** ${status.ai.breaking ? 'Yes' : 'No'}
` : ''}

**Branch:** ${pr.head.ref} → ${pr.base.ref}
**Created:** ${new Date(pr.created_at).toLocaleString()}`;

    const keyboard = buildPRKeyboard(prId, status);

    await telegram.sendMessage(targetChatId, message, {
      reply_markup: { inline_keyboard: keyboard },
      message_thread_id: '25782' // Council thread
    });

    console.log(`✅ PR #${prId} sent to Telegram`);

  } catch (error) {
    console.error('❌ Failed to send PR to Telegram:', error.message);
    throw error;
  }
}

function buildPRKeyboard(prId: string, status: any): any[][] {
  const keyboard = [];

  // Review actions
  keyboard.push([
    {
      text: '✅ Approve',
      callback_data: JSON.stringify({
        action: 'pr_action',
        prId,
        type: 'approve'
      })
    },
    {
      text: '🔄 Request Changes',
      callback_data: JSON.stringify({
        action: 'pr_action',
        prId,
        type: 'request-changes'
      })
    }
  ]);

  // Comment and merge actions
  keyboard.push([
    {
      text: '💬 Comment',
      callback_data: JSON.stringify({
        action: 'pr_comment',
        prId
      })
    }
  ]);

  // Merge actions (only if mergeable and checks pass)
  if (status.mergeable && status.checks.passing === status.checks.total) {
    keyboard.push([
      {
        text: '🔀 Merge',
        callback_data: JSON.stringify({
          action: 'pr_action',
          prId,
          type: 'merge'
        })
      },
      {
        text: '🤖 Auto-merge',
        callback_data: JSON.stringify({
          action: 'pr_action',
          prId,
          type: 'automate'
        })
      }
    ]);
  }

  // View details
  keyboard.push([
    {
      text: '📊 View Details',
      callback_data: JSON.stringify({
        action: 'pr_details',
        prId
      })
    }
  ]);

  return keyboard;
}

async function postPRActionConfirmation(report: PRTelegramReport, pr: any): Promise<void> {
  const actionEmojis = {
    'approve': '✅',
    'request-changes': '🔄',
    'comment': '💬',
    'merge': '🔀',
    'automate': '🤖'
  };

  const emoji = actionEmojis[report.action] || '🔧';
  
  const message = `${emoji} **PR Action Completed**

**PR:** [#${report.prId}](${pr.html_url})
**Action:** ${report.action}
**Message:** ${report.message || 'No message'}
**Processed:** ${new Date(report.processedAt).toLocaleString()}`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    message,
    { message_thread_id: '25782' }
  );
}

export async function answerPRQuestion(prId: string, question: string): Promise<void> {
  console.log(`💬 Answering question for PR #${prId}...`);

  try {
    // Get PR details to understand context
    const pr = await gh.getPullRequest(parseInt(prId));
    
    // Generate AI-powered answer (mock for now)
    const answer = await generatePRAnswer(pr, question);
    
    // Post answer as comment
    await gh.commentOnPullRequest(parseInt(prId), answer);
    
    // Notify Telegram
    await telegram.sendMessage(
      process.env.TELEGRAM_COUNCIL_ID,
      `💬 **Answer Posted to PR #${prId}**

**Question:** ${question}
**Answer:** ${answer.substring(0, 200)}...

🔗 [View PR](${pr.html_url})`,
      { message_thread_id: '25782' }
    );

    console.log(`✅ Answer posted to PR #${prId}`);

  } catch (error) {
    console.error('❌ Failed to answer PR question:', error.message);
    throw error;
  }
}

async function generatePRAnswer(pr: any, question: string): Promise<string> {
  // Mock AI answer generation - would integrate with actual AI service
  const answers = [
    `Based on the PR description and code changes, ${question.toLowerCase()} - this implementation follows our current patterns and should be safe to merge.`,
    `Looking at the changes in this PR, ${question.toLowerCase()} - the approach is sound and addresses the requirements effectively.`,
    `After reviewing the code, ${question.toLowerCase()} - this looks good and maintains compatibility with existing systems.`
  ];

  return answers[Math.floor(Math.random() * answers.length)];
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'send':
        const prId = args[1];
        const chatId = args[2];
        if (!prId) {
          console.log('Usage: tgk pr-telegram send <pr-id> [chat-id]');
          process.exit(1);
        }
        await sendPRToTelegram(prId, chatId);
        break;

      case 'answer':
        const answerPrId = args[1];
        const question = args.slice(2).join(' ');
        if (!answerPrId || !question) {
          console.log('Usage: tgk pr-telegram answer <pr-id> "<question>"');
          process.exit(1);
        }
        await answerPRQuestion(answerPrId, question);
        break;

      case 'callback':
        const callbackData = args[1];
        if (!callbackData) {
          console.log('Usage: tgk pr-telegram callback <callback-data>');
          process.exit(1);
        }
        await handlePRCallback(callbackData);
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk pr-telegram send <pr-id> [chat-id]     - Send PR to Telegram for review');
        console.log('  tgk pr-telegram answer <pr-id> "<question>" - Answer PR question via AI');
        console.log('  tgk pr-telegram callback <data>           - Handle Telegram callback');
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
