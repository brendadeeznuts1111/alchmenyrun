#!/usr/bin/env node

/**
 * tgk email - Outbound email replies and management
 * Commands: reply, draft, send, status
 */

import { ui } from '../utils/ui.js';
import { createRPCClients } from '../core/rpc.js';

// Email reply context stored in cache (simulated with local storage for now)
interface EmailReplyContext {
  messageId: string;
  originalEmail: {
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: string;
  };
  telegramChatId: string;
  aiDraft?: string;
  status: 'drafted' | 'approved' | 'sent' | 'failed';
  created: string;
  updated: string;
}

// Mock email cache - in production this would be R2 or D1
const emailCache = new Map<string, EmailReplyContext>();

export async function draftEmailReply(emailFrom: string, stateId: string): Promise<EmailReplyContext> {
  ui.header(`Drafting Email Reply: ${emailFrom}`, ui.symbols.mail);

  try {
    // Retrieve original email context from cache (simulated)
    const cacheKey = `${emailFrom}:${stateId}`;
    const context = emailCache.get(cacheKey);

    if (!context) {
      throw new Error(`No cached email context found for ${emailFrom}:${stateId}`);
    }

    ui.section('Original Email Context', ui.symbols.document);
    ui.keyValue('From', context.originalEmail.from, 'cyan', 'white');
    ui.keyValue('Subject', context.originalEmail.subject, 'cyan', 'white');
    ui.keyValue('Received', ui.timeAgo(context.originalEmail.timestamp), 'cyan', 'gray');

    ui.loading('Generating AI-powered reply...');

    // Use RPC to get AI draft
    const rpc = createRPCClients({
      apiUrl: process.env.TGK_INTERNAL_API_URL || 'http://localhost:3000',
      apiToken: process.env.TGK_API_TOKEN || 'mock-token'
    });

    const aiDraft = await rpc.ai.draftEmailReply({
      originalSubject: context.originalEmail.subject,
      originalBody: context.originalEmail.body,
      recipient: context.originalEmail.from,
      context: `Reply to ${context.originalEmail.from} regarding ${stateId || 'general inquiry'}`
    });

    // Update context with draft
    context.aiDraft = aiDraft.draft;
    context.status = 'drafted';
    context.updated = new Date().toISOString();

    emailCache.set(cacheKey, context);

    ui.section('AI-Generated Reply Draft', ui.symbols.brain);
    ui.info(aiDraft.draft);

    ui.section('Draft Metadata', ui.symbols.info);
    ui.keyValue('Confidence', ui.confidence(aiDraft.confidence), 'cyan', 'green');
    ui.keyValue('Tone', aiDraft.tone, 'cyan', 'blue');
    ui.keyValue('Length', `${aiDraft.wordCount} words`, 'cyan', 'yellow');

    ui.success(`Email reply drafted for ${emailFrom}`);
    ui.info(`Use 'tgk email send ${emailFrom} ${stateId}' to send`);

    return context;

  } catch (error) {
    ui.error(`Failed to draft email reply: ${error.message}`);
    throw error;
  }
}

export async function sendEmailReply(emailFrom: string, stateId: string, options: {
  customMessage?: string;
  skipApproval?: boolean;
} = {}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  ui.header(`Sending Email Reply: ${emailFrom}`, ui.symbols.send);

  try {
    const cacheKey = `${emailFrom}:${stateId}`;
    const context = emailCache.get(cacheKey);

    if (!context) {
      throw new Error(`No drafted reply found for ${emailFrom}:${stateId}`);
    }

    if (context.status !== 'drafted' && !options.skipApproval) {
      throw new Error(`Reply status is ${context.status}, not ready to send`);
    }

    ui.section('Reply Details', ui.symbols.mail);
    ui.keyValue('To', context.originalEmail.from, 'cyan', 'white');
    ui.keyValue('Subject', `Re: ${context.originalEmail.subject}`, 'cyan', 'white');
    ui.keyValue('Status', ui.badge(context.status.toUpperCase(), 'info'), 'cyan', 'blue');

    const finalMessage = options.customMessage || context.aiDraft;
    if (!finalMessage) {
      throw new Error('No message content available');
    }

    ui.section('Message Preview', ui.symbols.document);
    ui.info(finalMessage.substring(0, 200) + (finalMessage.length > 200 ? '...' : ''));

    if (!options.skipApproval) {
      const confirmed = await ui.confirm('Send this email reply?');
      if (!confirmed) {
        ui.info('Email reply cancelled');
        return { success: false, error: 'User cancelled' };
      }
    }

    ui.loading('Sending email reply...');

    // Use RPC to send email (would integrate with SendGrid, Postmark, etc.)
    const rpc = createRPCClients({
      apiUrl: process.env.TGK_INTERNAL_API_URL || 'http://localhost:3000',
      apiToken: process.env.TGK_API_TOKEN || 'mock-token'
    });

    const sendResult = await rpc.ai.sendEmail({
      to: context.originalEmail.from,
      subject: `Re: ${context.originalEmail.subject}`,
      body: finalMessage,
      from: process.env.EMAIL_FROM || 'noreply@cloudflare.com',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@cloudflare.com'
    });

    // Update context
    context.status = 'sent';
    context.updated = new Date().toISOString();
    emailCache.set(cacheKey, context);

    ui.success(`Email reply sent successfully!`);
    ui.keyValue('Message ID', sendResult.messageId, 'green', 'yellow');
    ui.keyValue('Delivered To', context.originalEmail.from, 'green', 'white');

    return { success: true, messageId: sendResult.messageId };

  } catch (error) {
    ui.error(`Failed to send email reply: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export async function getEmailReplyStatus(emailFrom: string, stateId: string): Promise<EmailReplyContext | null> {
  ui.header(`Email Reply Status: ${emailFrom}:${stateId}`, ui.symbols.monitor);

  try {
    const cacheKey = `${emailFrom}:${stateId}`;
    const context = emailCache.get(cacheKey);

    if (!context) {
      ui.warning(`No email reply context found for ${emailFrom}:${stateId}`);
      return null;
    }

    ui.section('Reply Status', ui.symbols.info);
    ui.keyValue('Status', ui.badge(context.status.toUpperCase(),
      context.status === 'sent' ? 'success' :
      context.status === 'drafted' ? 'info' : 'warning'), 'cyan', 'white');
    ui.keyValue('Original Email', context.originalEmail.from, 'cyan', 'white');
    ui.keyValue('Subject', context.originalEmail.subject, 'cyan', 'gray');
    ui.keyValue('Created', ui.timeAgo(context.created), 'cyan', 'gray');
    ui.keyValue('Updated', ui.timeAgo(context.updated), 'cyan', 'blue');

    if (context.aiDraft) {
      ui.section('Draft Content', ui.symbols.document);
      ui.info(context.aiDraft.substring(0, 150) + (context.aiDraft.length > 150 ? '...' : ''));
    }

    return context;

  } catch (error) {
    ui.error(`Failed to get email reply status: ${error.message}`);
    throw error;
  }
}

export async function listEmailReplies(): Promise<EmailReplyContext[]> {
  ui.header('Email Reply Inventory', ui.symbols.list);

  try {
    const replies = Array.from(emailCache.values());

    if (replies.length === 0) {
      ui.info('No email replies found');
      return [];
    }

    ui.section('Active Email Replies', ui.symbols.mail);
    ui.table(
      ['Recipient', 'State ID', 'Status', 'Created', 'Subject'],
      replies.map(reply => [
        reply.originalEmail.from,
        reply.messageId.split(':')[1] || 'N/A',
        ui.badge(reply.status.toUpperCase(),
          reply.status === 'sent' ? 'success' :
          reply.status === 'drafted' ? 'info' : 'warning'),
        ui.timeAgo(reply.created),
        reply.originalEmail.subject.substring(0, 40) + (reply.originalEmail.subject.length > 40 ? '...' : '')
      ])
    );

    const stats = {
      total: replies.length,
      drafted: replies.filter(r => r.status === 'drafted').length,
      sent: replies.filter(r => r.status === 'sent').length,
      failed: replies.filter(r => r.status === 'failed').length
    };

    ui.summaryBox('Email Reply Statistics', [
      `Total Replies: ${stats.total}`,
      `Drafted: ${stats.drafted}`,
      `Sent: ${stats.sent}`,
      `Failed: ${stats.failed}`,
      `Success Rate: ${stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0}%`
    ], ui.symbols.chart);

    return replies;

  } catch (error) {
    ui.error(`Failed to list email replies: ${error.message}`);
    throw error;
  }
}

// Simulate receiving an email for reply context (for testing)
export async function simulateEmailForReply(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
  stateId?: string;
  telegramChatId?: string;
}): Promise<EmailReplyContext> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const cacheKey = `${params.from}:${params.stateId || 'no-id'}`;

  const context: EmailReplyContext = {
    messageId,
    originalEmail: {
      from: params.from,
      to: params.to,
      subject: params.subject,
      body: params.body,
      timestamp: new Date().toISOString()
    },
    telegramChatId: params.telegramChatId || '@test-chat',
    status: 'drafted',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };

  emailCache.set(cacheKey, context);

  ui.success(`Simulated email context created for ${params.from}`);
  return context;
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'reply':
        const emailFrom = args[2];
        const stateId = args[3];
        if (!emailFrom || !stateId) {
          console.error('Usage: tgk email reply <email-from> <state-id>');
          console.error('Example: tgk email reply user@example.com pr123');
          process.exit(1);
        }
        await draftEmailReply(emailFrom, stateId);
        break;

      case 'send':
        const sendEmailFrom = args[2];
        const sendStateId = args[3];
        const customMessage = args[4];
        if (!sendEmailFrom || !sendStateId) {
          console.error('Usage: tgk email send <email-from> <state-id> [custom-message]');
          process.exit(1);
        }
        const sendResult = await sendEmailReply(sendEmailFrom, sendStateId, {
          customMessage,
          skipApproval: process.env.TGK_SKIP_APPROVAL === 'true'
        });
        if (!sendResult.success) {
          console.error('Failed to send email:', sendResult.error);
          process.exit(1);
        }
        break;

      case 'status':
        const statusEmailFrom = args[2];
        const statusStateId = args[3];
        if (!statusEmailFrom || !statusStateId) {
          console.error('Usage: tgk email status <email-from> <state-id>');
          process.exit(1);
        }
        await getEmailReplyStatus(statusEmailFrom, statusStateId);
        break;

      case 'list':
        await listEmailReplies();
        break;

      case 'simulate':
        // For testing: simulate receiving an email
        const simFrom = args[2] || 'test@example.com';
        const simSubject = args[3] || 'Test email for reply';
        const simStateId = args[4] || 'test123';

        await simulateEmailForReply({
          from: simFrom,
          to: 'support@cloudflare.com',
          subject: simSubject,
          body: 'This is a test email that needs a reply.',
          stateId: simStateId,
          telegramChatId: '@test-chat'
        });
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk email reply <email> <state-id>    - Draft AI-powered email reply');
        console.log('  tgk email send <email> <state-id>     - Send drafted email reply');
        console.log('  tgk email status <email> <state-id>   - Check reply status');
        console.log('  tgk email list                        - List all email replies');
        console.log('  tgk email simulate [email] [subject]  - Simulate email for testing');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
