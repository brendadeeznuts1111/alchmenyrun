/**
 * Kinja PR Telegram Integration
 * Rich PR cards for email-to-Telegram orchestration
 */

import { GitHubManager } from '../../tgk/utils/github.js';
import { TelegramBot } from '../../tgk/utils/telegram.js';

// Initialize clients
const gh = new GitHubManager();
const telegram = new TelegramBot();

interface PRRichCard {
  text: string;
  keyboard: any[][];
}

interface EmailMetadata {
  from: string;
  subject: string;
  body: string;
  to: string;
}

export async function buildPRRichCard(prNum: string, kinja: any, env: any): Promise<PRRichCard> {
  console.log(`🏗️ Building PR rich card for #${prNum}...`);

  try {
    const pr = await gh.getPullRequest(parseInt(prNum));
    const status = await gh.getPRStatus(parseInt(prNum), true);

    // Extract topic from PR body if present
    const topicMatch = pr.body?.match(/\*\*Topic:\*\* (.+)/i);
    const topic = topicMatch ? topicMatch[1] : 'No topic specified';

    const message = `📋 **Pull Request Review Request**

**🔗 PR:** [#${pr.number}](${pr.html_url})
**📝 Title:** ${pr.title}
**👤 Author:** ${pr.user?.login || 'Unknown'}
**🏷️ Topic:** ${topic}

**📊 Status:**
• **State:** ${pr.state}
• **Mergeable:** ${pr.mergeable ? '✅ Yes' : '❌ No'}
• **Draft:** ${pr.draft ? 'Yes' : 'No'}
• **Checks:** ${status.checks.passing}/${status.checks.total} passing

**👥 Reviews:** ${status.reviews.length} reviews
${status.reviews.map(review => `• ${review.user?.login}: ${review.state}`).join('\n')}

**🏷️ Labels:** ${pr.labels?.map(label => label.name).join(', ') || 'None'}

${status.ai ? `
**🤖 AI Analysis:**
• **Risk Level:** ${status.ai.risk}
• **Test Coverage:** ${status.ai.coverage}
• **Breaking Changes:** ${status.ai.breaking ? 'Yes' : 'No'}
` : ''}

**🌿 Branch:** ${pr.head.ref} → ${pr.base.ref}
**📅 Created:** ${new Date(pr.created_at).toLocaleString()}

---

**📧 Email Context:**
**From:** ${kinja.email_from || 'Unknown'}
**Subject:** ${kinja.email_subject || 'No subject'}
**Urgency:** ${kinja.urgency || 'medium'}

${kinja.summary ? `**📝 Summary:** ${kinja.summary}` : ''}`;

    const keyboard = buildPRKeyboard(prNum, status);

    return {
      text: message,
      keyboard
    };

  } catch (error) {
    console.error('❌ Failed to build PR rich card:', error.message);
    throw error;
  }
}

function buildPRKeyboard(prNum: string, status: any): any[][] {
  const keyboard = [];

  // Review actions with pr: prefix for callback routing
  keyboard.push([
    {
      text: '✅ Approve',
      callback_data: JSON.stringify({
        action: 'pr:approve',
        prId: prNum,
        type: 'approve'
      })
    },
    {
      text: '🔄 Request Changes',
      callback_data: JSON.stringify({
        action: 'pr:request-changes',
        prId: prNum,
        type: 'request-changes'
      })
    }
  ]);

  // Comment action
  keyboard.push([
    {
      text: '💬 Comment',
      callback_data: JSON.stringify({
        action: 'pr:comment',
        prId: prNum
      })
    }
  ]);

  // Merge actions (only if mergeable and checks pass)
  if (status.mergeable && status.checks.passing === status.checks.total) {
    keyboard.push([
      {
        text: '🔀 Merge',
      callback_data: JSON.stringify({
        action: 'pr:merge',
        prId: prNum,
        type: 'merge'
      })
    },
    {
      text: '🤖 Auto-merge',
      callback_data: JSON.stringify({
        action: 'pr:automate',
        prId: prNum,
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
        action: 'pr:details',
        prId: prNum
      })
    }
  ]);

  return keyboard;
}

export async function answerPRViaTelegram(
  prNum: string, 
  ghAction: string, 
  message: string, 
  env: any,
  originalEmail?: EmailMetadata
): Promise<void> {
  console.log(`🔧 Processing PR action: ${ghAction} for #${prNum}`);

  try {
    // Get PR details first
    const pr = await gh.getPullRequest(parseInt(prNum));
    
    // Execute the requested GitHub action
    switch (ghAction) {
      case 'approve':
        await gh.approvePullRequest(parseInt(prNum), message || 'Approved via Telegram');
        break;

      case 'request-changes':
        await gh.requestChangesOnPullRequest(parseInt(prNum), message || 'Changes requested via Telegram');
        break;

      case 'comment':
        await gh.commentOnPullRequest(parseInt(prNum), message || '');
        break;

      case 'merge':
        await gh.mergePullRequest(parseInt(prNum), 'squash');
        break;

      case 'automate':
        await gh.enableAutoMerge(parseInt(prNum));
        break;

      default:
        throw new Error(`Unknown PR action: ${ghAction}`);
    }

    // Post confirmation to Telegram
    await postPRActionConfirmation(prNum, ghAction, message, pr);

    // Send email reply if enabled and original email is available
    if (env.SEND_EMAIL_REPLY === "1" && originalEmail) {
      await sendEmailReply(originalEmail, prNum, ghAction, message, env);
    }

    console.log(`✅ PR #${prNum} ${ghAction} completed successfully`);

  } catch (error) {
    console.error(`❌ Failed to process PR action ${ghAction} for #${prNum}:`, error.message);
    throw error;
  }
}

async function postPRActionConfirmation(prNum: string, action: string, message: string, pr: any): Promise<void> {
  const actionEmojis = {
    'approve': '✅',
    'request-changes': '🔄',
    'comment': '💬',
    'merge': '🔀',
    'automate': '🤖'
  };

  const emoji = actionEmojis[action] || '🔧';
  
  const confirmationMessage = `${emoji} **PR Action Completed**

**🔗 PR:** [#${prNum}](${pr.html_url})
**🎯 Action:** ${action}
**💬 Message:** ${message || 'No message'}
**⏰ Processed:** ${new Date().toLocaleString()}

This action was performed via Telegram email orchestration.`;

  await telegram.sendMessage(
    process.env.TELEGRAM_COUNCIL_ID,
    confirmationMessage,
    { message_thread_id: '25782' }
  );
}

async function sendEmailReply(
  originalEmail: EmailMetadata,
  prNum: string,
  action: string,
  message: string,
  env: any
): Promise<void> {
  console.log(`📧 Sending email reply for PR #${prNum} action: ${action}`);

  try {
    const actionEmojis = {
      'approve': '🟢',
      'request-changes': '🟡',
      'comment': '💬',
      'merge': '🔀',
      'automate': '🤖'
    };

    const emoji = actionEmojis[action] || '🔧';
    
    const emailBody = `${emoji} PR #${prNum} was ${action} via Telegram.

${message ? `Message: ${message}` : ''}

---
This response was generated automatically from the TGK email orchestration system.
PR URL: https://github.com/brendadeeznuts1111/alchmenyrun/pull/${prNum}`;

    const emailData = {
      to: originalEmail.from,
      subject: `Re: ${originalEmail.subject}`,
      text: emailBody,
      from: env.EMAIL_FROM || 'noreply@tgk.dev'
    };

    // Use SendGrid (already configured in Phase-6)
    await env.SENDGRID.send(emailData);
    
    console.log(`✅ Email reply sent to ${originalEmail.from}`);

  } catch (error) {
    console.error(`❌ Failed to send email reply:`, error.message);
    // Don't throw - email failure shouldn't break the PR action
  }
}

export async function sendTelegramMessage(chatId: string, text: string, keyboard: any[][]): Promise<void> {
  try {
    await telegram.sendMessage(chatId, text, {
      reply_markup: { inline_keyboard: keyboard },
      message_thread_id: '25782' // Council thread
    });
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error.message);
    throw error;
  }
}
