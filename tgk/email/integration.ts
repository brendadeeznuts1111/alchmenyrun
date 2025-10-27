/**
 * Kinja Email Integration Helpers
 * Utilities for integrating Kinja intelligence with existing systems
 */

import { KinjaEmailOrchestrator } from './kinja-orchestrator';

export class KinjaEmailIntegration {
  private orchestrator: KinjaEmailOrchestrator;

  constructor() {
    this.orchestrator = new KinjaEmailOrchestrator();
  }

  /**
   * Integrate with existing email processing pipeline
   */
  async enhanceEmailProcessing(email: any, stateId?: string) {
    try {
      // Process with Kinja intelligence
      const result = await this.orchestrator.processEmailWithKinja({
        to: email.to,
        from: email.from,
        subject: email.subject,
        body: email.body || email.text || '',
        headers: email.headers
      }, stateId);

      // Enhance the email object with Kinja data
      return {
        ...email,
        kinja: {
          analysis: result.kinjaAnalysis,
          telegramMessage: result.telegramMessage,
          keyboard: result.keyboard,
          routing: result.routing
        }
      };
    } catch (error) {
      console.error('Kinja processing failed:', error);
      // Return original email if Kinja fails
      return email;
    }
  }

  /**
   * Middleware for existing email routers
   */
  createKinjaMiddleware() {
    return async (email: any, next: Function) => {
      const enhancedEmail = await this.enhanceEmailProcessing(email);

      // Add Kinja data to email for downstream processing
      email.kinjaAnalysis = enhancedEmail.kinja?.analysis;
      email.telegramMessage = enhancedEmail.kinja?.telegramMessage;
      email.interactiveKeyboard = enhancedEmail.kinja?.keyboard;

      return next(email);
    };
  }

  /**
   * Telegram bot integration helper
   */
  createTelegramIntegration(botToken: string) {
    return {
      async sendKinjaEnhancedMessage(chatId: string, email: any) {
        const enhancedEmail = await this.enhanceEmailProcessing(email);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: enhancedEmail.kinja?.telegramMessage || 'Message processed',
            parse_mode: 'Markdown',
            reply_markup: enhancedEmail.kinja?.keyboard ? {
              inline_keyboard: enhancedEmail.kinja.keyboard
            } : undefined
          })
        });

        return response.ok;
      }
    };
  }

  /**
   * Metrics integration helper
   */
  createMetricsIntegration(metricsClient: any) {
    return {
      async recordKinjaMetrics(email: any, result: any) {
        const enhancedEmail = await this.enhanceEmailProcessing(email);

        if (enhancedEmail.kinja?.analysis) {
          const analysis = enhancedEmail.kinja.analysis;

          // Record Kinja-specific metrics
          await metricsClient.increment('kinja_email_processed', {
            domain: result.routing.domain,
            priority: analysis.calibratedPriority,
            correctness: Math.floor(analysis.correctnessScore * 10) / 10
          });

          await metricsClient.gauge('kinja_response_time_prediction', analysis.expectedResponseTime, {
            domain: result.routing.domain,
            temporal_urgency: analysis.temporalUrgency
          });
        }
      }
    };
  }

  /**
   * Learning system integration
   */
  async recordFeedback(emailId: string, feedback: any) {
    await this.orchestrator.recordFeedback(emailId, feedback);
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(timeRange: string = '24h') {
    return await this.orchestrator.getMetricsSummary(timeRange);
  }
}

// Convenience functions for common integrations
export function createKinjaEmailMiddleware() {
  const integration = new KinjaEmailIntegration();
  return integration.createKinjaMiddleware();
}

export function createKinjaTelegramIntegration(botToken: string) {
  const integration = new KinjaEmailIntegration();
  return integration.createTelegramIntegration(botToken);
}

export function createKinjaMetricsIntegration(metricsClient: any) {
  const integration = new KinjaEmailIntegration();
  return integration.createMetricsIntegration(metricsClient);
}

// Default Kinja integration instance
export const kinjaIntegration = new KinjaEmailIntegration();