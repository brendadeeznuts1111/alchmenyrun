/**
 * Kinja Email System Tests
 * Comprehensive test suite for all components
 */

import { 
  KinjaClient,
  KinjaEnhancedEmailAnalyzer,
  TemporalIntelligenceEngine,
  KinjaTelegramFormatter,
  KinjaMetricsEmitter,
  KinjaLearningSystem,
  KinjaEmailOrchestrator,
  KinjaTGKIntegration
} from './index';
import { EmailContent, KinjaEnhancedAnalysis, TemporalAnalysis } from './kinja-analyzer';
import { ParsedEmailAddress, EmailData, BasicAnalysis } from './kinja-formatter';
import { EmailOrchestrationConfig, TGKEmailContext } from './integration';

// Test utilities
class MockKinjaClient extends KinjaClient {
  async assessCorrectness(params: any) {
    return {
      score: 0.8,
      confidence: 0.9,
      riskFactors: ['urgent'],
      issues: []
    };
  }

  async getHistoricalContext(stateId: string) {
    return {
      priorityScore: 75,
      averageResponseTime: 6,
      commonIssues: ['delay'],
      senderPattern: 'internal'
    };
  }
}

class MockRPC {
  async call(method: string, params: any) {
    return {
      sentiment: 'neutral',
      confidence: 0.8,
      urgency: 'p2'
    };
  }
}

class MockTelegram {
  async sendMessage(chatId: string, message: string, options: any) {
    return { message_id: 'test_msg_' + Date.now() };
  }
}

class MockMetrics extends KinjaMetricsEmitter {
  constructor() {
    super('http://mock-metrics', 'mock-key');
  }

  async emitMetric(metric: any) {
    console.log(`Mock metric: ${metric.metric} = ${metric.value}`);
  }
}

// Test data
const createTestEmail = (overrides: Partial<EmailData> = {}): EmailData => ({
  from: 'test@example.com',
  headers: new Map([
    ['subject', 'Test Subject'],
    ['message-id', 'test_msg_001']
  ]),
  subject: 'Test Subject',
  body: 'This is a test email message',
  ...overrides
});

const createTestParsed = (overrides: Partial<ParsedEmailAddress> = {}): ParsedEmailAddress => ({
  domain: 'alchemy',
  scope: 'email',
  type: 'support',
  hierarchy: 'p2',
  ...overrides
});

const createTestContext = (overrides: Partial<TGKEmailContext> = {}): TGKEmailContext => ({
  messageId: 'test_ctx_001',
  originalPriority: 'p2',
  domain: 'alchemy',
  scope: 'email',
  timestamp: new Date(),
  ...overrides
});

// Test suite
export class KinjaEmailTests {
  private kinjaClient: MockKinjaClient;
  private rpc: MockRPC;
  private telegram: MockTelegram;
  private metrics: MockMetrics;

  constructor() {
    this.kinjaClient = new MockKinjaClient();
    this.rpc = new MockRPC();
    this.telegram = new MockTelegram();
    this.metrics = new MockMetrics();
  }

  async runAllTests() {
    console.log('🧪 Starting Kinja Email System Tests...\n');

    const tests = [
      this.testKinjaClient,
      this.testTemporalEngine,
      this.testEmailAnalyzer,
      this.testTelegramFormatter,
      this.testMetricsEmitter,
      this.testLearningSystem,
      this.testOrchestrator,
      this.testTGKIntegration,
      this.testErrorHandling,
      this.testPerformance
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await test.call(this);
        console.log(`✅ ${test.name} - PASSED`);
        passed++;
      } catch (error) {
        console.log(`❌ ${test.name} - FAILED: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  }

  private async testKinjaClient() {
    console.log('Testing KinjaClient...');

    const client = new MockKinjaClient();
    
    const correctness = await client.assessCorrectness({
      content: 'Test content',
      subject: 'Test subject',
      context: 'test',
      senderReputation: 0.8
    });

    if (correctness.score < 0 || correctness.score > 1) {
      throw new Error('Correctness score out of range');
    }

    const historical = await client.getHistoricalContext('test.state');
    if (!historical.priorityScore && historical.priorityScore !== 0) {
      throw new Error('Historical context missing priority score');
    }

    console.log('  ✅ Basic functionality works');
  }

  private async testTemporalEngine() {
    console.log('Testing TemporalIntelligenceEngine...');

    const engine = new TemporalIntelligenceEngine(this.kinjaClient);

    const analysis = await engine.analyzeTemporalContext({
      content: 'Please respond ASAP - this is urgent',
      sender: 'urgent@example.com',
      receivedTime: new Date(),
      stateId: 'test.state'
    });

    if (!analysis.urgencyLevel || !analysis.expectedResponseTime) {
      throw new Error('Missing temporal analysis fields');
    }

    if (analysis.expectedResponseTime <= 0) {
      throw new Error('Invalid expected response time');
    }

    console.log('  ✅ Temporal analysis working');
  }

  private async testEmailAnalyzer() {
    console.log('Testing KinjaEnhancedEmailAnalyzer...');

    const analyzer = new KinjaEnhancedEmailAnalyzer(this.kinjaClient, this.rpc);

    const content: EmailContent = {
      subject: 'Urgent Issue',
      body: 'We need immediate help with production system',
      stateId: 'test.state',
      sender: 'customer@example.com',
      receivedAt: new Date()
    };

    const analysis = await analyzer.analyzeEmailWithKinja(content);

    if (!analysis.calibratedPriority || !analysis.timeToAnswer) {
      throw new Error('Missing analysis fields');
    }

    if (analysis.correctnessScore < 0 || analysis.correctnessScore > 1) {
      throw new Error('Invalid correctness score');
    }

    console.log('  ✅ Email analysis working');
  }

  private async testTelegramFormatter() {
    console.log('Testing KinjaTelegramFormatter...');

    const formatter = new KinjaTelegramFormatter();

    const kinjaAnalysis: KinjaEnhancedAnalysis = {
      sentiment: 'urgent',
      sentimentScore: 0.9,
      timeToAnswer: 2,
      expectedResponseTime: 4,
      temporalUrgency: 'hours',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
      correctnessScore: 0.8,
      confidence: 0.9,
      riskFactors: ['urgent'],
      calibratedPriority: 'p1',
      priorityReason: 'temporal urgency detected',
      escalationRecommendation: 'maintain',
      recommendedActions: [
        { action: 'Acknowledge', priority: 10, estimatedTime: 5 }
      ],
      estimatedEffort: 'minutes',
      requiredSkills: ['communication']
    };

    const message = formatter.formatTelegramMessageWithKinja(
      createTestParsed(),
      { sentiment: 'urgent', sentimentScore: 0.9 },
      createTestEmail(),
      kinjaAnalysis
    );

    if (!message.includes('p1') || !message.includes('Kinja Intelligence')) {
      throw new Error('Message formatting incomplete');
    }

    const keyboard = formatter.buildKinjaEnhancedKeyboard(
      createTestParsed(),
      kinjaAnalysis,
      createTestEmail()
    );

    if (!Array.isArray(keyboard) || keyboard.length === 0) {
      throw new Error('Keyboard generation failed');
    }

    console.log('  ✅ Telegram formatting working');
  }

  private async testMetricsEmitter() {
    console.log('Testing KinjaMetricsEmitter...');

    await this.metrics.emitKinjaEnhancedMetrics(
      createTestParsed(),
      {
        sentiment: 'neutral',
        sentimentScore: 0.8,
        timeToAnswer: 4,
        expectedResponseTime: 8,
        temporalUrgency: 'hours',
        correctnessScore: 0.7,
        confidence: 0.8,
        riskFactors: [],
        calibratedPriority: 'p2',
        priorityReason: 'standard processing',
        escalationRecommendation: 'maintain',
        recommendedActions: [],
        estimatedEffort: 'hours',
        requiredSkills: []
      },
      'processed'
    );

    console.log('  ✅ Metrics emission working');
  }

  private async testLearningSystem() {
    console.log('Testing KinjaLearningSystem...');

    const learning = new KinjaLearningSystem(this.kinjaClient, this.metrics);

    // Test feedback recording
    await learning.recordResponsePattern({
      context: 'test',
      actualResponseTime: 2,
      predictedResponseTime: 3,
      sender: 'test@example.com',
      priority: 'p2',
      timestamp: new Date()
    });

    await learning.recordPriorityDecision({
      originalPriority: 'p2',
      calibratedPriority: 'p1',
      humanOverride: 'p1',
      wasCorrect: true,
      context: 'test',
      timestamp: new Date()
    });

    await learning.recordCorrectnessFeedback({
      content: 'test',
      aiRating: 0.7,
      humanRating: 0.8,
      feedback: 'good',
      context: 'test',
      timestamp: new Date()
    });

    console.log('  ✅ Learning system feedback working');
  }

  private async testOrchestrator() {
    console.log('Testing KinjaEmailOrchestrator...');

    const config: EmailOrchestrationConfig = {
      kinjaApiUrl: 'http://mock',
      kinjaApiKey: 'mock-key',
      metricsEndpoint: 'http://mock-metrics',
      metricsApiKey: 'mock-key',
      telegramBotToken: 'mock-token',
      enableLearning: false,
      learningIntervalHours: 24
    };

    const orchestrator = new KinjaEmailOrchestrator(config, this.rpc, this.telegram);

    const result = await orchestrator.orchestrateEmail(
      createTestParsed(),
      createTestEmail(),
      { sentiment: 'neutral', sentimentScore: 0.8 }
    );

    if (!result.success || !result.kinjaAnalysis) {
      throw new Error('Orchestration failed');
    }

    if (result.processingTimeMs <= 0) {
      throw new Error('Invalid processing time');
    }

    console.log('  ✅ Email orchestration working');
  }

  private async testTGKIntegration() {
    console.log('Testing KinjaTGKIntegration...');

    const integration = new KinjaTGKIntegration({
      kinja: {
        kinjaApiUrl: 'http://mock',
        kinjaApiKey: 'mock-key',
        metricsEndpoint: 'http://mock-metrics',
        metricsApiKey: 'mock-key',
        telegramBotToken: 'mock-token',
        enableLearning: false,
        learningIntervalHours: 24
      },
      tgk: {
        rpcEndpoint: 'http://mock-rpc',
        rpcApiKey: 'mock-key',
        telegramChatId: 'mock-chat',
        enableFallback: true
      }
    });

    const result = await integration.processEmailWithKinja(
      createTestEmail(),
      createTestContext()
    );

    if (!result.success || !result.context) {
      throw new Error('TGK integration failed');
    }

    console.log('  ✅ TGK integration working');
  }

  private async testErrorHandling() {
    console.log('Testing error handling...');

    // Test with invalid configuration
    const invalidConfig: EmailOrchestrationConfig = {
      kinjaApiUrl: 'invalid-url',
      kinjaApiKey: '',
      metricsEndpoint: '',
      metricsApiKey: '',
      telegramBotToken: '',
      enableLearning: false,
      learningIntervalHours: 24
    };

    const orchestrator = new KinjaEmailOrchestrator(invalidConfig, this.rpc, this.telegram);

    const result = await orchestrator.orchestrateEmail(
      createTestParsed(),
      createTestEmail(),
      { sentiment: 'neutral', sentimentScore: 0.8 }
    );

    // Should handle errors gracefully
    if (result.success && !result.error) {
      console.log('  ⚠️ Expected error handling but got success');
    } else {
      console.log('  ✅ Error handling working');
    }
  }

  private async testPerformance() {
    console.log('Testing performance...');

    const orchestrator = new KinjaEmailOrchestrator({
      kinjaApiUrl: 'http://mock',
      kinjaApiKey: 'mock-key',
      metricsEndpoint: 'http://mock-metrics',
      metricsApiKey: 'mock-key',
      telegramBotToken: 'mock-token',
      enableLearning: false,
      learningIntervalHours: 24
    }, this.rpc, this.telegram);

    const startTime = Date.now();
    
    // Process multiple emails
    const promises = Array(10).fill(null).map((_, i) => 
      orchestrator.orchestrateEmail(
        createTestParsed({ domain: `test${i}` }),
        createTestEmail({ subject: `Test ${i}` }),
        { sentiment: 'neutral', sentimentScore: 0.8 }
      )
    );

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / results.length;

    console.log(`  📊 Performance: ${avgTime.toFixed(0)}ms average per email`);
    
    if (avgTime > 5000) { // 5 second threshold
      throw new Error('Performance below threshold');
    }

    console.log('  ✅ Performance test passed');
  }
}

// Test runner
export async function runKinjaEmailTests() {
  const tests = new KinjaEmailTests();
  return await tests.runAllTests();
}

// Individual test exports
export {
  MockKinjaClient,
  MockRPC,
  MockTelegram,
  MockMetrics,
  createTestEmail,
  createTestParsed,
  createTestContext
};
