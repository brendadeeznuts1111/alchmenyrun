/**
 * Message Tracking Utility (Test Version)
 * Tracks email-to-Telegram-to-GitHub message flow for reliability and debugging
 */

class MessageTracker {
  constructor(db) {
    this.db = db;
  }

  async initializeTracking() {
    console.log('🔧 Initializing message tracking...');
    
    try {
      // Create tracking table if not exists
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS message_tracking (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id TEXT UNIQUE NOT NULL,
          email_from TEXT NOT NULL,
          email_to TEXT NOT NULL,
          pr_id TEXT,
          telegram_chat_id TEXT,
          telegram_message_id TEXT,
          github_action TEXT,
          status TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          error TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for performance
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_message_tracking_status ON message_tracking(status);
        CREATE INDEX IF NOT EXISTS idx_message_tracking_pr_id ON message_tracking(pr_id);
        CREATE INDEX IF NOT EXISTS idx_message_tracking_timestamp ON message_tracking(timestamp);
      `);

      console.log('✅ Message tracking initialized');
    } catch (error) {
      console.error('❌ Failed to initialize message tracking:', error.message);
      throw error;
    }
  }

  async trackMessage(tracking) {
    console.log(`📊 Tracking message: ${tracking.messageId} - Status: ${tracking.status}`);

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO message_tracking 
        (message_id, email_from, email_to, pr_id, telegram_chat_id, telegram_message_id, 
         github_action, status, error, metadata, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.bind(
        tracking.messageId,
        tracking.emailFrom,
        tracking.emailTo,
        tracking.prId || null,
        tracking.telegramChatId || null,
        tracking.telegramMessageId || null,
        tracking.githubAction || null,
        tracking.status,
        tracking.error || null,
        tracking.metadata ? JSON.stringify(tracking.metadata) : null,
        new Date().toISOString()
      ).run();

      console.log(`✅ Message tracked: ${tracking.messageId}`);
    } catch (error) {
      console.error('❌ Failed to track message:', error.message);
      // Don't throw - tracking failure shouldn't break the main flow
    }
  }

  async updateMessageStatus(messageId, status, error, metadata) {
    console.log(`🔄 Updating message status: ${messageId} -> ${status}`);

    try {
      const stmt = this.db.prepare(`
        UPDATE message_tracking 
        SET status = ?, error = ?, metadata = ?, updated_at = ?
        WHERE message_id = ?
      `);

      await stmt.bind(
        status,
        error || null,
        metadata ? JSON.stringify(metadata) : null,
        new Date().toISOString(),
        messageId
      ).run();

      console.log(`✅ Message status updated: ${messageId} -> ${status}`);
    } catch (error) {
      console.error('❌ Failed to update message status:', error.message);
    }
  }

  async getTrackingMetrics(timeframeHours = 24) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN status != 'failed' THEN 1 END) as successful_processing,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_processing,
          AVG(CASE WHEN status = 'github_action_executed' THEN 
            (julianday(updated_at) - julianday(timestamp)) * 24 * 60 * 60 
          END) as avg_processing_time_seconds
        FROM message_tracking 
        WHERE timestamp > datetime('now', '-${timeframeHours} hours')
      `);

      const result = await stmt.first();

      return {
        totalMessages: result.total_messages || 0,
        successfulProcessing: result.successful_processing || 0,
        failedProcessing: result.failed_processing || 0,
        averageProcessingTime: result.avg_processing_time_seconds || 0,
        telegramSuccessRate: 95, // Mock data for testing
        githubSuccessRate: 90,   // Mock data for testing
        emailReplySuccessRate: 85 // Mock data for testing
      };
    } catch (error) {
      console.error('❌ Failed to get tracking metrics:', error.message);
      return {
        totalMessages: 0,
        successfulProcessing: 0,
        failedProcessing: 0,
        averageProcessingTime: 0,
        telegramSuccessRate: 0,
        githubSuccessRate: 0,
        emailReplySuccessRate: 0
      };
    }
  }
}

module.exports = {
  MessageTracker
};
