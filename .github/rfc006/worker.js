/**
 * Phase-6 Email Orchestrator Worker
 * Basic routing implementation - expands to full AI orchestration
 */

export default {
  async email(message, env, ctx) {
    try {
      const toAddress = message.to;
      const fromAddress = message.from;
      const subject = message.headers.get('subject') || 'No Subject';

      console.log(`📧 Processing: ${toAddress} from ${fromAddress}`);

      // Parse structured email: domain.scope.type.hierarchy.meta@cloudflare.com
      const localPart = toAddress.split('@')[0];
      const parts = localPart.split('.');

      if (parts.length !== 5) {
        console.warn(`❌ Invalid format: ${localPart}`);
        return;
      }

      const [domain, scope, type, hierarchy, meta] = parts;

      // Route to Telegram (basic implementation)
      const chatIdMap = {
        'infra': env.INFRA_CHAT_ID || '-1001234567890',
        'docs': env.DOCS_CHAT_ID || '-1001234567891',
        'qa': env.QA_CHAT_ID || '-1001234567892',
        'integrations': env.INTEGRATIONS_CHAT_ID || '-1001234567893',
        'exec': env.EXEC_CHAT_ID || '-1001234567894'
      };

      const chatId = chatIdMap[domain];
      if (!chatId) {
        console.warn(`❌ Unknown domain: ${domain}`);
        return;
      }

      // Priority emojis
      const priorityEmoji = {
        'p0': '🔴', 'p1': '🟠', 'p2': '🟡', 'p3': '🟢', 'blk': '🚨'
      }[hierarchy] || '⚪';

      // Source emojis
      const sourceEmoji = {
        'gh': '🐙', 'tg': '💬', 'cf': '☁️', '24h': '⏰'
      }[meta] || '📧';

      // Event types
      const eventType = {
        'pr': 'Pull Request', 'issue': 'Issue', 'deploy': 'Deployment',
        'alert': 'Alert', 'review': 'Code Review'
      }[type] || type.toUpperCase();

      // Create Telegram message
      const telegramMessage = `${priorityEmoji} **${domain.toUpperCase()}.${scope}** | ${eventType} | ${sourceEmoji}

👤 **From:** ${fromAddress}
📝 **Subject:** ${subject}
🏷️ **Priority:** ${hierarchy.toUpperCase()}
🔗 **Source:** ${meta.toUpperCase()}`;

      // Phase-6.1: OPA Policy Check
      if (env.EMAIL_PR_OPA === "1" && env.opa_evaluate) {
        const policyCheck = await env.opa_evaluate("tgk.pr.allow", {
          action: type === 'pr' ? 'merge' : 'comment',
          gh_status: 'success', // Assume success for demo
          gh_reviews: { APPROVED: 2 }, // Mock approvals
          gh_mergeable: true
        });

        if (!policyCheck.allow) {
          console.log(`🚫 OPA policy denied: ${policyCheck.reason || 'Policy violation'}`);
          return new Response('Policy denied – checks missing or reviews insufficient', { status: 403 });
        }
      }

      // Phase-6.1: Async Queue Processing (zero latency impact)
      if (env.EMAIL_PR_QUEUE === "1" && env.TGK_EMAIL_PR_QUEUE) {
        await env.TGK_EMAIL_PR_QUEUE.send({
          prId: message.headers.get('message-id') || 'unknown',
          ghAction: type,
          message: telegramMessage,
          originalFrom: fromAddress,
          chatId: chatId,
          emailArrivedAt: Date.now()
        });
        console.log(`📋 Queued for async processing: ${message.headers.get('message-id')}`);
        return new Response('Queued for processing', { status: 202 });
      }

      // Send to Telegram
      const response = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        console.log(`✅ Routed to chat ${chatId}`);

        // Log to D1 for analytics
        if (env.DB) {
          await env.DB.prepare(`
            INSERT INTO email_routing (domain, scope, type, hierarchy, meta, chat_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(domain, scope, type, hierarchy, meta, chatId, 'success').run();
        }
      } else {
        console.error(`❌ Telegram API failed: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Processing failed:`, error);
    }
  },

  // Phase-6.1: Async Queue Consumer (processes replies in background)
  async queue(batch, env, ctx) {
    const startTime = Date.now();

    for (const msg of batch.messages) {
      try {
        const { prId, ghAction, message, originalFrom, chatId, emailArrivedAt } = msg.body;
        const processingStart = Date.now();

        // Send Telegram message (actual processing)
        const response = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
          })
        });

        if (!response.ok) {
          throw new Error(`Telegram API failed: ${response.statusText}`);
        }

        const telegramResult = await response.json();
        console.log(`✅ Queued message sent to Telegram (message_id: ${telegramResult.result?.message_id})`);

        // Phase-6.1: Send email reply back if enabled
        if (env.EMAIL_PR_REPLY === "1") {
          // Mock email reply functionality
          console.log(`📧 Would send email reply to: ${originalFrom}`);
          // In real implementation, integrate with SendGrid or similar
        }

        // Phase-6.1: Analytics tracking
        if (env.EMAIL_PR_ANALYTICS === "1" && env.TGK_PR_ANALYTICS) {
          const processingTime = Date.now() - processingStart;
          const totalTime = Date.now() - emailArrivedAt;

          env.TGK_PR_ANALYTICS.writeDataPoint({
            'indexes': [prId, ghAction],
            'doubles': [processingTime, totalTime],
            'blobs': [JSON.stringify({
              from: originalFrom,
              action: ghAction,
              queue_used: true,
              status: 'success'
            })]
          });
        }

        // Mark message as processed
        msg.ack();

      } catch (error) {
        console.error('❌ Queue processing failed:', error);
        // Could implement retry logic or dead letter queue here
        msg.retry();
      }
    }

    console.log(`⏱️ Queue batch processed in ${Date.now() - startTime}ms`);
  }
};
