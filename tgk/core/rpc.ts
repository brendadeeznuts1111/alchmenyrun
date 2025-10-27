/**
 * tgk RPC Clients - Internal API communication layer
 * Provides typed clients for ai.analyzeEmailContent and route.resolveTelegramChatID
 */

import { ui } from '../utils/ui.js';

interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  keywords: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  action_items: string[];
  potential_pii: boolean;
  phishing_risk: number;
  reasoning: string;
}

interface RoutingSuggestion {
  chat_id: string | null;
  routing_confidence: number;
  fallback_reason?: string;
  suggested_priority_override?: string;
  reasoning: string;
}

interface RPCConfig {
  apiUrl: string;
  apiToken: string;
  timeout?: number;
  retries?: number;
}

class RPCError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'RPCError';
  }
}

class RPCClient {
  private config: RPCConfig;
  private baseUrl: string;

  constructor(config: RPCConfig) {
    this.config = {
      timeout: 30000, // 30 seconds
      retries: 3,
      ...config
    };
    this.baseUrl = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async call(method: string, params: any = {}): Promise<any> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const url = `${this.baseUrl}/api/${method}`;

        ui.debug(`RPC Call: ${method} (attempt ${attempt + 1}/${this.config.retries})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiToken}`,
            'User-Agent': 'tgk-email-orchestrator/1.0'
          },
          body: JSON.stringify(params),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new RPCError(
            `RPC call failed: ${response.statusText}`,
            'HTTP_ERROR',
            response.status,
            { url, method, response: errorText }
          );
        }

        const result = await response.json();

        // Check for application-level errors
        if (result.error) {
          throw new RPCError(
            result.error.message || 'RPC application error',
            result.error.code || 'APP_ERROR',
            undefined,
            result.error
          );
        }

        ui.debug(`RPC Success: ${method}`);
        return result.result || result;

      } catch (error) {
        lastError = error as Error;

        if (error instanceof RPCError && error.statusCode) {
          // Don't retry on client errors (4xx)
          if (error.statusCode >= 400 && error.statusCode < 500) {
            throw error;
          }
        }

        ui.warning(`RPC attempt ${attempt + 1} failed: ${error.message}`);

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new RPCError(
      `RPC call failed after ${this.config.retries} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED',
      undefined,
      { originalError: lastError }
    );
  }

  // Health check
  async health(): Promise<{ status: 'healthy' | 'unhealthy'; version?: string; uptime?: number }> {
    try {
      const result = await this.call('health', {});
      return result;
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

// AI Analysis RPC Client
export class AIAnalysisClient extends RPCClient {
  /**
   * Analyze email content for sentiment, urgency, and key insights
   */
  async analyzeEmailContent(params: {
    subject: string;
    body: string;
    stateId?: string;
    sender?: string;
  }): Promise<AIAnalysis> {
    ui.debug('Calling AI email content analysis');

    // For now, return mock analysis - in production this would call real AI
    const mockAnalysis: AIAnalysis = {
      sentiment: this.analyzeSentimentMock(params.subject + ' ' + params.body),
      score: Math.random() * 2 - 1, // -1 to 1
      summary: this.generateSummaryMock(params.subject, params.body),
      keywords: this.extractKeywordsMock(params.subject + ' ' + params.body),
      urgency: this.analyzeUrgencyMock(params.subject + ' ' + params.body),
      action_items: this.extractActionItemsMock(params.body),
      potential_pii: this.detectPIIMock(params.body),
      phishing_risk: Math.random() * 0.3, // Low risk for demo
      reasoning: 'Mock AI analysis - replace with real AI service'
    };

    return mockAnalysis;
  }

  private analyzeSentimentMock(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'appreciate', 'happy', 'perfect', 'amazing'];
    const negativeWords = ['bad', 'broken', 'issue', 'problem', 'error', 'fail', 'crash', 'disappointed', 'unacceptable'];

    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateSummaryMock(subject: string, body: string): string {
    const content = `${subject} ${body}`.substring(0, 200);
    return `Email about: ${content}...`;
  }

  private extractKeywordsMock(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const filtered = words.filter(word => word.length > 3 && !stopWords.includes(word));
    return [...new Set(filtered)].slice(0, 5);
  }

  private analyzeUrgencyMock(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentWords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'priority', 'crash', 'down'];
    const highWords = ['important', 'soon', 'blocking', 'production', 'customer'];

    const urgentCount = urgentWords.filter(word => text.toLowerCase().includes(word)).length;
    const highCount = highWords.filter(word => text.toLowerCase().includes(word)).length;

    if (urgentCount > 0) return 'critical';
    if (highCount > 0) return 'high';
    if (text.includes('?') || text.includes('please')) return 'low';
    return 'medium';
  }

  private extractActionItemsMock(text: string): string[] {
    // Simple extraction based on common patterns
    const patterns = [
      /please (.+?)(?:\n|$)/gi,
      /need to (.+?)(?:\n|$)/gi,
      /should (.+?)(?:\n|$)/gi,
      /TODO: (.+?)(?:\n|$)/gi
    ];

    const items: string[] = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        items.push(match[1].trim());
      }
    });

    return items.slice(0, 3); // Limit to 3 items
  }

  private detectPIIMock(text: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/ // Phone
    ];

    return piiPatterns.some(pattern => pattern.test(text));
  }
}

// Routing Resolution RPC Client
export class RoutingClient extends RPCClient {
  /**
   * Resolve Telegram chat ID based on email routing context
   */
  async resolveTelegramChatID(params: {
    domain: string;
    scope: string;
    type: string;
    hierarchy: string;
    meta: string;
    stateId?: string;
    aiSentiment?: string;
    emailFrom?: string;
  }): Promise<RoutingSuggestion> {
    ui.debug('Calling routing resolution');

    // For now, return mock routing - in production this would call D12 or routing service
    const mockRouting: RoutingSuggestion = {
      chat_id: this.resolveChatIdMock(params),
      routing_confidence: 0.85,
      reasoning: this.generateRoutingReasonMock(params)
    };

    // Handle special cases
    if (params.scope === 'oncall') {
      mockRouting.chat_id = await this.getOnCallChatIdMock(params);
      mockRouting.routing_confidence = 0.95;
    }

    if (params.stateId && params.stateId.startsWith('inc')) {
      mockRouting.chat_id = this.getIncidentChatIdMock(params.stateId);
      mockRouting.routing_confidence = 0.98;
    }

    return mockRouting;
  }

  private resolveChatIdMock(params: any): string {
    const routingMap: Record<string, Record<string, string>> = {
      'infra': {
        'sre': '@infra-sre-alerts',
        'dev': '@infra-dev-updates',
        'oncall': '@infra-oncall'
      },
      'qa': {
        'dev': '@qa-dev-reviews',
        'lead': '@qa-lead-approvals'
      },
      'docs': {
        'senior': '@docs-senior-reviews',
        'dev': '@docs-dev-feedback'
      },
      'support': {
        'customer': '@support-customer-issues',
        'internal': '@support-internal-escalations'
      }
    };

    const domainRoutes = routingMap[params.domain];
    if (domainRoutes) {
      return domainRoutes[params.scope] || domainRoutes['default'] || '@general-support';
    }

    // Fallback routing
    return '@general-support';
  }

  private generateRoutingReasonMock(params: any): string {
    return `Routed to ${params.domain}/${params.scope} based on email grammar and organizational structure`;
  }

  private async getOnCallChatIdMock(params: any): Promise<string> {
    // Mock on-call lookup - in production this would check on-call schedule
    const onCallSchedule = {
      'infra': '@infra-oncall-current',
      'support': '@support-oncall-current',
      'security': '@security-oncall-current'
    };

    return onCallSchedule[params.domain] || '@general-oncall';
  }

  private getIncidentChatIdMock(stateId: string): string {
    // Extract incident number and route to specific incident channel
    const incidentNum = stateId.replace('inc', '');
    return `@incident-${incidentNum}`;
  }

  /**
   * Suggest email routing (legacy method name used by worker)
   */
  async suggestEmailRouting(params: any): Promise<RoutingSuggestion> {
    return this.resolveTelegramChatID(params);
  }
}

// Email Management RPC Client
export class EmailClient extends RPCClient {
  async draftEmailReply(params: {
    originalSubject: string;
    originalBody: string;
    recipient: string;
    context: string;
  }): Promise<{
    draft: string;
    confidence: number;
    tone: string;
    wordCount: number;
  }> {
    ui.debug('Drafting email reply with AI');

    // Mock AI email drafting - in production this would call real AI
    const draft = `Dear ${params.recipient},

Thank you for your email regarding "${params.originalSubject}".

${params.context}

I've reviewed your request and would be happy to help. Here's what I can assist you with:

1. Understanding your current situation
2. Providing guidance on next steps
3. Connecting you with the right resources

Please let me know if you need any additional information or have questions about the process.

Best regards,
Support Team`;

    return {
      draft,
      confidence: 0.87,
      tone: 'professional',
      wordCount: draft.split(/\s+/).length
    };
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    from: string;
    replyTo?: string;
  }): Promise<{ messageId: string; status: string }> {
    ui.debug('Sending email via external service');

    // Mock email sending - in production this would integrate with SendGrid, Postmark, etc.
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`📧 Email sent: ${params.subject} to ${params.to} (ID: ${messageId})`);

    return {
      messageId,
      status: 'sent'
    };
  }
}

// Logging and Monitoring RPC Client
export class LoggingClient extends RPCClient {
  async logEmailProcessingError(params: {
    email: string;
    from: string;
    error: string;
    timestamp: string;
    messageId: string;
  }): Promise<void> {
    ui.debug('Logging email processing error');
    // In production, this would send to monitoring/alerting system
    console.error(`Email processing error for ${params.email}: ${params.error}`);
  }

  async logDeadLetterEmail(params: {
    email: string;
    reason: string;
    from: string;
    subject: string;
  }): Promise<void> {
    ui.debug('Logging dead letter email');
    // In production, this would send to dead letter queue monitoring
    console.warn(`Dead letter email: ${params.email} (${params.reason})`);
  }
}

// Factory function to create all RPC clients
export function createRPCClients(config: RPCConfig) {
  return {
    ai: new AIAnalysisClient(config),
    routing: new RoutingClient(config),
    email: new EmailClient(config),
    logging: new LoggingClient(config)
  };
}

// Export individual clients and utilities
export { RPCClient, RPCError, RPCConfig };
export type { AIAnalysis, RoutingSuggestion };
