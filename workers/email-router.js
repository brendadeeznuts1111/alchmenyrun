/**
 * Cloudflare Email Worker - Routes structured CODEOWNERS emails to Telegram
 * Format: [DOMAIN].[SCOPE].[TYPE].[HIERARCHY].[META]@cloudflare.com
 *
 * Matches pattern: *@cloudflare.com (catch-all for structured addresses)
 */

export default {
  async email(message, env, ctx) {
    try {
      const toAddress = message.to;
      const fromAddress = message.from;
      const subject = message.headers.get('subject') || 'No Subject';
      const messageId = message.headers.get('message-id');

      console.log(`📧 Processing email: ${toAddress} from ${fromAddress}`);

      // Parse the structured email address
      const localPart = toAddress.split('@')[0]; // Everything before @
      const parts = localPart.split('.');

      // Validate format: exactly 5 dot-separated parts
      if (parts.length !== 5) {
        console.warn(`❌ Invalid email format: ${localPart} (expected 5 parts)`);
        return;
      }

      const [domain, scope, type, hierarchy, meta] = parts;

      // Map domain to Telegram chat ID
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

      // Format priority indicator
      const priorityEmoji = {
        'p0': '🔴',
        'p1': '🟠',
        'p2': '🟡',
        'p3': '🟢',
        'blk': '🚨'
      }[hierarchy] || '⚪';

      // Format source indicator
      const sourceEmoji = {
        'gh': '🐙',
        'tg': '💬',
        'cf': '☁️',
        '24h': '⏰'
      }[meta] || '📧';

      // Format event type
      const typeLabel = {
        'pr': 'Pull Request',
        'issue': 'Issue',
        'deploy': 'Deployment',
        'alert': 'Alert',
        'review': 'Code Review'
      }[type] || type.toUpperCase();

      // Create Telegram message
      const telegramMessage = `${priorityEmoji} **${domain.toUpperCase()}.${scope}** | ${typeLabel} | ${sourceEmoji}

👤 **From:** ${fromAddress}
📝 **Subject:** ${subject}
🏷️ **Priority:** ${hierarchy.toUpperCase()}
🔗 **Source:** ${meta.toUpperCase()}

${messageId ? `🆔 **Message ID:** ${messageId}` : ''}`;

      // Send to Telegram
      const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare-Email-Worker/1.0'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error(`❌ Telegram API error: ${telegramResponse.status} - ${errorText}`);

        // Could implement retry logic or fallback here
        throw new Error(`Telegram API failed: ${telegramResponse.status}`);
      }

      const result = await telegramResponse.json();
      console.log(`✅ Message sent to Telegram chat ${chatId}: ${result.ok ? 'success' : 'failed'}`);

    } catch (error) {
      console.error(`❌ Email processing failed:`, error);

      // Send error notification to admin channel if configured
      if (env.ADMIN_CHAT_ID && env.TELEGRAM_BOT_TOKEN) {
        try {
          await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: env.ADMIN_CHAT_ID,
              text: `🚨 **Email Router Error**\n\nFailed to process email from ${message.from} to ${message.to}\n\n\`\`\`\n${error.message}\n\`\`\``,
              parse_mode: 'Markdown'
            })
          });
        } catch (notifyError) {
          console.error(`❌ Failed to send error notification:`, notifyError);
        }
      }
    }
  }
};

/**
 * Environment Variables Required:
 *
 * TELEGRAM_BOT_TOKEN - Your Telegram bot token
 * INFRA_CHAT_ID - Infrastructure team chat ID (e.g., -1001234567890)
 * DOCS_CHAT_ID - Documentation team chat ID
 * QA_CHAT_ID - Quality team chat ID
 * INTEGRATIONS_CHAT_ID - Provider team chat ID
 * EXEC_CHAT_ID - Executive team chat ID
 * ADMIN_CHAT_ID - Admin notifications chat ID (optional)
 */
