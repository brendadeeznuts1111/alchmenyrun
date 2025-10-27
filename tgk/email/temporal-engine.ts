/**
 * Temporal Intelligence Engine
 * Analyzes time sensitivity, deadlines, and response time expectations
 */

import { TemporalAnalysis, TimePhrase } from './kinja-analyzer';

export class TemporalIntelligenceEngine {
  async analyzeTemporalContext(context: {
    content: string;
    sender: string;
    receivedTime: Date;
    stateId?: string;
  }): Promise<TemporalAnalysis> {

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

    return {
      expectedResponseTime,
      slaTime: await this.getSLAForContext(context.stateId, context.sender),
      urgencyLevel,
      deadline,
      timePhrases,
      isTimeSensitive: this.isTimeSensitiveContent(context.content)
    };
  }

  private async extractTimeReferences(content: string): Promise<TimePhrase[]> {
    const phrases: TimePhrase[] = [];
    const lowerContent = content.toLowerCase();

    // Immediate urgency patterns
    if (lowerContent.includes('immediately') || lowerContent.includes('right now') ||
        lowerContent.includes('asap') || lowerContent.includes('urgent')) {
      phrases.push({
        phrase: 'immediately',
        urgency: 'immediate',
        hours: 1
      });
    }

    // Urgent patterns
    if (lowerContent.includes('urgent') || lowerContent.includes('critical') ||
        lowerContent.includes('emergency') || lowerContent.includes('blocking')) {
      phrases.push({
        phrase: 'urgent',
        urgency: 'urgent',
        hours: 4
      });
    }

    // Today patterns
    if (lowerContent.includes('today') || lowerContent.includes('eod') ||
        lowerContent.includes('end of day')) {
      phrases.push({
        phrase: 'today',
        urgency: 'today',
        hours: 8
      });
    }

    // Soon patterns
    if (lowerContent.includes('soon') || lowerContent.includes('quickly') ||
        lowerContent.includes('promptly')) {
      phrases.push({
        phrase: 'soon',
        urgency: 'soon',
        hours: 24
      });
    }

    // Specific time patterns (basic regex)
    const timeRegex = /(\d+)\s*(hour|hr|h|day|d|week|w)s?/gi;
    let match;
    while ((match = timeRegex.exec(content)) !== null) {
      const number = parseInt(match[1]);
      const unit = match[2].toLowerCase()[0]; // First char

      let hours = number;
      if (unit === 'd') hours = number * 24;
      if (unit === 'w') hours = number * 24 * 7;

      phrases.push({
        phrase: match[0],
        urgency: hours <= 4 ? 'urgent' : hours <= 24 ? 'today' : 'later',
        hours
      });
    }

    return phrases;
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
      baseTime = historicalPattern?.averageResponseTime || baseTime;
    }

    // Adjust based on content urgency
    const contentUrgency = this.analyzeContentUrgency(params.content);
    if (contentUrgency === 'high') baseTime *= 0.5;
    else if (contentUrgency === 'low') baseTime *= 2;

    return Math.max(1, baseTime); // Minimum 1 hour
  }

  private calculateTimeMentionAdjustment(phrases: TimePhrase[]): number {
    if (phrases.length === 0) return 48; // Default 2 days

    let minHours = 48;
    for (const phrase of phrases) {
      minHours = Math.min(minHours, phrase.hours);
    }

    return minHours;
  }

  private determineTemporalUrgency(expectedHours: number, phrases: TimePhrase[]): 'immediate' | 'hours' | 'days' | 'weeks' {
    // Check explicit phrases first
    for (const phrase of phrases) {
      if (phrase.urgency === 'immediate') return 'immediate';
      if (phrase.urgency === 'urgent') return 'hours';
      if (phrase.urgency === 'today') return 'hours';
      if (phrase.urgency === 'soon') return 'days';
    }

    // Fallback to expected hours
    if (expectedHours <= 2) return 'immediate';
    if (expectedHours <= 8) return 'hours';
    if (expectedHours <= 48) return 'days';
    return 'weeks';
  }

  private calculateDeadline(receivedTime: Date, expectedHours: number, urgency: string): Date | undefined {
    if (urgency === 'weeks') return undefined; // No strict deadline

    const deadline = new Date(receivedTime);
    deadline.setHours(deadline.getHours() + expectedHours);

    // Business hours adjustment
    if (urgency === 'days' || urgency === 'weeks') {
      // Move to next business day if after hours
      const hour = deadline.getHours();
      if (hour >= 18) { // After 6 PM
        deadline.setDate(deadline.getDate() + 1);
        deadline.setHours(9, 0, 0, 0); // Next morning 9 AM
      } else if (hour < 9) { // Before 9 AM
        deadline.setHours(9, 0, 0, 0); // Same day 9 AM
      }
    }

    return deadline;
  }

  private async isInternalSender(sender: string): Promise<boolean> {
    // Check if sender is from internal domains
    const internalDomains = ['cloudflare.com', 'alch.run'];
    return internalDomains.some(domain => sender.toLowerCase().includes(domain));
  }

  private async isCustomerSender(sender: string): Promise<boolean> {
    // Would check against customer database
    // For now, assume external senders are customers
    return !await this.isInternalSender(sender) && !await this.isPartnerSender(sender);
  }

  private async isPartnerSender(sender: string): Promise<boolean> {
    // Check partner domains
    const partnerDomains = ['partner.com', 'vendor.net'];
    return partnerDomains.some(domain => sender.toLowerCase().includes(domain));
  }

  private async getSLAForContext(stateId?: string, sender?: string): Promise<number> {
    // Would check SLA database based on context
    // For now, return default SLAs
    if (stateId?.includes('incident') || stateId?.includes('critical')) return 2; // 2 hours for incidents
    if (await this.isInternalSender(sender || '')) return 8; // 8 hours internal
    return 24; // 24 hours default
  }

  private async getHistoricalResponsePattern(stateId: string): Promise<{ averageResponseTime: number } | null> {
    // Would query historical data
    // Mock response for now
    return { averageResponseTime: 12 };
  }

  private analyzeContentUrgency(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    const highUrgencyWords = ['critical', 'emergency', 'blocking', 'urgent', 'immediate', 'asap'];
    const lowUrgencyWords = ['whenever', 'eventually', 'sometime', 'nice to have'];

    const highCount = highUrgencyWords.filter(word => lowerContent.includes(word)).length;
    const lowCount = lowUrgencyWords.filter(word => lowerContent.includes(word)).length;

    if (highCount > 0) return 'high';
    if (lowCount > 0) return 'low';
    return 'medium';
  }

  private isTimeSensitiveContent(content: string): boolean {
    const timeSensitiveIndicators = [
      'deadline', 'due date', 'by eod', 'before', 'expires',
      'time-sensitive', 'urgent', 'critical', 'emergency'
    ];

    const lowerContent = content.toLowerCase();
    return timeSensitiveIndicators.some(indicator => lowerContent.includes(indicator));
  }
}