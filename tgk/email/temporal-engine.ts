/**
 * Temporal Intelligence Engine
 * Analyzes time-related context and calculates response expectations
 */

import { KinjaClient, TemporalAnalysis, TimePhrase } from './kinja-analyzer';

export interface TemporalContext {
  content: string;
  sender: string;
  receivedTime: Date;
  stateId?: string;
}

export interface SenderPattern {
  averageResponseTime: number;
  responseDistribution: { immediate: number; hours: number; days: number; weeks: number };
  lastInteraction: Date;
}

export class TemporalIntelligenceEngine {
  private kinja: KinjaClient;
  private senderPatterns: Map<string, SenderPattern> = new Map();

  constructor(kinjaClient: KinjaClient) {
    this.kinja = kinjaClient;
  }

  async analyzeTemporalContext(context: TemporalContext): Promise<TemporalAnalysis> {
    
    // Extract time-related phrases using NLP
    const timePhrases = await this.extractTimeReferences(context.content);
    
    // Calculate expected response time based on multiple factors
    const expectedResponseTime = await this.calculateExpectedResponseTime({
      sender: context.sender,
      content: context.content,
      timePhrases,
      stateId: context.stateId
    });

    // Determine temporal urgency
    const urgencyLevel = this.determineTemporalUrgency(expectedResponseTime, timePhrases);

    // Calculate deadline
    const deadline = this.calculateDeadline(context.receivedTime, expectedResponseTime, urgencyLevel);

    // Get SLA time for context
    const slaTime = await this.getSLAForContext(context.stateId, context.sender);

    return {
      expectedResponseTime,
      slaTime,
      urgencyLevel,
      deadline,
      timePhrases,
      isTimeSensitive: this.isTimeSensitiveContent(context.content)
    };
  }

  private async extractTimeReferences(content: string): Promise<TimePhrase[]> {
    const timePhrases: TimePhrase[] = [];
    
    // Time urgency patterns
    const patterns = [
      { regex: /\b(immediate|immediately|right now|asap|as soon as possible)\b/i, urgency: 'immediate' as const, hours: 1 },
      { regex: /\b(urgent|urgently|emergency|critical|stat)\b/i, urgency: 'urgent' as const, hours: 4 },
      { regex: /\b(today|this morning|this afternoon|tonight)\b/i, urgency: 'today' as const, hours: 8 },
      { regex: /\b(soon|shortly|quickly|promptly)\b/i, urgency: 'soon' as const, hours: 24 },
      { regex: /\b(tomorrow|tom|tmrw)\b/i, urgency: 'normal' as const, hours: 48 },
      { regex: /\b(this week|within a week)\b/i, urgency: 'normal' as const, hours: 168 },
      { regex: /\b(next week|sometime next week)\b/i, urgency: 'normal' as const, hours: 336 }
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          timePhrases.push({
            text: match,
            urgency: pattern.urgency,
            hours: pattern.hours
          });
        }
      }
    }

    // Extract specific time mentions
    const timeMatches = content.match(/\b(\d+)\s*(hours?|hrs?|days?|minutes?|mins?)\b/i);
    if (timeMatches) {
      const quantity = parseInt(timeMatches[1]);
      const unit = timeMatches[2].toLowerCase();
      
      let hours = 0;
      if (unit.includes('hour') || unit.includes('hr')) hours = quantity;
      else if (unit.includes('day')) hours = quantity * 24;
      else if (unit.includes('minute') || unit.includes('min')) hours = quantity / 60;
      
      timePhrases.push({
        text: timeMatches[0],
        urgency: hours <= 4 ? 'urgent' : hours <= 24 ? 'today' : 'normal',
        hours
      });
    }

    return timePhrases;
  }

  private async calculateExpectedResponseTime(params: {
    sender: string;
    content: string;
    timePhrases: TimePhrase[];
    stateId?: string;
  }): Promise<number> {
    
    const baseTimes = {
      internal: 4,    // hours for internal team
      customer: 24,   // hours for customers
      partner: 12,    // hours for partners
      unknown: 8      // hours for unknown senders
    };

    let baseTime = baseTimes.unknown;
    
    // Adjust based on sender type
    if (await this.isInternalSender(params.sender)) baseTime = baseTimes.internal;
    else if (await this.isCustomerSender(params.sender)) baseTime = baseTimes.customer;
    else if (await this.isPartnerSender(params.sender)) baseTime = baseTimes.partner;

    // Adjust based on explicit time mentions
    const timeMentionAdjustment = this.calculateTimeMentionAdjustment(params.timePhrases);
    baseTime = Math.min(baseTime, timeMentionAdjustment);

    // Adjust based on historical response patterns
    if (params.stateId) {
      const historicalPattern = await this.getHistoricalResponsePattern(params.stateId);
      if (historicalPattern) {
        baseTime = historicalPattern.averageResponseTime || baseTime;
      }
    }

    // Adjust based on sender's historical patterns
    const senderPattern = this.senderPatterns.get(params.sender);
    if (senderPattern) {
      baseTime = senderPattern.averageResponseTime || baseTime;
    }

    return Math.max(1, baseTime); // Minimum 1 hour
  }

  private calculateTimeMentionAdjustment(phrases: TimePhrase[]): number {
    if (phrases.length === 0) return 48; // default 2 days
    
    let adjustment = 48;
    
    for (const phrase of phrases) {
      if (phrase.urgency === 'immediate') adjustment = Math.min(adjustment, 1); // 1 hour
      else if (phrase.urgency === 'urgent') adjustment = Math.min(adjustment, 4); // 4 hours
      else if (phrase.urgency === 'today') adjustment = Math.min(adjustment, 8); // 8 hours
      else if (phrase.urgency === 'soon') adjustment = Math.min(adjustment, 24); // 1 day
    }
    
    return adjustment;
  }

  private determineTemporalUrgency(expectedHours: number, timePhrases: TimePhrase[]): 'immediate' | 'hours' | 'days' | 'weeks' {
    // Check for explicit urgent mentions first
    const hasImmediate = timePhrases.some(p => p.urgency === 'immediate');
    const hasUrgent = timePhrases.some(p => p.urgency === 'urgent');
    
    if (hasImmediate) return 'immediate';
    if (hasUrgent || expectedHours <= 4) return 'hours';
    if (expectedHours <= 72) return 'days';
    return 'weeks';
  }

  private calculateDeadline(receivedTime: Date, expectedHours: number, urgencyLevel: string): Date {
    const deadline = new Date(receivedTime);
    deadline.setHours(deadline.getHours() + expectedHours);
    
    // Add buffer based on urgency
    if (urgencyLevel === 'immediate') {
      deadline.setHours(deadline.getHours() + 1); // 1 hour buffer
    } else if (urgencyLevel === 'hours') {
      deadline.setHours(deadline.getHours() + 2); // 2 hour buffer
    } else if (urgencyLevel === 'days') {
      deadline.setHours(deadline.getHours() + 8); // 8 hour buffer
    }
    
    return deadline;
  }

  private async getSLAForContext(stateId?: string, sender?: string): Promise<number> {
    // Mock SLA calculation - would integrate with actual SLA system
    if (!stateId) return 24; // Default 24 hours
    
    // Different SLAs based on context
    if (stateId.includes('production')) return 4;
    if (stateId.includes('customer')) return 8;
    if (stateId.includes('internal')) return 16;
    
    return 24;
  }

  private isTimeSensitiveContent(content: string): boolean {
    const sensitiveKeywords = [
      'urgent', 'immediate', 'asap', 'emergency', 'critical',
      'deadline', 'overdue', 'expiring', 'time sensitive',
      'immediately', 'right now', 'stat'
    ];
    
    return sensitiveKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private async isInternalSender(sender: string): Promise<boolean> {
    // Mock implementation - would check against internal directory
    return sender.includes('internal') || sender.includes('@company.com');
  }

  private async isCustomerSender(sender: string): Promise<boolean> {
    // Mock implementation - would check against customer database
    return sender.includes('customer') || sender.includes('@client.com');
  }

  private async isPartnerSender(sender: string): Promise<boolean> {
    // Mock implementation - would check against partner directory
    return sender.includes('partner') || sender.includes('@partner.com');
  }

  private async getHistoricalResponsePattern(stateId: string): Promise<SenderPattern | null> {
    // Mock implementation - would query historical data
    return {
      averageResponseTime: 6,
      responseDistribution: { immediate: 0.1, hours: 0.3, days: 0.5, weeks: 0.1 },
      lastInteraction: new Date()
    };
  }

  // Method to update sender patterns based on actual responses
  updateSenderPattern(sender: string, actualResponseTime: number): void {
    const existing = this.senderPatterns.get(sender) || {
      averageResponseTime: 8,
      responseDistribution: { immediate: 0, hours: 0, days: 0, weeks: 0 },
      lastInteraction: new Date()
    };

    // Simple moving average update
    existing.averageResponseTime = (existing.averageResponseTime + actualResponseTime) / 2;
    existing.lastInteraction = new Date();

    this.senderPatterns.set(sender, existing);
  }
}
