/**
 * Kinja-Enhanced Email System Entry Point
 * Exports all Kinja intelligence components for easy integration
 */

// Core analysis components
export { KinjaClient, KinjaEnhancedAnalysis, KinjaAction, TemporalAnalysis, CorrectnessAnalysis, HistoricalContext, TimePhrase } from './kinja-analyzer';
export { KinjaEnhancedEmailAnalyzer, EmailContent, BasicAnalysis, ActionPlan } from './kinja-enhanced-analyzer';
export { TemporalIntelligenceEngine, TemporalContext, SenderPattern } from './temporal-engine';

// Formatting and display
export { KinjaTelegramFormatter, ParsedEmailAddress, EmailData } from './kinja-formatter';

// Metrics and observability
export { KinjaMetricsEmitter, MetricData, KinjaEnhancedMetrics } from './kinja-metrics';

// Learning and improvement
export { KinjaLearningSystem, ResponsePattern, PriorityDecision, CorrectnessAssessment, ModelAdjustment } from './kinja-learning';

// Main orchestrator
export { KinjaEmailOrchestrator, EmailOrchestrationConfig, OrchestrationResult } from './kinja-orchestrator';

// Utility functions
export function createKinjaOrchestrator(config: EmailOrchestrationConfig, rpcClient: any, telegramBot: any): KinjaEmailOrchestrator {
  return new KinjaEmailOrchestrator(config, rpcClient, telegramBot);
}

export function getDefaultKinjaConfig(): EmailOrchestrationConfig {
  return {
    kinjaApiUrl: process.env.KINJA_API_URL || 'https://api.kinja.ai',
    kinjaApiKey: process.env.KINJA_API_KEY || '',
    metricsEndpoint: process.env.METRICS_ENDPOINT || 'https://metrics.company.com',
    metricsApiKey: process.env.METRICS_API_KEY || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    enableLearning: process.env.KINJA_LEARNING_ENABLED === 'true',
    learningIntervalHours: parseInt(process.env.KINJA_LEARNING_INTERVAL_HOURS || '24')
  };
}

// Example usage
export async function exampleKinjaIntegration() {
  const config = getDefaultKinjaConfig();
  const mockRpc = { call: async () => ({ sentiment: 'neutral', confidence: 0.8, urgency: 'p2' }) };
  const mockTelegram = { sendMessage: async () => ({ message_id: '123' }) };
  
  const orchestrator = createKinjaOrchestrator(config, mockRpc, mockTelegram);
  
  const parsed = {
    domain: 'alchemy',
    scope: 'email',
    type: 'support',
    hierarchy: 'p2'
  };
  
  const email = {
    from: 'customer@example.com',
    headers: new Map([['subject', 'Help with login issue']]),
    subject: 'Help with login issue',
    body: 'I cannot log in to my account. Please help ASAP.'
  };
  
  const basicAnalysis = {
    sentiment: 'urgent',
    sentimentScore: 0.9
  };
  
  const result = await orchestrator.orchestrateEmail(parsed, email, basicAnalysis);
  
  console.log('Kinja orchestration result:', result);
  
  return result;
}
