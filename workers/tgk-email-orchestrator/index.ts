/**
 * tgk-email-orchestrator - Enhanced Cloudflare Email Worker
 * Intelligent, bidirectional email-to-Telegram orchestration with AI analysis
 */

import { buildPRRichCard, answerPRViaTelegram, sendTelegramMessage } from './kinja-pr-telegram.js';
import { createReliabilityLayer } from '../../tgk/utils/reliability.ts';
import { MessageTracker } from '../../tgk/utils/message-tracking.ts';
import { createRPCClients } from '../../tgk/core/rpc.ts';

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  body: string;
  headers: Headers;
  raw: ReadableStream;
}

interface Env {
  // Telegram configuration
  TG_BOT_TOKEN: string;
  TGK_INTERNAL_API_URL: string;
  TGK_API_TOKEN: string;
  
  // Email routing configuration
  TELEGRAM_DEFAULT_CHAT_ID: string;
  TELEGRAM_ONCALL_CHAT_ID: string;
  TELEGRAM_SRE_CHAT_ID: string;
  TELEGRAM_SUPPORT_CHAT_ID: string;
  
  // Dynamic routing (incident-specific)
  TELEGRAM_INCIDENT_INC123_CHAT_ID?: string;
  TELEGRAM_INCIDENT_INC456_CHAT_ID?: string;
  
  // Email service for replies
  EMAIL_SERVICE_API_KEY?: string;
  
  // Feature flags
  EMAIL_PR_TELEGRAM?: string;  // NEW: Enable PR Telegram integration
  SEND_EMAIL_REPLY?: string;   // NEW: Enable email replies for PR actions
  
  // Email reply configuration
  EMAIL_FROM?: string;         // NEW: From address for email replies
  SENDGRID_API_KEY?: string;   // NEW: SendGrid API key (already in secrets)
  
  // Database
  DB: D1Database;              // NEW: D1 database for email-telegram mappings
  
  // Observability
  LOGPUSH_URL?: string;
  LOKI_URL?: string;
}

interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  keywords: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  action_items: string[];
  potential_pii: boolean;
  phishing_risk: number;
  reasoning: string;
}

interface RoutingSuggestion {
  chat_id: string | null;
  routing_confidence: number;
  fallback_reason?: string;
  suggested_priority_override?: string;
  reasoning: string;
}

interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{
    text: string;
    callback_data?: string;
    url?: string;
  }>>;
}

// RPC clients are now imported from tgk/core/rpc.ts

// Generate unique message ID for tracking
function generateMessageId(email: EmailMessage): string {
  const timestamp = Date.now();
  const fromHash = email.from.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  const subjectHash = (email.headers.get('subject') || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return `msg_${timestamp}_${fromHash}_${subjectHash}`;
}

// HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h[1-6]>/gi, '### ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<a href="([^"]*)">([^<]*)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/\n\s*\n/g, '\n') // Normalize newlines
    .trim();
}

// Parse email body (text/plain or html)
function parseEmailBody(rawEmail: string): { text: string; html?: string } {
  const lines = rawEmail.split('\n');
  let textBody = '';
  let htmlBody = '';
  let inTextPart = false;
  let inHtmlPart = false;

  for (const line of lines) {
    if (line.toLowerCase().startsWith('content-type: text/plain')) {
      inTextPart = true;
      inHtmlPart = false;
      continue;
    } else if (line.toLowerCase().startsWith('content-type: text/html')) {
      inHtmlPart = true;
      inTextPart = false;
      continue;
    } else if (line.startsWith('--')) {
      inTextPart = false;
      inHtmlPart = false;
      continue;
    }

    if (inTextPart) {
      textBody += line + '\n';
    } else if (inHtmlPart) {
      htmlBody += line + '\n';
    }
  }

  // If no multipart parsing worked, try simple extraction
  if (!textBody && !htmlBody) {
    const bodyMatch = rawEmail.match(/\r?\n\r?\n(.*)/s);
    if (bodyMatch) {
      textBody = bodyMatch[1];
    }
  }

  // Convert HTML to markdown if we have HTML but no text
  if (htmlBody && !textBody) {
    textBody = htmlToMarkdown(htmlBody);
  }

  return { text: textBody.trim(), html: htmlBody };
}

// Build interactive Telegram keyboard
function buildTelegramKeyboard(context: {
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
  meta: string;
  stateId?: string;
  aiAnalysis: AIAnalysis;
  emailFrom: string;
  telegramChatID: string;
}): TelegramInlineKeyboard {
  const keyboard: TelegramInlineKeyboard = { inline_keyboard: [] };

  // Reply button
  keyboard.inline_keyboard.push([{
    text: '📧 Reply to Sender',
    callback_data: `email_reply:${context.emailFrom}:${context.stateId || 'no-id'}`
  }]);

  // Link buttons based on META
  if (context.meta === 'gh' && context.stateId) {
    keyboard.inline_keyboard.push([{
      text: '🔗 View on GitHub',
      url: `https://github.com/brendadeeznuts1111/alchmenyrun/issues/${context.stateId.replace(/\D/g, '')}`
    }]);
  } else if (context.meta === 'jira' && context.stateId) {
    keyboard.inline_keyboard.push([{
      text: '🔗 View in Jira',
      url: `https://your-domain.atlassian.net/browse/${context.stateId.toUpperCase()}`
    }]);
  }

  // Action buttons based on type and urgency
  if (context.type === 'alert' || context.aiAnalysis.urgency === 'critical') {
    keyboard.inline_keyboard.push([{
      text: '🚨 Acknowledge Alert',
      callback_data: `acknowledge_alert:${context.stateId || 'no-id'}`
    }]);
  }

  if (context.type === 'issue' || context.type === 'pr') {
    keyboard.inline_keyboard.push([{
      text: '🏷️ Assign to Me',
      callback_data: `assign_issue:${context.stateId || 'no-id'}`
    }]);
  }

  return keyboard;
}

// Log to observability platforms
async function logMetrics(env: Env, metrics: {
  email_routed_total: number;
  email_ai_sentiment_score: number;
  email_routing_success: boolean;
  domain: string;
  scope: string;
}): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'tgk-email-orchestrator',
    metrics,
    level: metrics.email_routing_success ? 'info' : 'error'
  };

  // Log to console (Cloudflare Logs)
  console.log(JSON.stringify(logEntry));

  // Optional: Send to Loki
  if (env.LOKI_URL) {
    try {
      await fetch(env.LOKI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streams: [{
            stream: { service: 'tgk-email-orchestrator' },
            values: [[Date.now().toString(), JSON.stringify(logEntry)]]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to log to Loki:', error);
    }
  }
}

export default {
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const startTime = Date.now();
    let routingSuccess = false;
    const messageId = generateMessageId(message);
    
    // Initialize reliability layer and message tracking
    const reliabilityLayer = createReliabilityLayer();
    const messageTracker = new MessageTracker(env.DB);
    
    try {
      console.log(`📧 Processing email ${messageId} from ${message.from} to ${message.to}`);
      
      // Track message receipt
      await messageTracker.trackMessage({
        messageId,
        emailFrom: message.from,
        emailTo: message.to,
        status: 'received',
        timestamp: new Date().toISOString()
      });

      // Parse email address tokens
      const [localPart] = message.to.split('@');
      const [domain, scope, type, hierarchy, meta, stateId_optional] = localPart.split('.');

      console.log(`🔍 Parsed tokens: domain=${domain}, scope=${scope}, type=${type}, hierarchy=${hierarchy}, meta=${meta}, stateId=${stateId_optional}`);
      
      // Update tracking with parsed context
      await messageTracker.updateMessageStatus(messageId, 'processed', undefined, {
        domain, scope, type, hierarchy, meta, stateId: stateId_optional
      });

      // Extract email content
      const rawEmail = await new Response(message.raw).text();
      const emailBody = parseEmailBody(rawEmail);
      const emailSubject = message.headers.get('subject') || 'No Subject';

      // ---- NEW BRANCH: e-mail about a PR → Telegram card ----
      const prNum = stateId_optional?.match(/^pr(\d+)$/i)?.[1];     // pr123 → 123
      if (env.EMAIL_PR_TELEGRAM === "1" && prNum && type === "review") {
        console.log(`📱 PR Telegram branch triggered for PR #${prNum}`);
        
        // Execute golden path workflow for PR emails
        const workflowResult = await reliabilityLayer.executeEmailToPRWorkflow(
          { message, messageId, domain, scope, type, hierarchy, meta },
          prNum,
          '', // Will be resolved from DB
          env
        );
        
        console.log(`✅ PR workflow completed: ${workflowResult.workflowId}`);
        
        // Update tracking with workflow completion
        await messageTracker.updateMessageStatus(messageId, 'sent_to_telegram', undefined, {
          workflowId: workflowResult.workflowId,
          prId: prNum
        });
        
        return; // Stop here - no duplicate email
      }

      // Initialize RPC clients
      const rpc = createRPCClients({
        apiUrl: env.TGK_INTERNAL_API_URL,
        apiToken: env.TGK_API_TOKEN
      });

      // AI Analysis of Email Content
      console.log(`🧠 Performing AI analysis...`);
      const aiAnalysis: AIAnalysis = await rpc.ai.analyzeEmailContent({
        subject: emailSubject,
        body: emailBody.text,
        stateId: stateId_optional
      });

      console.log(`📊 AI Analysis: sentiment=${aiAnalysis.sentiment}, urgency=${aiAnalysis.urgency}, phishing_risk=${aiAnalysis.phishing_risk}`);

      // Check for high phishing risk
      if (aiAnalysis.phishing_risk > 0.7) {
        console.log(`🚨 High phishing risk detected (${aiAnalysis.phishing_risk}), blocking email`);
        await logMetrics(env, {
          email_routed_total: 1,
          email_ai_sentiment_score: aiAnalysis.score,
          email_routing_success: false,
          domain: domain || 'unknown',
          scope: scope || 'unknown'
        });
        return;
      }

      // Dynamic Chat ID Resolution
      console.log(`🎯 Resolving Telegram chat ID...`);
      const routingSuggestion: RoutingSuggestion = await rpc.routing.resolveTelegramChatID({
        domain, scope, type, hierarchy, meta, stateId: stateId_optional,
        aiSentiment: aiAnalysis.sentiment,
        emailFrom: message.from
      });

      if (!routingSuggestion.chat_id) {
        console.error(`❌ No chat ID resolved: ${routingSuggestion.fallback_reason}`);
        
        // Send dead-letter notification
        await rpc.logging.logDeadLetterEmail({
          email: message.to,
          reason: routingSuggestion.fallback_reason || 'no_route',
          from: message.from,
          subject: emailSubject
        });

        await logMetrics(env, {
          email_routed_total: 1,
          email_ai_sentiment_score: aiAnalysis.score,
          email_routing_success: false,
          domain: domain || 'unknown',
          scope: scope || 'unknown'
        });
        return;
      }

      console.log(`✅ Routing to chat ID: ${routingSuggestion.chat_id} (confidence: ${(routingSuggestion.routing_confidence * 100).toFixed(1)}%)`);

      // Construct Rich Telegram Message
      const priorityDisplay = routingSuggestion.suggested_priority_override || hierarchy || 'unknown';
      const telegramText = `📧 **${domain?.toUpperCase() || 'UNKNOWN'}.${scope}** | ${type} | Prio ${priorityDisplay} | From ${message.from}\n` +
                          `Subject: *${emailSubject}*\n` +
                          `_AI Sentiment: ${aiAnalysis.sentiment}_ (Score: ${aiAnalysis.score.toFixed(2)}) | Urgency: ${aiAnalysis.urgency}\n\n` +
                          `${aiAnalysis.summary || emailBody.text.substring(0, 300) + '...'}\n\n` +
                          `🔗 _Email ID: ${message.headers.get('message-id') || 'unknown'}_`;

      // Build interactive keyboard
      const inlineKeyboard = buildTelegramKeyboard({
        domain: domain || 'unknown',
        scope: scope || 'unknown',
        type: type || 'unknown',
        hierarchy: hierarchy || 'unknown',
        meta: meta || 'unknown',
        stateId: stateId_optional,
        aiAnalysis,
        emailFrom: message.from,
        telegramChatID: routingSuggestion.chat_id
      });

      // Send to Telegram
      const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: routingSuggestion.chat_id,
          text: telegramText,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard
        })
      });

      if (!telegramResponse.ok) {
        throw new Error(`Telegram API failed: ${telegramResponse.statusText}`);
      }

      const telegramResult = await telegramResponse.json();
      console.log(`✅ Message posted to Telegram (message_id: ${telegramResult.result?.message_id})`);

      routingSuccess = true;

      // Log success metrics
      await logMetrics(env, {
        email_routed_total: 1,
        email_ai_sentiment_score: aiAnalysis.score,
        email_routing_success: routingSuccess,
        domain: domain || 'unknown',
        scope: scope || 'unknown'
      });

      console.log(`⏱️ Email processed in ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('❌ Email processing failed:', error);
      
      // Track failure
      await messageTracker.updateMessageStatus(messageId, 'failed', error.message, {
        phase: 'email_processing',
        error: error.message
      });
      
      // Log failure metrics
      await logMetrics(env, {
        email_routed_total: 1,
        email_ai_sentiment_score: 0,
        email_routing_success: false,
        domain: 'unknown',
        scope: 'unknown'
      });

      // Optionally send error notification
      try {
        const errorRpc = createRPCClients({
          apiUrl: env.TGK_INTERNAL_API_URL,
          apiToken: env.TGK_API_TOKEN
        });
        await errorRpc.logging.logEmailProcessingError({
          email: message.to,
          from: message.from,
          error: error.message,
          timestamp: new Date().toISOString(),
          messageId
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle Telegram callback webhook
    if (url.pathname === '/callback' && request.method === 'POST') {
      const callbackId = generateMessageId({
        from: 'telegram',
        to: '/callback',
        subject: 'callback',
        body: '',
        headers: new Headers(),
        raw: new ReadableStream()
      });
      
      // Initialize message tracking for callbacks
      const messageTracker = new MessageTracker(env.DB);
      const reliabilityLayer = createReliabilityLayer();
      
      try {
        const callbackData = await request.json();
        console.log('📞 Received Telegram callback:', callbackData);
        
        // Track callback receipt
        await messageTracker.trackMessage({
          messageId: callbackId,
          emailFrom: 'telegram',
          emailTo: '/callback',
          prId: callbackData.prId ? `pr${callbackData.prId}` : undefined,
          githubAction: callbackData.action,
          status: 'callback_received',
          timestamp: new Date().toISOString(),
          metadata: { callbackData }
        });
        
        // Handle PR action callbacks with pr: prefix
        if (callbackData.action?.startsWith('pr:')) {
          // Execute golden path callback workflow
          const workflowResult = await reliabilityLayer.executeCallbackWorkflow(
            callbackData,
            env
          );
          
          console.log(`✅ PR callback workflow completed: ${workflowResult.workflowId}`);
          
          // Update tracking with workflow completion
          await messageTracker.updateMessageStatus(callbackId, 'github_action_executed', undefined, {
            workflowId: workflowResult.workflowId,
            githubResult: workflowResult.githubResult
          });
          
          return new Response('PR action executed & email reply queued', { status: 200 });
        }
        
        // Handle existing callback types (email_reply, acknowledge_alert, etc.)
        // ... existing callback logic would go here ...
        
        return new Response('Callback processed', { status: 200 });
        
      } catch (error) {
        console.error('❌ Callback processing failed:', error);
        
        // Track callback failure
        await messageTracker.updateMessageStatus(callbackId, 'failed', error.message, {
          phase: 'callback_processing',
          error: error.message
        });
        
        return new Response('Callback processing failed', { status: 500 });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
};
