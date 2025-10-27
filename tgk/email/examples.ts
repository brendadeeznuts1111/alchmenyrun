/**
 * Kinja Email System Examples
 * Demonstrates various usage patterns and integrations
 */

import { 
  KinjaEmailOrchestrator, 
  EmailOrchestrationConfig,
  createKinjaOrchestrator,
  getDefaultKinjaConfig 
} from './kinja-orchestrator';
import { 
  KinjaTGKIntegration,
  createKinjaTGKIntegration,
  getDefaultTGKIntegrationConfig,
  TGKEmailContext 
} from './integration';
import { ParsedEmailAddress, EmailData, BasicAnalysis } from './kinja-formatter';
import { KinjaEnhancedAnalysis } from './kinja-analyzer';

// Example 1: Basic Kinja Email Processing
export async function basicKinjaExample() {
  console.log('=== Basic Kinja Email Processing Example ===');
  
  // Initialize orchestrator
  const config = getDefaultKinjaConfig();
  const mockRpc = {
    call: async (method: string, params: any) => ({
      sentiment: 'urgent',
      confidence: 0.85,
      urgency: 'p2'
    })
  };
  const mockTelegram = {
    sendMessage: async (chatId: string, message: string, options: any) => ({
      message_id: 'msg_' + Date.now()
    })
  };
  
  const orchestrator = createKinjaOrchestrator(config, mockRpc, mockTelegram);
  
  // Prepare email data
  const parsed: ParsedEmailAddress = {
    domain: 'alchemy',
    scope: 'email',
    type: 'support',
    hierarchy: 'p2'
  };
  
  const email: EmailData = {
    from: 'customer@company.com',
    headers: new Map([
      ['subject', 'URGENT: Production system down'],
      ['message-id', 'msg_12345']
    ]),
    subject: 'URGENT: Production system down',
    body: `
    Our production system has been down for 2 hours and we need immediate assistance.
    This is affecting our entire customer base. Please respond ASAP.
    
    Error details: Database connection timeout
    Impact: All services unavailable
    Urgency: Critical - need response within 1 hour
    `
  };
  
  const basicAnalysis: BasicAnalysis = {
    sentiment: 'urgent',
    sentimentScore: 0.9
  };
  
  // Process with Kinja
  const result = await orchestrator.orchestrateEmail(parsed, email, basicAnalysis);
  
  console.log('✅ Processing completed');
  console.log(`📊 Original priority: p2 -> Kinja calibrated: ${result.kinjaAnalysis?.calibratedPriority}`);
  console.log(`⏰ Time to answer: ${result.kinjaAnalysis?.timeToAnswer} hours`);
  console.log(`🎯 Correctness score: ${(result.kinjaAnalysis?.correctnessScore || 0) * 100}%`);
  console.log(`📈 Processing time: ${result.processingTimeMs}ms`);
  
  return result;
}

// Example 2: TGK Integration with Kinja
export async function tgkIntegrationExample() {
  console.log('=== TGK Integration with Kinja Example ===');
  
  // Setup integration
  const config = getDefaultTGKIntegrationConfig();
  const integration = createKinjaTGKIntegration(config);
  
  // Prepare email context
  const context: TGKEmailContext = {
    messageId: 'tgk_msg_001',
    threadId: 'thread_123',
    originalPriority: 'p2',
    domain: 'alchemy',
    scope: 'email',
    timestamp: new Date()
  };
  
  const email: EmailData = {
    from: 'partner@techcompany.com',
    headers: new Map([
      ['subject', 'API Integration Issue - Need Help Today'],
      ['message-id', 'partner_msg_001']
    ]),
    subject: 'API Integration Issue - Need Help Today',
    body: `
    We're experiencing issues with the API integration. 
    The authentication endpoint is returning 500 errors.
    
    We need this resolved today as we have a product launch tomorrow.
    Can someone please look into this urgently?
    
    Error logs attached. Expected response time: 4 hours.
    `
  };
  
  // Process through TGK integration
  const result = await integration.processEmailWithKinja(email, context);
  
  console.log('✅ TGK Integration completed');
  console.log(`🔄 Priority calibration: ${context.originalPriority} -> ${result.kinjaAnalysis?.calibratedPriority}`);
  console.log(`📊 Temporal urgency: ${result.kinjaAnalysis?.temporalUrgency}`);
  console.log(`⚠️ Risk factors: ${result.kinjaAnalysis?.riskFactors.join(', ')}`);
  console.log(`🎯 Recommended actions: ${result.kinjaAnalysis?.recommendedActions.length}`);
  
  return result;
}

// Example 3: Batch Processing with Kinja
export async function batchProcessingExample() {
  console.log('=== Batch Processing with Kinja Example ===');
  
  const integration = createKinjaTGKIntegration(getDefaultTGKIntegrationConfig());
  
  // Prepare batch of emails
  const emails = [
    {
      email: {
        from: 'user1@example.com',
        headers: new Map([['subject', 'Login issue']]),
        subject: 'Login issue',
        body: 'I cannot log in to my account'
      } as EmailData,
      context: {
        messageId: 'batch_001',
        originalPriority: 'p3',
        domain: 'alchemy',
        scope: 'email',
        timestamp: new Date()
      } as TGKEmailContext
    },
    {
      email: {
        from: 'user2@example.com',
        headers: new Map([['subject', 'URGENT: Payment failed']]),
        subject: 'URGENT: Payment failed',
        body: 'Payment system is down, need immediate help!'
      } as EmailData,
      context: {
        messageId: 'batch_002',
        originalPriority: 'p2',
        domain: 'alchemy',
        scope: 'email',
        timestamp: new Date()
      } as TGKEmailContext
    },
    {
      email: {
        from: 'user3@example.com',
        headers: new Map([['subject', 'Feature request']]),
        subject: 'Feature request',
        body: 'Would like to request a new feature for next release'
      } as EmailData,
      context: {
        messageId: 'batch_003',
        originalPriority: 'p3',
        domain: 'alchemy',
        scope: 'email',
        timestamp: new Date()
      } as TGKEmailContext
    }
  ];
  
  // Process batch
  const results = await integration.batchProcessEmails(emails);
  
  console.log(`✅ Batch processing completed: ${results.length} emails`);
  
  // Analyze results
  const priorityChanges = results.filter(r => 
    r.kinjaAnalysis?.calibratedPriority !== r.context.originalPriority
  );
  
  console.log(`🔄 Priority calibrations: ${priorityChanges.length}`);
  console.log(`⏰ Average processing time: ${results.reduce((sum, r) => sum + r.processingTimeMs, 0) / results.length}ms`);
  
  return results;
}

// Example 4: Callback Handling and Feedback
export async function callbackHandlingExample() {
  console.log('=== Callback Handling and Feedback Example ===');
  
  const integration = createKinjaTGKIntegration(getDefaultTGKIntegrationConfig());
  
  // Simulate callback from Telegram
  const callbackData = JSON.stringify({
    action: 'acknowledge_critical',
    priority: 'p0',
    expectedResponse: 1,
    messageId: 'critical_msg_001'
  });
  
  const context: TGKEmailContext = {
    messageId: 'critical_msg_001',
    originalPriority: 'p1',
    domain: 'alchemy',
    scope: 'email',
    timestamp: new Date()
  };
  
  // Handle callback
  await integration.handleKinjaCallback(callbackData, context);
  
  console.log('✅ Callback handled successfully');
  console.log('📊 Feedback recorded for learning');
  
  // Record additional feedback
  await integration['orchestrator'].recordFeedback({
    messageId: 'critical_msg_001',
    actualResponseTime: 0.5, // 30 minutes
    priorityOverride: 'p0',
    correctnessRating: 0.9,
    feedbackText: 'Perfect priority calibration and quick response'
  });
  
  console.log('📈 Additional feedback recorded');
}

// Example 5: Dashboard Data and Metrics
export async function dashboardExample() {
  console.log('=== Dashboard Data and Metrics Example ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({}) } as any,
    { sendMessage: async () => ({ message_id: '123' }) } as any
  );
  
  // Get dashboard data
  const dashboardData = await orchestrator.getDashboardData();
  
  if (dashboardData) {
    console.log('📊 Dashboard Overview:');
    console.log(`  • Total processed: ${dashboardData.overview.totalProcessed}`);
    console.log(`  • Success rate: ${(dashboardData.overview.successRate * 100).toFixed(1)}%`);
    console.log(`  • Average processing time: ${dashboardData.overview.averageProcessingTime}ms`);
    
    console.log('🧠 Kinja Intelligence:');
    console.log(`  • Priority calibration accuracy: ${(dashboardData.kinjaIntelligence.priorityCalibrationAccuracy * 100).toFixed(1)}%`);
    console.log(`  • Correctness score accuracy: ${(dashboardData.kinjaIntelligence.correctnessScoreAccuracy * 100).toFixed(1)}%`);
    console.log(`  • Response time prediction accuracy: ${(dashboardData.kinjaIntelligence.responseTimePredictionAccuracy * 100).toFixed(1)}%`);
    
    console.log('💼 Business Impact:');
    console.log(`  • Mean time to response: ${dashboardData.businessImpact.meanTimeToResponse} hours`);
    console.log(`  • Customer satisfaction: ${dashboardData.businessImpact.customerSatisfactionScore}/5`);
    console.log(`  • Escalation reduction: ${(dashboardData.businessImpact.escalationReduction * 100).toFixed(1)}%`);
  }
  
  return dashboardData;
}

// Example 6: Learning System Demonstration
export async function learningSystemExample() {
  console.log('=== Learning System Demonstration ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({}) } as any,
    { sendMessage: async () => ({ message_id: '123' }) } as any
  );
  
  // Simulate learning cycle
  console.log('🔄 Starting learning cycle...');
  
  // Record some feedback data
  await orchestrator.recordFeedback({
    messageId: 'learn_001',
    actualResponseTime: 2.5,
    priorityOverride: 'p1',
    correctnessRating: 0.8,
    feedbackText: 'Good analysis but priority was too low'
  });
  
  await orchestrator.recordFeedback({
    messageId: 'learn_002',
    actualResponseTime: 0.5,
    correctnessRating: 0.95,
    feedbackText: 'Excellent analysis and priority'
  });
  
  // Run learning cycle (would normally run on schedule)
  await orchestrator['learningSystem'].runLearningCycle();
  
  console.log('✅ Learning cycle completed');
  console.log('📈 Models adjusted based on feedback');
  
  // Get model performance
  const performance = await orchestrator['learningSystem'].getModelPerformance();
  console.log('📊 Model Performance:');
  console.log(`  • Temporal accuracy: ${(performance.temporalAccuracy * 100).toFixed(1)}%`);
  console.log(`  • Priority accuracy: ${(performance.priorityAccuracy * 100).toFixed(1)}%`);
  console.log(`  • Correctness accuracy: ${(performance.correctnessAccuracy * 100).toFixed(1)}%`);
  
  return performance;
}

// Example 7: Error Handling and Fallback
export async function errorHandlingExample() {
  console.log('=== Error Handling and Fallback Example ===');
  
  // Configure with fallback enabled
  const config = getDefaultTGKIntegrationConfig();
  config.tgk.enableFallback = true;
  
  // Create integration with invalid Kinja config to trigger fallback
  config.kinja.kinjaApiKey = 'invalid-key';
  const integration = createKinjaTGKIntegration(config);
  
  const context: TGKEmailContext = {
    messageId: 'error_test_001',
    originalPriority: 'p2',
    domain: 'alchemy',
    scope: 'email',
    timestamp: new Date()
  };
  
  const email: EmailData = {
    from: 'test@example.com',
    headers: new Map([['subject', 'Test email']]),
    subject: 'Test email',
    body: 'This is a test email'
  };
  
  try {
    // This should trigger fallback due to invalid Kinja config
    const result = await integration.processEmailWithKinja(email, context);
    
    console.log('✅ Fallback processing successful');
    console.log(`📧 Message processed: ${result.messageId}`);
    console.log(`⏱️ Processing time: ${result.processingTimeMs}ms`);
    
  } catch (error) {
    console.error('❌ Even fallback failed:', error);
  }
}

// Run all examples
export async function runAllExamples() {
  console.log('🚀 Running all Kinja Email System examples...\n');
  
  try {
    await basicKinjaExample();
    console.log('\n');
    
    await tgkIntegrationExample();
    console.log('\n');
    
    await batchProcessingExample();
    console.log('\n');
    
    await callbackHandlingExample();
    console.log('\n');
    
    await dashboardExample();
    console.log('\n');
    
    await learningSystemExample();
    console.log('\n');
    
    await errorHandlingExample();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for individual testing
export default {
  basicKinjaExample,
  tgkIntegrationExample,
  batchProcessingExample,
  callbackHandlingExample,
  dashboardExample,
  learningSystemExample,
  errorHandlingExample,
  runAllExamples
};
