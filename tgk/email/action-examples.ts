/**
 * Enhanced Recommended Actions Examples
 * Demonstrates the improved action generation and display system
 */

import { 
  KinjaEmailOrchestrator, 
  EmailOrchestrationConfig,
  createKinjaOrchestrator,
  getDefaultKinjaConfig 
} from './index';
import { ParsedEmailAddress, EmailData, BasicAnalysis } from './kinja-formatter';

// Example 1: Critical Production Issue
export async function criticalProductionIssueExample() {
  console.log('=== Critical Production Issue Example ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({ sentiment: 'urgent', confidence: 0.95, urgency: 'p0' }) } as any,
    { sendMessage: async () => ({ message_id: 'critical_msg' }) } as any
  );
  
  const parsed: ParsedEmailAddress = {
    domain: 'alchemy',
    scope: 'production',
    type: 'incident',
    hierarchy: 'p0'
  };
  
  const email: EmailData = {
    from: 'monitoring@company.com',
    headers: new Map([
      ['subject', '🚨 CRITICAL: Production database cluster down'],
      ['message-id', 'critical_incident_001']
    ]),
    subject: '🚨 CRITICAL: Production database cluster down',
    body: `
    EMERGENCY: All production database clusters are offline.
    
    Impact: 100% service outage affecting all customers
    Started: 2 minutes ago
    Error: Connection timeout to primary database
    Attempts: 3 failover attempts failed
    
    IMMEDIATE ACTION REQUIRED - Revenue impact: $10K/hour
    Customer complaints: 47 and rising
    SLA breach: In progress
    
    Need database team and infrastructure team immediately.
    This is a P0 incident requiring emergency response.
    `
  };
  
  const result = await orchestrator.orchestrateEmail(
    parsed,
    email,
    { sentiment: 'urgent', sentimentScore: 0.95 }
  );
  
  console.log('🚨 Critical Issue Actions Generated:');
  console.log('Priority:', result.kinjaAnalysis?.calibratedPriority);
  console.log('Total Actions:', result.kinjaAnalysis?.recommendedActions.length);
  console.log('Total Effort:', result.kinjaAnalysis?.estimatedEffort);
  
  console.log('\n📋 Top 5 Actions:');
  result.kinjaAnalysis?.recommendedActions.slice(0, 5).forEach((action, index) => {
    const priorityIcon = action.priority >= 9 ? '🚨' : 
                         action.priority >= 7 ? '🔴' : 
                         action.priority >= 5 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${priorityIcon} ${action.action} (${action.estimatedTime}m, ${action.priority}/10)`);
    if (action.assignedTo) console.log(`   👤 Assigned to: ${action.assignedTo}`);
    if (action.dependencies.length > 0) console.log(`   ⛓️ Dependencies: ${action.dependencies.join(', ')}`);
  });
  
  return result;
}

// Example 2: High Priority Customer Issue
export async function highPriorityCustomerExample() {
  console.log('\n=== High Priority Customer Issue Example ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({ sentiment: 'negative', confidence: 0.85, urgency: 'p1' }) } as any,
    { sendMessage: async () => ({ message_id: 'high_priority_msg' }) } as any
  );
  
  const parsed: ParsedEmailAddress = {
    domain: 'alchemy',
    scope: 'customer',
    type: 'support',
    hierarchy: 'p1'
  };
  
  const email: EmailData = {
    from: 'enterprise-client@fortune500.com',
    headers: new Map([
      ['subject', 'URGENT: API outage affecting our production systems'],
      ['message-id', 'enterprise_urgent_001']
    ]),
    subject: 'URGENT: API outage affecting our production systems',
    body: `
    We are experiencing a complete API outage that is affecting our production systems.
    
    Issue: API endpoints returning 500 errors
    Started: 30 minutes ago
    Impact: Our entire e-commerce platform is down
    Revenue impact: $50K/hour
    
    We need this resolved TODAY as we have a major product launch.
    Our SLA requires 4-hour response time for enterprise clients.
    
    Please escalate to your senior team immediately.
    We need an ETA and resolution plan within the hour.
    `
  };
  
  const result = await orchestrator.orchestrateEmail(
    parsed,
    email,
    { sentiment: 'negative', sentimentScore: 0.85 }
  );
  
  console.log('🔴 High Priority Customer Actions:');
  console.log('Priority:', result.kinjaAnalysis?.calibratedPriority);
  console.log('Sentiment:', result.kinjaAnalysis?.sentiment);
  console.log('Time to Answer:', result.kinjaAnalysis?.timeToAnswer, 'hours');
  
  console.log('\n📋 Recommended Actions:');
  result.kinjaAnalysis?.recommendedActions.slice(0, 5).forEach((action, index) => {
    const priorityIcon = action.priority >= 9 ? '🚨' : 
                         action.priority >= 7 ? '🔴' : 
                         action.priority >= 5 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${priorityIcon} ${action.action} (${action.estimatedTime}m)`);
  });
  
  return result;
}

// Example 3: Medium Priority Technical Issue
export async function mediumPriorityTechnicalExample() {
  console.log('\n=== Medium Priority Technical Issue Example ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({ sentiment: 'neutral', confidence: 0.75, urgency: 'p2' }) } as any,
    { sendMessage: async () => ({ message_id: 'medium_priority_msg' }) } as any
  );
  
  const parsed: ParsedEmailAddress = {
    domain: 'alchemy',
    scope: 'technical',
    type: 'support',
    hierarchy: 'p2'
  };
  
  const email: EmailData = {
    from: 'developer@techstartup.com',
    headers: new Map([
      ['subject', 'Integration issue with payment API'],
      ['message-id', 'tech_integration_001']
    ]),
    subject: 'Integration issue with payment API',
    body: `
    We're having trouble integrating the payment API into our application.
    
    Issue: Authentication endpoint returning 401 errors
    Environment: Staging
    API version: v2.1
    Error message: "Invalid credentials format"
    
    We've followed the documentation exactly but can't get past authentication.
    This is blocking our testing and we'd like to go live next week.
    
    Can someone help us troubleshoot this? We need a response within 24 hours.
    `
  };
  
  const result = await orchestrator.orchestrateEmail(
    parsed,
    email,
    { sentiment: 'neutral', sentimentScore: 0.75 }
  );
  
  console.log('🟡 Medium Priority Technical Actions:');
  console.log('Priority:', result.kinjaAnalysis?.calibratedPriority);
  console.log('Correctness Score:', (result.kinjaAnalysis?.correctnessScore || 0) * 100, '%');
  console.log('Required Skills:', result.kinjaAnalysis?.requiredSkills.join(', '));
  
  console.log('\n📋 Action Plan:');
  result.kinjaAnalysis?.recommendedActions.forEach((action, index) => {
    const priorityIcon = action.priority >= 9 ? '🚨' : 
                         action.priority >= 7 ? '🔴' : 
                         action.priority >= 5 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${priorityIcon} ${action.action} (${action.estimatedTime}m)`);
  });
  
  return result;
}

// Example 4: Low Priority General Inquiry
export async function lowPriorityInquiryExample() {
  console.log('\n=== Low Priority General Inquiry Example ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({ sentiment: 'positive', confidence: 0.8, urgency: 'p3' }) } as any,
    { sendMessage: async () => ({ message_id: 'low_priority_msg' }) } as any
  );
  
  const parsed: ParsedEmailAddress = {
    domain: 'alchemy',
    scope: 'general',
    type: 'inquiry',
    hierarchy: 'p3'
  };
  
  const email: EmailData = {
    from: 'user@smallcompany.com',
    headers: new Map([
      ['subject', 'Question about pricing plans'],
      ['message-id', 'pricing_inquiry_001']
    ]),
    subject: 'Question about pricing plans',
    body: `
    Hi,
    
    I'm interested in your service but have a few questions about pricing:
    
    1. Do you offer annual discounts?
    2. Is there a free trial for enterprise plans?
    3. What's included in the premium support tier?
    
    We're a small team (10 people) looking to potentially upgrade next quarter.
    
    No rush on this response - just gathering information for planning.
    
    Thanks!
    `
  };
  
  const result = await orchestrator.orchestrateEmail(
    parsed,
    email,
    { sentiment: 'positive', sentimentScore: 0.8 }
  );
  
  console.log('🟢 Low Priority Inquiry Actions:');
  console.log('Priority:', result.kinjaAnalysis?.calibratedPriority);
  console.log('Estimated Effort:', result.kinjaAnalysis?.estimatedEffort);
  console.log('Processing Time:', result.processingTimeMs, 'ms');
  
  console.log('\n📋 Simple Action Plan:');
  result.kinjaAnalysis?.recommendedActions.forEach((action, index) => {
    console.log(`${index + 1}. ${action.action} (${action.estimatedTime}m)`);
  });
  
  return result;
}

// Example 5: Complex Multi-Factor Issue
export async function complexMultiFactorExample() {
  console.log('\n=== Complex Multi-Factor Issue Example ===');
  
  const orchestrator = createKinjaOrchestrator(
    getDefaultKinjaConfig(),
    { call: async () => ({ sentiment: 'urgent', confidence: 0.9, urgency: 'p1' }) } as any,
    { sendMessage: async () => ({ message_id: 'complex_issue_msg' }) } as any
  );
  
  const parsed: ParsedEmailAddress = {
    domain: 'alchemy',
    scope: 'security',
    type: 'incident',
    hierarchy: 'p1'
  };
  
  const email: EmailData = {
    from: 'security@bank.com',
    headers: new Map([
      ['subject', 'SECURITY: Potential data breach - URGENT'],
      ['message-id', 'security_incident_001']
    ]),
    subject: 'SECURITY: Potential data breach - URGENT',
    body: `
    CRITICAL SECURITY ISSUE DETECTED
    
    We've detected unusual activity on our systems that may indicate a data breach:
    
    Timeline:
    - 2 hours ago: Unusual login patterns detected
    - 1 hour ago: Data exfiltration attempts identified
    - 30 minutes ago: Systems isolated to prevent further damage
    
    Potential Impact:
    - Customer data may have been compromised
    - 50,000+ records potentially accessed
    - Regulatory reporting requirements triggered
    
    IMMEDIATE ACTION REQUIRED:
    1. Security team investigation needed
    2. Legal team notification required
    3. Customer communication plan needed
    4. Regulatory reporting within 72 hours
    
    This requires immediate senior leadership attention.
    We need a response within 1 hour with action plan.
    
    CRITICAL: Do not email back - call security hotline immediately.
    `
  };
  
  const result = await orchestrator.orchestrateEmail(
    parsed,
    email,
    { sentiment: 'urgent', sentimentScore: 0.9 }
  );
  
  console.log('🚨 Complex Security Issue Actions:');
  console.log('Calibrated Priority:', result.kinjaAnalysis?.calibratedPriority);
  console.log('Risk Factors:', result.kinjaAnalysis?.riskFactors.join(', '));
  console.log('Total Actions:', result.kinjaAnalysis?.recommendedActions.length);
  console.log('Required Skills:', result.kinjaAnalysis?.requiredSkills.join(', '));
  
  console.log('\n📋 Comprehensive Action Plan:');
  result.kinjaAnalysis?.recommendedActions.forEach((action, index) => {
    const priorityIcon = action.priority >= 9 ? '🚨' : 
                         action.priority >= 7 ? '🔴' : 
                         action.priority >= 5 ? '🟡' : '🟢';
    const assignee = action.assignedTo ? ` [${action.assignedTo}]` : '';
    console.log(`${index + 1}. ${priorityIcon} ${action.action}${assignee} (${action.estimatedTime}m)`);
  });
  
  return result;
}

// Run all examples
export async function runAllActionExamples() {
  console.log('🎯 Running Enhanced Recommended Actions Examples...\n');
  
  try {
    await criticalProductionIssueExample();
    await highPriorityCustomerExample();
    await mediumPriorityTechnicalExample();
    await lowPriorityInquiryExample();
    await complexMultiFactorExample();
    
    console.log('\n✅ All action examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Action examples failed:', error);
  }
}

// Export for individual testing
export default {
  criticalProductionIssueExample,
  highPriorityCustomerExample,
  mediumPriorityTechnicalExample,
  lowPriorityInquiryExample,
  complexMultiFactorExample,
  runAllActionExamples
};
