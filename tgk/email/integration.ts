/**
 * Kinja Email Integration Layer
 * Integrates with existing TGK orchestration system
 */

import { KinjaEmailOrchestrator, EmailOrchestrationConfig, OrchestrationResult } from './kinja-orchestrator';
import { ParsedEmailAddress, EmailData, BasicAnalysis } from './kinja-formatter';
import { KinjaEnhancedAnalysis } from './kinja-analyzer';

export interface TGKIntegrationConfig {
  kinja: EmailOrchestrationConfig;
  tgk: {
    rpcEndpoint: string;
    rpcApiKey: string;
    telegramChatId: string;
    enableFallback: boolean;
  };
}

export interface TGKEmailContext {
  messageId: string;
  threadId?: string;
  originalPriority: string;
  domain: string;
  scope: string;
  timestamp: Date;
}

export class KinjaTGKIntegration {
  private orchestrator: KinjaEmailOrchestrator;
  private config: TGKIntegrationConfig;
  private rpc: any;
  private fallbackHandler: any;

  constructor(config: TGKIntegrationConfig) {
    this.config = config;
    this.rpc = this.createRPCClient(config.tgk.rpcEndpoint, config.tgk.rpcApiKey);
    this.orchestrator = new KinjaEmailOrchestrator(
      config.kinja,
      this.rpc,
      this.createTelegramBot()
    );
    
    if (config.tgk.enableFallback) {
      this.fallbackHandler = new FallbackEmailHandler();
    }
  }

  async processEmailWithKinja(
    email: EmailData,
    context: TGKEmailContext
  ): Promise<OrchestrationResult & { context: TGKEmailContext }> {
    
    try {
      console.log(`Processing email ${context.messageId} with Kinja integration`);
      
      // 1. Parse email address for domain/scope
      const parsed = this.parseEmailAddress(email.from, context);
      
      // 2. Get basic AI analysis from TGK
      const basicAnalysis = await this.getBasicAnalysis(email, context);
      
      // 3. Process with Kinja orchestrator
      const kinjaResult = await this.orchestrator.orchestrateEmail(
        parsed,
        email,
        basicAnalysis
      );

      // 4. Store enhanced analysis for future learning
      await this.storeKinjaAnalysis(context.messageId, kinjaResult.kinjaAnalysis);
      
      // 5. Update TGK routing based on Kinja insights
      await this.updateTGKRouting(context, kinjaResult.kinjaAnalysis);

      return {
        ...kinjaResult,
        context
      };

    } catch (error) {
      console.error('Kinja integration failed:', error);
      
      // Fallback to standard TGK processing if enabled
      if (this.config.tgk.enableFallback) {
        console.log('Falling back to standard TGK processing');
        return await this.fallbackHandler.processEmail(email, context);
      }
      
      throw error;
    }
  }

  async handleKinjaCallback(callbackData: string, context: TGKEmailContext): Promise<void> {
    try {
      // Parse callback data
      const data = JSON.parse(callbackData);
      
      // Handle through Kinja orchestrator
      await this.orchestrator.handleKinjaCallback(callbackData);
      
      // Update TGK state based on callback action
      await this.updateTGKStateFromCallback(data, context);
      
      // Record feedback for learning
      await this.recordCallbackFeedback(data, context);
      
    } catch (error) {
      console.error('Error handling Kinja callback:', error);
      throw error;
    }
  }

  async getKinjaInsights(messageId: string): Promise<KinjaEnhancedAnalysis | null> {
    try {
      // Retrieve stored Kinja analysis
      const stored = await this.retrieveStoredAnalysis(messageId);
      return stored;
    } catch (error) {
      console.error('Error retrieving Kinja insights:', error);
      return null;
    }
  }

  async batchProcessEmails(
    emails: Array<{ email: EmailData; context: TGKEmailContext }>
  ): Promise<Array<OrchestrationResult & { context: TGKEmailContext }>> {
    
    console.log(`Batch processing ${emails.length} emails with Kinja`);
    
    const results = await Promise.allSettled(
      emails.map(({ email, context }) => this.processEmailWithKinja(email, context))
    );

    const successful = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
    const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

    console.log(`Batch processing completed: ${successful.length} successful, ${failed.length} failed`);

    // Emit batch processing metrics
    await this.orchestrator['metrics'].emitMetric({
      metric: 'tgk_kinja_batch_processing',
      value: successful.length,
      labels: {
        total_emails: emails.length.toString(),
        success_rate: (successful.length / emails.length).toString(),
        failure_count: failed.length.toString()
      }
    });

    return successful.map(r => r.value);
  }

  private parseEmailAddress(sender: string, context: TGKEmailContext): ParsedEmailAddress {
    // Extract domain and scope from context or sender
    const domain = context.domain || this.extractDomainFromSender(sender);
    const scope = context.scope || 'email';
    
    return {
      domain,
      scope,
      type: 'incoming',
      hierarchy: context.originalPriority
    };
  }

  private extractDomainFromSender(sender: string): string {
    // Simple domain extraction - could be enhanced
    if (sender.includes('alchemy')) return 'alchemy';
    if (sender.includes('tgk')) return 'tgk';
    if (sender.includes('infra')) return 'infra';
    return 'unknown';
  }

  private async getBasicAnalysis(email: EmailData, context: TGKEmailContext): Promise<BasicAnalysis> {
    try {
      // Call TGK AI analysis
      const analysis = await this.rpc.call('ai.analyzeEmailContent', {
        subject: email.headers.get('subject'),
        body: email.body,
        stateId: `${context.domain}.${context.scope}`,
        context: 'email_routing'
      });

      return {
        sentiment: analysis.sentiment || 'neutral',
        sentimentScore: analysis.confidence || 0.5,
        urgency: analysis.urgency || context.originalPriority
      };
    } catch (error) {
      console.error('Error getting basic analysis:', error);
      return {
        sentiment: 'neutral',
        sentimentScore: 0.5,
        urgency: context.originalPriority
      };
    }
  }

  private async storeKinjaAnalysis(messageId: string, analysis: KinjaEnhancedAnalysis): Promise<void> {
    // Store in Redis or database for retrieval
    const storageKey = `kinja:analysis:${messageId}`;
    const data = JSON.stringify(analysis);
    
    // Mock storage - would use actual Redis/database
    console.log(`Storing Kinja analysis for ${messageId}`);
  }

  private async retrieveStoredAnalysis(messageId: string): Promise<KinjaEnhancedAnalysis | null> {
    // Retrieve from storage
    const storageKey = `kinja:analysis:${messageId}`;
    
    // Mock retrieval - would use actual Redis/database
    console.log(`Retrieving Kinja analysis for ${messageId}`);
    return null;
  }

  private async updateTGKRouting(context: TGKEmailContext, analysis: KinjaEnhancedAnalysis): Promise<void> {
    // Update TGK routing based on Kinja priority calibration
    if (analysis.calibratedPriority !== context.originalPriority) {
      console.log(`Updating routing priority: ${context.originalPriority} -> ${analysis.calibratedPriority}`);
      
      // Call TGK routing update
      await this.rpc.call('routing.updatePriority', {
        messageId: context.messageId,
        newPriority: analysis.calibratedPriority,
        reason: analysis.priorityReason
      });
    }
  }

  private async updateTGKStateFromCallback(data: any, context: TGKEmailContext): Promise<void> {
    // Update TGK state based on callback action
    switch (data.action) {
      case 'acknowledge_critical':
        await this.rpc.call('state.acknowledge', {
          messageId: context.messageId,
          acknowledged: true,
          acknowledgedAt: new Date()
        });
        break;
        
      case 'escalate_immediately':
        await this.rpc.call('routing.escalate', {
          messageId: context.messageId,
          priority: 'p0',
          reason: 'Kinja immediate escalation'
        });
        break;
        
      default:
        console.log(`No TGK state update for action: ${data.action}`);
    }
  }

  private async recordCallbackFeedback(data: any, context: TGKEmailContext): Promise<void> {
    // Record feedback for Kinja learning
    const feedback = {
      messageId: context.messageId,
      action: data.action,
      timestamp: new Date(),
      userChoice: data
    };
    
    await this.orchestrator.recordFeedback(feedback);
  }

  private createRPCClient(endpoint: string, apiKey: string): any {
    // Mock RPC client - would be actual implementation
    return {
      call: async (method: string, params: any) => {
        console.log(`RPC call: ${method}`, params);
        return { success: true };
      }
    };
  }

  private createTelegramBot(): any {
    // Mock Telegram bot - would be actual implementation
    return {
      sendMessage: async (chatId: string, message: string, options: any) => {
        console.log(`Telegram message to ${chatId}:`, message);
        return { message_id: Date.now().toString() };
      }
    };
  }
}

class FallbackEmailHandler {
  async processEmail(email: EmailData, context: TGKEmailContext): Promise<OrchestrationResult & { context: TGKEmailContext }> {
    console.log('Using fallback email processing');
    
    return {
      success: true,
      messageId: context.messageId,
      formattedMessage: `Fallback processing for ${email.headers.get('subject')}`,
      keyboard: [],
      processingTimeMs: 100,
      context
    };
  }
}

// Factory function for easy integration
export function createKinjaTGKIntegration(config: TGKIntegrationConfig): KinjaTGKIntegration {
  return new KinjaTGKIntegration(config);
}

// Default configuration
export function getDefaultTGKIntegrationConfig(): TGKIntegrationConfig {
  return {
    kinja: {
      kinjaApiUrl: process.env.KINJA_API_URL || 'https://api.kinja.ai',
      kinjaApiKey: process.env.KINJA_API_KEY || '',
      metricsEndpoint: process.env.METRICS_ENDPOINT || 'https://metrics.company.com',
      metricsApiKey: process.env.METRICS_API_KEY || '',
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
      enableLearning: process.env.KINJA_LEARNING_ENABLED === 'true',
      learningIntervalHours: parseInt(process.env.KINJA_LEARNING_INTERVAL_HOURS || '24')
    },
    tgk: {
      rpcEndpoint: process.env.TGK_RPC_ENDPOINT || 'http://localhost:3000',
      rpcApiKey: process.env.TGK_RPC_API_KEY || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || '-1001234567890',
      enableFallback: process.env.TGK_ENABLE_FALLBACK !== 'false'
    }
  };
}
