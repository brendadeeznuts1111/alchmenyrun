#!/usr/bin/env node

/**
 * tgk ai - Advanced AI Modules with Contextual Awareness
 * Commands: labels, suggest, analyze, predict
 */

import { GitHubManager } from '../utils/github.js';

// Initialize GitHub manager
const gh = new GitHubManager();

// AI Context Interface
interface AIContext {
  issueHistory?: any[];
  rfcLinks?: string[];
  similarIssues?: any[];
  userPatterns?: any;
  systemState?: any;
}

// Predictive Risk Assessment
interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  recommendations: string[];
  confidence: number;
}

// Strategy Suggestion
interface StrategySuggestion {
  strategy: string;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  risk_assessment: RiskAssessment;
}

// Thread Analysis
interface ThreadAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  action_items: string[];
  key_decisions: string[];
  participants: string[];
  confidence: number;
}

// Email Analysis
interface EmailAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  keywords: string[];
  action_items: string[];
  potential_pii: boolean;
  phishing_risk: number;
  reasoning: string;
}

// Routing Suggestion
interface RoutingSuggestion {
  chat_id: string | null;
  routing_confidence: number;
  suggested_priority_override?: string;
  fallback_reason?: string;
  reasoning: string;
}

// Email Draft
interface EmailDraft {
  subject: string;
  body: string;
  confidence: number;
}

export async function suggestLabels(issueId: string, repo?: string): Promise<{labels: string[], confidence: number, reasoning: string, context: AIContext}> {
  console.log(`🤖 Analyzing issue #${issueId} for intelligent labeling...`);

  try {
    const repoName = repo || 'alchmenyrun';

    // Gather comprehensive context
    const context = await gatherIssueContext(issueId, repoName);
    const issue = context.issueHistory?.[0];

    if (!issue) {
      throw new Error(`Issue #${issueId} not found`);
    }

    // Enhanced AI analysis with context
    const analysis = await analyzeIssueWithContext(issue, context);

    console.log(`🎯 AI Analysis Complete:`);
    console.log(`   📊 Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`   🏷️  Suggested Labels: ${analysis.labels.join(', ')}`);
    console.log(`   💭 Reasoning: ${analysis.reasoning}`);
    console.log(`   📚 Context Used: ${Object.keys(context).filter(k => context[k as keyof AIContext]).length} sources`);

    return analysis;

  } catch (error) {
    console.error('❌ Failed to analyze issue:', error.message);
    throw error;
  }
}

export async function analyzeThread(threadId: string, messages: string[]): Promise<ThreadAnalysis> {
  console.log(`🧵 Analyzing Telegram thread ${threadId}...`);

  try {
    // Combine all messages for analysis
    const fullThread = messages.join(' ');

    // AI-powered thread analysis
    const analysis = await performThreadAnalysis(fullThread);

    console.log(`📋 Thread Analysis Complete:`);
    console.log(`   😊 Sentiment: ${analysis.sentiment}`);
    console.log(`   ⚡ Urgency: ${analysis.urgency}`);
    console.log(`   📝 Summary: ${analysis.summary}`);
    console.log(`   ✅ Action Items: ${analysis.action_items.length}`);
    console.log(`   👥 Participants: ${analysis.participants.length}`);

    return analysis;

  } catch (error) {
    console.error('❌ Failed to analyze thread:', error.message);
    throw error;
  }
}

export async function predictRisk(component: string, change: string): Promise<RiskAssessment> {
  console.log(`🔮 Predicting risk for ${component} change...`);

  try {
    // AI-powered risk assessment
    const assessment = await assessChangeRisk(component, change);

    console.log(`⚠️ Risk Assessment:`);
    console.log(`   📊 Level: ${assessment.level.toUpperCase()}`);
    console.log(`   🎯 Score: ${(assessment.score * 100).toFixed(1)}%`);
    console.log(`   🔍 Factors: ${assessment.factors.length}`);
    console.log(`   💡 Recommendations: ${assessment.recommendations.length}`);

    return assessment;

  } catch (error) {
    console.error('❌ Failed to assess risk:', error.message);
    throw error;
  }
}

export async function suggestStrategy(context: string, constraints: string[]): Promise<StrategySuggestion> {
  console.log(`🎯 Generating strategic suggestions...`);

  try {
    // AI-powered strategy suggestion
    const suggestion = await generateStrategySuggestion(context, constraints);

    console.log(`📈 Strategy Suggestion:`);
    console.log(`   🎯 Strategy: ${suggestion.strategy}`);
    console.log(`   📊 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
    console.log(`   💭 Reasoning: ${suggestion.reasoning}`);
    console.log(`   🔄 Alternatives: ${suggestion.alternatives.length}`);

    return suggestion;

  } catch (error) {
    console.error('❌ Failed to generate strategy:', error.message);
    throw error;
  }
}

export async function analyzeEmailContent(subject: string, body: string, stateId?: string): Promise<EmailAnalysis> {
  console.log(`📧 Analyzing email content...`);

  try {
    // AI-powered email content analysis
    const analysis = await performEmailAnalysis(subject, body, stateId);

    console.log(`📧 Email Analysis:`);
    console.log(`   😊 Sentiment: ${analysis.sentiment} (${analysis.score.toFixed(2)})`);
    console.log(`   ⚡ Urgency: ${analysis.urgency}`);
    console.log(`   📝 Summary: ${analysis.summary}`);
    console.log(`   🔑 Keywords: ${analysis.keywords.join(', ')}`);
    console.log(`   📋 Action Items: ${analysis.action_items.length}`);

    return analysis;

  } catch (error) {
    console.error('❌ Failed to analyze email:', error.message);
    throw error;
  }
}

export async function suggestEmailRouting(domain: string, scope: string, type: string, hierarchy: string, meta: string, stateId?: string, emailAnalysis?: EmailAnalysis, emailFrom?: string): Promise<RoutingSuggestion> {
  console.log(`🎯 Determining optimal email routing...`);

  try {
    // AI-powered routing decision
    const routing = await determineEmailRouting(domain, scope, type, hierarchy, meta, stateId, emailAnalysis, emailFrom);

    console.log(`📨 Routing Decision:`);
    console.log(`   🎯 Chat ID: ${routing.chat_id || 'No route found'}`);
    console.log(`   📊 Confidence: ${(routing.routing_confidence * 100).toFixed(1)}%`);
    console.log(`   💭 Reasoning: ${routing.reasoning}`);

    return routing;

  } catch (error) {
    console.error('❌ Failed to determine routing:', error.message);
    throw error;
  }
}

export async function draftEmailReply(subject: string, body: string, fromEmail: string, intent: string = 'acknowledge', tone: string = 'professional'): Promise<EmailDraft> {
  console.log(`✍️ Drafting email reply...`);

  try {
    // AI-powered email drafting
    const draft = await generateEmailReply(subject, body, fromEmail, intent, tone);

    console.log(`📝 Email Draft Generated:`);
    console.log(`   📧 Subject: ${draft.subject}`);
    console.log(`   📊 Confidence: ${(draft.confidence * 100).toFixed(1)}%`);

    return draft;

  } catch (error) {
    console.error('❌ Failed to draft email:', error.message);
    throw error;
  }
}

// Core AI Analysis Functions

async function gatherIssueContext(issueId: string, repo: string): Promise<AIContext> {
  const context: AIContext = {};

  try {
    // Get issue details
    const issue = await gh.getIssue(parseInt(issueId));
    context.issueHistory = [issue];

    // Find linked RFCs (would search for RFC references in issue body)
    context.rfcLinks = extractRFCReferences(issue.body || '');

    // Find similar issues (would use semantic search)
    context.similarIssues = await findSimilarIssues(issue);

    // Get user interaction patterns
    context.userPatterns = await analyzeUserPatterns(issue.user?.login);

    // Get system state (current deployments, incidents, etc.)
    context.systemState = await getCurrentSystemState();

  } catch (error) {
    console.warn('⚠️ Could not gather full context:', error.message);
  }

  return context;
}

async function analyzeIssueWithContext(issue: any, context: AIContext) {
  const content = `${issue.title} ${issue.body || ''}`.toLowerCase();

  // Start with base analysis
  let labels = ['group/internal', 'topic/governance', 'impact/low'];
  let confidence = 0.7;
  let reasoning = 'Base analysis suggests internal governance issue. ';

  // Enhance with RFC context
  if (context.rfcLinks && context.rfcLinks.length > 0) {
    labels.push('status/rfc-ready');
    confidence += 0.1;
    reasoning += `Linked to RFC(s): ${context.rfcLinks.join(', ')}. `;
  }

  // Enhance with similar issues
  if (context.similarIssues && context.similarIssues.length > 0) {
    const similarLabels = context.similarIssues.flatMap((issue: any) => issue.labels || []);
    const commonLabels = findCommonLabels(similarLabels);
    if (commonLabels.length > 0) {
      labels.push(...commonLabels);
      confidence += 0.05;
      reasoning += `Similar to ${context.similarIssues.length} previous issues. `;
    }
  }

  // Enhance with user patterns
  if (context.userPatterns) {
    if (context.userPatterns.isEnterprise) {
      labels = labels.map(l => l.replace('group/internal', 'group/customer'));
      confidence += 0.1;
      reasoning += 'Enterprise user - customer context applied. ';
    }
  }

  return {
    labels: [...new Set(labels)], // Remove duplicates
    confidence: Math.min(confidence, 0.95),
    reasoning,
    context
  };
}

async function performThreadAnalysis(threadContent: string): Promise<ThreadAnalysis> {
  // Mock AI analysis - would use actual NLP in production
  const sentiment = analyzeSentiment(threadContent);
  const urgency = analyzeUrgency(threadContent);
  const actionItems = extractActionItems(threadContent);
  const keyDecisions = extractDecisions(threadContent);

  return {
    sentiment,
    urgency,
    summary: generateSummary(threadContent),
    action_items: actionItems,
    key_decisions: keyDecisions,
    participants: extractParticipants(threadContent),
    confidence: 0.8
  };
}

async function assessChangeRisk(component: string, change: string): Promise<RiskAssessment> {
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let score = 0.2;
  const factors = [];
  const recommendations = [];

  // Component risk assessment
  if (component.includes('auth') || component.includes('security')) {
    score += 0.4;
    factors.push('Security-sensitive component');
    recommendations.push('Require security review');
  }

  if (component.includes('database') || component.includes('storage')) {
    score += 0.3;
    factors.push('Data persistence component');
    recommendations.push('Backup before deployment');
  }

  // Change type assessment
  if (change.includes('breaking') || change.includes('major')) {
    score += 0.4;
    factors.push('Breaking change detected');
    recommendations.push('Update documentation and migration guides');
  }

  if (change.includes('performance') || change.includes('optimization')) {
    score += 0.2;
    factors.push('Performance impact expected');
    recommendations.push('Monitor performance metrics post-deployment');
  }

  // Determine risk level
  if (score >= 0.8) level = 'critical';
  else if (score >= 0.6) level = 'high';
  else if (score >= 0.4) level = 'medium';

  return {
    level,
    score,
    factors,
    recommendations,
    confidence: 0.85
  };
}

async function generateStrategySuggestion(context: string, constraints: string[]): Promise<StrategySuggestion> {
  // AI-powered strategy generation based on context and constraints
  const strategies = ['incremental-rollout', 'blue-green', 'canary', 'immediate'];

  let recommended = 'incremental-rollout';
  let confidence = 0.8;
  let reasoning = 'Incremental rollout minimizes risk while allowing monitoring.';

  // Adjust based on context
  if (context.includes('critical') || context.includes('security')) {
    recommended = 'blue-green';
    confidence = 0.9;
    reasoning = 'Blue-green deployment provides instant rollback for critical changes.';
  }

  if (constraints.includes('zero-downtime')) {
    recommended = 'canary';
    confidence = 0.85;
    reasoning = 'Canary deployment ensures zero downtime through gradual rollout.';
  }

  return {
    strategy: recommended,
    confidence,
    reasoning,
    alternatives: strategies.filter(s => s !== recommended),
    risk_assessment: await assessChangeRisk('deployment', recommended)
  };
}

async function performEmailAnalysis(subject: string, body: string, stateId?: string): Promise<EmailAnalysis> {
  const content = `${subject} ${body}`.toLowerCase();

  // Sentiment analysis
  const sentiment = analyzeSentiment(content);
  const score = calculateSentimentScore(content);

  // Urgency detection
  const urgency = analyzeUrgency(content);

  // Extract key information
  const keywords = extractKeywords(content);
  const actionItems = extractActionItems(content);

  // Security checks
  const potentialPII = detectPII(content);
  const phishingRisk = assessPhishingRisk(content);

  return {
    sentiment,
    score,
    urgency,
    summary: generateSummary(content),
    keywords,
    action_items: actionItems,
    potential_pii: potentialPII,
    phishing_risk: phishingRisk,
    reasoning: 'Analysis based on content patterns and security indicators.'
  };
}

async function determineEmailRouting(domain: string, scope: string, type: string, hierarchy: string, meta: string, stateId?: string, emailAnalysis?: EmailAnalysis, emailFrom?: string): Promise<RoutingSuggestion> {
  // AI-powered routing logic based on email structure and analysis

  let chatId = null;
  let confidence = 0.5;
  let reasoning = 'Default routing applied.';

  // Domain-based routing
  if (domain === 'customer') {
    chatId = process.env.TELEGRAM_CUSTOMER_CHAT_ID || 'customer-support';
    confidence = 0.9;
    reasoning = 'Customer domain routed to support channel.';
  } else if (domain === 'security') {
    chatId = process.env.TELEGRAM_SECURITY_CHAT_ID || 'security-team';
    confidence = 0.95;
    reasoning = 'Security domain routed to security team.';
  }

  // Scope-based adjustments
  if (scope === 'incident') {
    confidence += 0.1;
    reasoning += ' Incident scope increases routing confidence.';
  }

  // Analysis-based adjustments
  if (emailAnalysis) {
    if (emailAnalysis.urgency === 'critical') {
      confidence += 0.1;
      reasoning += ' Critical urgency detected.';
    }
    if (emailAnalysis.phishing_risk > 0.7) {
      chatId = 'security-incident';
      confidence = 0.95;
      reasoning = 'High phishing risk - routed to security.';
    }
  }

  return {
    chat_id: chatId,
    routing_confidence: Math.min(confidence, 0.99),
    reasoning
  };
}

async function generateEmailReply(subject: string, body: string, fromEmail: string, intent: string, tone: string): Promise<EmailDraft> {
  // AI-powered email reply generation
  let replySubject = `Re: ${subject.replace(/^Re:\s*/i, '')}`;
  let replyBody = '';

  switch (intent) {
    case 'acknowledge':
      replyBody = `Dear ${extractName(fromEmail)},

Thank you for your email. We have received your message and are reviewing it.

We will get back to you within 24 hours with a more detailed response.

Best regards,
Alchemist Support Team`;
      break;

    case 'investigating':
      replyBody = `Dear ${extractName(fromEmail)},

Thank you for bringing this to our attention. Our team is currently investigating the issue you described.

We will provide an update as soon as we have more information.

Best regards,
Alchemist Support Team`;
      break;

    case 'resolved':
      replyBody = `Dear ${extractName(fromEmail)},

I'm pleased to inform you that the issue has been resolved.

The fix has been deployed and should now be working as expected. Please let us know if you encounter any further issues.

Best regards,
Alchemist Support Team`;
      break;

    case 'escalate':
      replyBody = `Dear ${extractName(fromEmail)},

Thank you for your patience. We have escalated this issue to our senior engineering team for immediate attention.

We will provide you with a detailed update within the next 4 hours.

Best regards,
Alchemist Support Team`;
      break;
  }

  // Adjust tone
  if (tone === 'casual') {
    replyBody = replyBody.replace(/Dear/g, 'Hi').replace(/Best regards/g, 'Thanks');
  } else if (tone === 'urgent') {
    replySubject = `URGENT: ${replySubject}`;
    replyBody = replyBody.replace(/24 hours/g, '2 hours').replace(/4 hours/g, '1 hour');
  }

  return {
    subject: replySubject,
    body: replyBody,
    confidence: 0.85
  };
}

// Helper Functions

function extractRFCReferences(content: string): string[] {
  const rfcRegex = /RFC[-\s]?(\d+|[A-Z]+-\d+)/gi;
  const matches = content.match(rfcRegex) || [];
  return matches.map(match => match.replace(/[-\s]/g, '-').toUpperCase());
}

async function findSimilarIssues(issue: any): Promise<any[]> {
  // Mock similar issue search - would use semantic similarity in production
  return [];
}

async function analyzeUserPatterns(username?: string): Promise<any> {
  // Mock user pattern analysis
  return { isEnterprise: false, issueFrequency: 'medium' };
}

async function getCurrentSystemState(): Promise<any> {
  // Mock system state
  return { incidents: 0, deployments: 1, load: 'normal' };
}

function findCommonLabels(labels: string[]): string[] {
  // Find most common labels from similar issues
  const labelCount: Record<string, number> = {};
  labels.forEach(label => {
    labelCount[label] = (labelCount[label] || 0) + 1;
  });

  return Object.entries(labelCount)
    .filter(([, count]) => count >= 2)
    .map(([label]) => label);
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['good', 'great', 'excellent', 'thanks', 'appreciate', 'happy'];
  const negativeWords = ['bad', 'broken', 'issue', 'problem', 'error', 'fail'];

  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function analyzeUrgency(text: string): 'low' | 'medium' | 'high' | 'critical' {
  if (text.includes('urgent') || text.includes('critical') || text.includes('emergency')) {
    return 'critical';
  }
  if (text.includes('asap') || text.includes('soon') || text.includes('important')) {
    return 'high';
  }
  if (text.includes('when possible') || text.includes('eventually')) {
    return 'low';
  }
  return 'medium';
}

function extractActionItems(text: string): string[] {
  const actionPatterns = [
    /todo:?\s*(.+?)(?:\n|$)/gi,
    /action:?\s*(.+?)(?:\n|$)/gi,
    /next:?\s*(.+?)(?:\n|$)/gi,
    /follow.?up:?\s*(.+?)(?:\n|$)/gi
  ];

  const actions = [];
  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      actions.push(match[1].trim());
    }
  }

  return actions;
}

function extractDecisions(text: string): string[] {
  const decisionPatterns = [
    /decided:?\s*(.+?)(?:\n|$)/gi,
    /agreed:?\s*(.+?)(?:\n|$)/gi,
    /conclusion:?\s*(.+?)(?:\n|$)/gi
  ];

  const decisions = [];
  for (const pattern of decisionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      decisions.push(match[1].trim());
    }
  }

  return decisions;
}

function extractParticipants(text: string): string[] {
  // Mock participant extraction
  return ['@alice.smith', '@bob.wilson', '@carol.davis'];
}

function generateSummary(text: string): string {
  // Simple extractive summarization
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 2).join('. ').trim() + '.';
}

function calculateSentimentScore(text: string): number {
  // Simple sentiment scoring
  const positiveWords = ['good', 'great', 'excellent', 'thanks', 'appreciate'];
  const negativeWords = ['bad', 'broken', 'issue', 'problem', 'error'];

  let score = 0.5;
  positiveWords.forEach(word => {
    if (text.includes(word)) score += 0.1;
  });
  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 0.1;
  });

  return Math.max(0, Math.min(1, score));
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const filtered = words.filter(word => word.length > 3 && !commonWords.includes(word));

  // Get most frequent words
  const wordCount: Record<string, number> = {};
  filtered.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function detectPII(text: string): boolean {
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
  ];

  return piiPatterns.some(pattern => pattern.test(text));
}

function assessPhishingRisk(text: string): number {
  let risk = 0;

  // Check for suspicious patterns
  if (text.includes('urgent') && text.includes('password')) risk += 0.3;
  if (text.includes('click here') && text.includes('http')) risk += 0.2;
  if (text.includes('account suspended')) risk += 0.4;
  if (text.includes('verify your identity')) risk += 0.3;

  return Math.min(1, risk);
}

function extractName(email: string): string {
  // Extract name from email or return generic
  const nameMatch = email.match(/^([^@]+)@/);
  if (nameMatch) {
    return nameMatch[1].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Valued Customer';
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'labels':
        const issueId = args[2];
        const repoParam = args.find(arg => arg.startsWith('--repo='))?.split('=')[1];
        if (!issueId) {
          console.error('Usage: tgk ai labels <issue-id> [--repo=<repo>]');
          process.exit(1);
        }
        const [owner, repoName] = repoParam?.includes('/') ? repoParam.split('/') : ['brendadeeznuts1111', repoParam || 'alchmenyrun'];
        await suggestLabels(issueId, owner, repoName);
        break;

      case 'analyze-thread':
        const threadId = args[2];
        // Would need to get thread messages
        console.log('Thread analysis requires message data - use programmatic API');
        break;

      case 'predict-risk':
        const component = args[2];
        const change = args.slice(3).join(' ');
        if (!component || !change) {
          console.error('Usage: tgk ai predict-risk <component> <change-description>');
          process.exit(1);
        }
        await predictRisk(component, change);
        break;

      case 'suggest-strategy':
        const context = args.slice(2).join(' ');
        if (!context) {
          console.error('Usage: tgk ai suggest-strategy <context-description>');
          process.exit(1);
        }
        await suggestStrategy(context, []);
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk ai labels <issue-id> [--repo=<repo>]           - AI-powered label suggestions');
        console.log('  tgk ai predict-risk <component> <change>           - Risk assessment');
        console.log('  tgk ai suggest-strategy <context>                   - Strategy suggestions');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Temporarily disabled to debug import issues
  // main();
}