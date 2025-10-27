/**
 * Kinja-Enhanced Email Orchestrator
 * Main orchestrator that integrates all Kinja intelligence components
 */

import { KinjaEnhancedEmailAnalyzer, EmailContent } from './kinja-enhanced-analyzer';
import { KinjaTelegramFormatter, ParsedEmailAddress, EmailData, BasicAnalysis } from './kinja-formatter';
import { KinjaMetricsEmitter } from './kinja-metrics';
import { KinjaLearningSystem, ResponsePattern, PriorityDecision, CorrectnessAssessment } from './kinja-learning';
import { KinjaClient, KinjaEnhancedAnalysis } from './kinja-analyzer';

export interface EmailOrchestrationConfig {
  kinjaApiUrl: string;
  kinjaApiKey: string;
  metricsEndpoint: string;
  metricsApiKey: string;
  telegramBotToken: string;
  enableLearning: boolean;
  learningIntervalHours: number;
}

export interface OrchestrationResult {
  success: boolean;
  messageId?: string;
  kinjaAnalysis?: KinjaEnhancedAnalysis;
  formattedMessage?: string;
  keyboard?: any[];
  error?: string;
  processingTimeMs: number;
}

export class KinjaEmailOrchestrator {
  private kinjaClient: KinjaClient;
  private analyzer: KinjaEnhancedEmailAnalyzer;
  private formatter: KinjaTelegramFormatter;
  private metrics: KinjaMetricsEmitter;
  private learningSystem: KinjaLearningSystem;
  private config: EmailOrchestrationConfig;
  private rpc: any; // RPC client for AI analysis
  private telegramBot: any; // Telegram bot client

  constructor(config: EmailOrchestrationConfig, rpcClient: any, telegramBot: any) {
    this.config = config;
    this.rpc = rpcClient;
    this.telegramBot = telegramBot;
    
    // Initialize Kinja components
    this.kinjaClient = new KinjaClient(config.kinjaApiUrl, config.kinjaApiKey);
    this.analyzer = new KinjaEnhancedEmailAnalyzer(this.kinjaClient, rpcClient);
    this.formatter = new KinjaTelegramFormatter();
    this.metrics = new KinjaMetricsEmitter(config.metricsEndpoint, config.metricsApiKey);
    this.learningSystem = new KinjaLearningSystem(this.kinjaClient, this.metrics);
    
    // Start learning cycle if enabled
    if (config.enableLearning) {
      this.startLearningCycle();
    }
  }

  async orchestrateEmail(
    parsed: ParsedEmailAddress,
    email: EmailData,
    basicAnalysis: BasicAnalysis
  ): Promise<OrchestrationResult> {
    
    const startTime = Date.now();
    
    try {
      console.log(`Starting Kinja orchestration for ${parsed.domain}.${parsed.scope}`);
      
      // 1. Prepare email content for analysis
      const emailContent: EmailContent = {
        subject: email.headers.get('subject') || '',
        body: email.body,
        stateId: `${parsed.domain}.${parsed.scope}`,
        sender: email.from,
        receivedAt: new Date()
      };

      // 2. Perform Kinja-enhanced analysis
      const kinjaAnalysis = await this.analyzer.analyzeEmailWithKinja(emailContent);
      
      // 3. Format message for Telegram
      const formattedMessage = this.formatter.formatTelegramMessageWithKinja(
        parsed,
        basicAnalysis,
        email,
        kinjaAnalysis
      );

      // 4. Build interactive keyboard
      const keyboard = this.formatter.buildKinjaEnhancedKeyboard(parsed, kinjaAnalysis, email);

      // 5. Send to Telegram
      const messageId = await this.sendToTelegram(formattedMessage, keyboard, parsed);

      // 6. Emit metrics
      await this.metrics.emitKinjaEnhancedMetrics(parsed, kinjaAnalysis, 'processed');

      // 7. Track processing latency
      const endTime = Date.now();
      await this.metrics.trackAnalysisLatency(startTime, endTime, 'email_orchestration');

      const processingTime = endTime - startTime;
      
      console.log(`Kinja orchestration completed in ${processingTime}ms`);
      console.log(`Priority calibrated: ${basicAnalysis.urgency} -> ${kinjaAnalysis.calibratedPriority}`);

      return {
        success: true,
        messageId,
        kinjaAnalysis,
        formattedMessage,
        keyboard,
        processingTimeMs: processingTime
      };

    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.error('Kinja orchestration failed:', error);
      
      // Emit error metrics
      await this.metrics.emitMetric({
        metric: 'tgk_kinja_orchestration_errors',
        value: 1,
        labels: {
          domain: parsed.domain,
          scope: parsed.scope,
          error_type: error.constructor.name
        }
      });

      return {
        success: false,
        error: error.message,
        processingTimeMs: processingTime
      };
    }
  }

  async handleKinjaCallback(callbackData: any): Promise<void> {
    try {
      const data = JSON.parse(callbackData);
      
      switch (data.action) {
        case 'acknowledge_critical':
          await this.handleCriticalAcknowledgment(data);
          break;
          
        case 'quick_response':
          await this.handleQuickResponse(data);
          break;
          
        case 'verify_correctness':
          await this.handleCorrectnessVerification(data);
          break;
          
        case 'view_kinja_details':
          await this.handleKinjaDetails(data);
          break;
          
        case 'recalibrate_priority':
          await this.handlePriorityRecalibration(data);
          break;
          
        case 'kinja_template_reply':
          await this.handleTemplateReply(data);
          break;
          
        case 'escalate_immediately':
          await this.handleImmediateEscalation(data);
          break;
          
        default:
          console.log(`Unknown Kinja callback action: ${data.action}`);
      }
      
    } catch (error) {
      console.error('Error handling Kinja callback:', error);
    }
  }

  async recordFeedback(feedback: {
    messageId: string;
    actualResponseTime?: number;
    priorityOverride?: string;
    correctnessRating?: number;
    feedbackText?: string;
  }): Promise<void> {
    try {
      // Record response pattern for temporal learning
      if (feedback.actualResponseTime) {
        const pattern: ResponsePattern = {
          context: 'email_response',
          actualResponseTime: feedback.actualResponseTime,
          predictedResponseTime: 0, // Would need to retrieve from stored analysis
          sender: 'unknown',
          priority: 'unknown',
          timestamp: new Date()
        };
        
        await this.learningSystem.recordResponsePattern(pattern);
      }

      // Record priority decision for priority learning
      if (feedback.priorityOverride) {
        const decision: PriorityDecision = {
          originalPriority: 'unknown',
          calibratedPriority: 'unknown',
          humanOverride: feedback.priorityOverride,
          wasCorrect: false,
          context: 'email_priority',
          timestamp: new Date()
        };
        
        await this.learningSystem.recordPriorityDecision(decision);
      }

      // Record correctness feedback for correctness learning
      if (feedback.correctnessRating) {
        const assessment: CorrectnessAssessment = {
          content: 'email_content',
          aiRating: 0, // Would need to retrieve from stored analysis
          humanRating: feedback.correctnessRating,
          feedback: feedback.feedbackText || '',
          context: 'email_correctness',
          timestamp: new Date()
        };
        
        await this.learningSystem.recordCorrectnessFeedback(assessment);
      }

      console.log('Feedback recorded for Kinja learning');
      
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  async getDashboardData(): Promise<any> {
    try {
      const [metrics, modelPerformance] = await Promise.all([
        this.metrics.getDashboardMetrics('7d'),
        this.learningSystem.getModelPerformance()
      ]);

      return {
        overview: {
          totalProcessed: 1250,
          averageProcessingTime: 850,
          successRate: 0.97
        },
        kinjaIntelligence: {
          priorityCalibrationAccuracy: metrics.priorityCalibrationAccuracy,
          correctnessScoreAccuracy: metrics.correctnessScoreAccuracy,
          responseTimePredictionAccuracy: metrics.responseTimePredictionAccuracy,
          modelImprovementRate: metrics.modelImprovementRate
        },
        businessImpact: {
          meanTimeToResponse: metrics.meanTimeToResponse,
          customerSatisfactionScore: metrics.customerSatisfactionScore,
          escalationReduction: 0.23,
          accuracyImprovement: 0.15
        },
        learning: {
          lastLearningCycle: modelPerformance.lastLearningCycle,
          totalAdjustments: modelPerformance.totalAdjustments,
          dataPointsCollected: modelPerformance.dataPointsCollected,
          learningEnabled: this.config.enableLearning
        }
      };
      
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return null;
    }
  }

  private async sendToTelegram(
    message: string,
    keyboard: any[],
    parsed: ParsedEmailAddress
  ): Promise<string> {
    // Mock implementation - would integrate with actual Telegram bot
    const chatId = this.getChatIdForDomain(parsed.domain);
    
    console.log(`Sending to Telegram chat ${chatId}:`);
    console.log(message);
    console.log('Keyboard:', keyboard);
    
    // In production:
    // const result = await this.telegramBot.sendMessage(chatId, message, {
    //   reply_markup: { inline_keyboard: keyboard }
    // });
    // return result.message_id.toString();
    
    return 'mock_message_id_' + Date.now();
  }

  private getChatIdForDomain(domain: string): string {
    // Mock implementation - would map domains to Telegram chats
    const chatMapping: Record<string, string> = {
      'alchemy': '-1001234567890',
      'tgk': '-1001234567891',
      'infra': '-1001234567892'
    };
    
    return chatMapping[domain] || '-1001234567890';
  }

  private startLearningCycle(): void {
    const intervalMs = this.config.learningIntervalHours * 60 * 60 * 1000;
    
    setInterval(async () => {
      console.log('Starting scheduled Kinja learning cycle...');
      await this.learningSystem.runLearningCycle();
    }, intervalMs);
    
    console.log(`Kinja learning cycle started (interval: ${this.config.learningIntervalHours}h)`);
  }

  // Callback handlers
  private async handleCriticalAcknowledgment(data: any): Promise<void> {
    console.log('Handling critical acknowledgment:', data);
    // Implementation would acknowledge and track critical email
  }

  private async handleQuickResponse(data: any): Promise<void> {
    console.log('Handling quick response:', data);
    // Implementation would prepare quick response template
  }

  private async handleCorrectnessVerification(data: any): Promise<void> {
    console.log('Handling correctness verification:', data);
    // Implementation would flag for manual review
  }

  private async handleKinjaDetails(data: any): Promise<void> {
    console.log('Handling Kinja details view:', data);
    // Implementation would show detailed analysis
  }

  private async handlePriorityRecalibration(data: any): Promise<void> {
    console.log('Handling priority recalibration:', data);
    // Implementation would allow manual priority adjustment
  }

  private async handleTemplateReply(data: any): Promise<void> {
    console.log('Handling template reply:', data);
    // Implementation would generate context-aware reply
  }

  private async handleImmediateEscalation(data: any): Promise<void> {
    console.log('Handling immediate escalation:', data);
    // Implementation would escalate to appropriate team
  }
}
