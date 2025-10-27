/**
 * Telegram Bot Integration for tgk
 * Handles message posting, updating, and pinning
 */

class TelegramBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  async sendMessage(chatId, text, options = {}) {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options
    };

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }

  async pinMessage(chatId, messageId) {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      disable_notification: true
    };

    const response = await fetch(`${this.baseUrl}/pinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }

  async updatePinnedMessage(messageId, newText, replyMarkup = null) {
    // Note: Telegram doesn't allow editing pinned messages directly
    // This would typically unpin the old message and pin a new one
    // For now, we'll send a new message and pin it
    const chatId = process.env.TELEGRAM_COUNCIL_ID;
    
    // Send new message
    const newMessage = await this.sendMessage(chatId, newText, {
      reply_markup: replyMarkup
    });

    // Pin the new message
    await this.pinMessage(chatId, newMessage.message_id);

    // Unpin the old message
    await this.unpinMessage(chatId, messageId);

    return newMessage;
  }

  async unpinMessage(chatId, messageId) {
    const payload = {
      chat_id: chatId,
      message_id: messageId
    };

    const response = await fetch(`${this.baseUrl}/unpinChatMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }

  async getPinnedMessages(chatId) {
    const response = await fetch(`${this.baseUrl}/getChatPinnedMessages?chat_id=${chatId}`);
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result.result;
  }
}

module.exports = { TelegramBot };
