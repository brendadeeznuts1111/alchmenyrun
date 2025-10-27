/**
 * Message Tracking Utility
 * Tracks email-to-Telegram-to-GitHub message flow for reliability and debugging
 */

interface MessageTracking {
  messageId: string;
  emailFrom: string;
  emailTo: string;
  prId?: string;
  telegramChatId?: string;
  telegramMessageId?: string;
  githubAction?: string;
  status: 'received' | 'processed' | 'sent_to_telegram' | 'callback_received' | 'github_action_executed' | 'email_reply_sent' | 'failed';
  timestamp: string;
  error?: string;
  metadata?: any;
}

interface TrackingMetrics {
  totalMessages: number;
  successfulProcessing: number;
  failedProcessing: number;
  averageProcessingTime: number;
  telegramSuccessRate: number;
  githubSuccessRate: number;
  emailReplySuccessRate: number;
}

class MessageTracker {
  constructor(db) {
    this.db = db;
  }

  async initializeTracking(): Promise<void> {
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

  async trackMessage(tracking: MessageTracking): Promise<void> {
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

  async updateMessageStatus(messageId: string, status: string, error?: string, metadata?: any): Promise<void> {
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

  async getMessageTracking(messageId: string): Promise<MessageTracking | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM message_tracking WHERE message_id = ?
      `);

      const result = await stmt.bind(messageId).first();
      
      if (result) {
        return {
          messageId: result.message_id,
          emailFrom: result.email_from,
          emailTo: result.email_to,
          prId: result.pr_id,
          telegramChatId: result.telegram_chat_id,
          telegramMessageId: result.telegram_message_id,
          githubAction: result.github_action,
          status: result.status,
          timestamp: result.timestamp,
          error: result.error,
          metadata: result.metadata ? JSON.parse(result.metadata) : undefined
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get message tracking:', error.message);
      return null;
    }
  }

  async getTrackingMetrics(timeframeHours: number = 24): Promise<TrackingMetrics> {
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

      // Get success rates for each step
      const telegramStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent_to_telegram' OR status = 'callback_received' THEN 1 END) as successful
        FROM message_tracking 
        WHERE timestamp > datetime('now', '-${timeframeHours} hours')
        AND pr_id IS NOT NULL
      `);

      const telegramResult = await telegramStmt.first();

      const githubStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'github_action_executed' THEN 1 END) as successful
        FROM message_tracking 
        WHERE timestamp > datetime('now', '-${timeframeHours} hours')
        AND github_action IS NOT NULL
      `);

      const githubResult = await githubStmt.first();

      const emailStmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'email_reply_sent' THEN 1 END) as successful
        FROM message_tracking 
        WHERE timestamp > datetime('now', '-${timeframeHours} hours')
        AND github_action IS NOT NULL
      `);

      const emailResult = await emailStmt.first();

      return {
        totalMessages: result.total_messages || 0,
        successfulProcessing: result.successful_processing || 0,
        failedProcessing: result.failed_processing || 0,
        averageProcessingTime: result.avg_processing_time_seconds || 0,
        telegramSuccessRate: telegramResult.total > 0 ? (telegramResult.successful / telegramResult.total) * 100 : 0,
        githubSuccessRate: githubResult.total > 0 ? (githubResult.successful / githubResult.total) * 100 : 0,
        emailReplySuccessRate: emailResult.total > 0 ? (emailResult.successful / emailResult.total) * 100 : 0
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

  async getFailedMessages(limit: number = 10): Promise<MessageTracking[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM message_tracking 
        WHERE status = 'failed' 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);

      const results = await stmt.bind(limit).all();
      
      return results.map(row => ({
        messageId: row.message_id,
        emailFrom: row.email_from,
        emailTo: row.email_to,
        prId: row.pr_id,
        telegramChatId: row.telegram_chat_id,
        telegramMessageId: row.telegram_message_id,
        githubAction: row.github_action,
        status: row.status,
        timestamp: row.timestamp,
        error: row.error,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      }));
    } catch (error) {
      console.error('❌ Failed to get failed messages:', error.message);
      return [];
    }
  }

  async cleanupOldMessages(daysToKeep: number = 30): Promise<void> {
    console.log(`🧹 Cleaning up messages older than ${daysToKeep} days...`);

    try {
      const stmt = this.db.prepare(`
        DELETE FROM message_tracking 
        WHERE timestamp < datetime('now', '-${daysToKeep} days')
      `);

      const result = await stmt.run();
      console.log(`✅ Cleaned up ${result.changes} old tracking records`);
    } catch (error) {
      console.error('❌ Failed to cleanup old messages:', error.message);
    }
  }
}

export { MessageTracker, MessageTracking, TrackingMetrics };
