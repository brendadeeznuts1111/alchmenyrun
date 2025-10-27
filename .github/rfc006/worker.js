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
  }
};
