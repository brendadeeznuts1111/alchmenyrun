/**
 * Kinja-Enhanced Telegram Message Formatter
 * Formats email analysis results with Kinja intelligence for Telegram display
 */

import { KinjaEnhancedAnalysis } from './kinja-analyzer';

export interface ParsedEmailAddress {
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
}

export interface EmailData {
  from: string;
  headers: Map<string, string>;
  subject: string;
  body: string;
}

export interface BasicAnalysis {
  sentiment: string;
  sentimentScore: number;
}

export class KinjaTelegramFormatter {
  
  formatTelegramMessageWithKinja(
    parsed: ParsedEmailAddress,
    analysis: BasicAnalysis,
    email: EmailData,
    kinjaAnalysis: KinjaEnhancedAnalysis
  ): string {
    
    const priorityIcon = {
      p0: '🚨', p1: '🔴', p2: '🟡', p3: '🟢', blk: '⛔', crit: '💀'
    }[kinjaAnalysis.calibratedPriority];

    const timeToAnswer = this.formatTimeToAnswer(kinjaAnalysis.timeToAnswer);
    const correctnessIndicator = this.formatCorrectness(kinjaAnalysis.correctnessScore);
    const deadline = kinjaAnalysis.deadline ? kinjaAnalysis.deadline.toLocaleString() : 'Not specified';
    
    return `
${priorityIcon} **${parsed.domain.toUpperCase()}.${parsed.scope}** | ${parsed.type} 
**Calibrated Priority:** ${kinjaAnalysis.calibratedPriority} (_${kinjaAnalysis.priorityReason}_)

📊 **Kinja Intelligence:**
• **Time to Answer:** ${timeToAnswer} (Expected: ${kinjaAnalysis.expectedResponseTime}h)
• **Correctness Score:** ${correctnessIndicator} (${(kinjaAnalysis.correctnessScore * 100).toFixed(0)}%)
• **Confidence:** ${(kinjaAnalysis.confidence * 100).toFixed(0)}%
• **Risk Factors:** ${kinjaAnalysis.riskFactors.length > 0 ? kinjaAnalysis.riskFactors.join(', ') : 'None detected'}

⏰ **Temporal Context:**
• **Urgency:** ${kinjaAnalysis.temporalUrgency}
• **Deadline:** ${deadline}
• **Escalation:** ${kinjaAnalysis.escalationRecommendation}

🎯 **Recommended Actions:**
${kinjaAnalysis.recommendedActions.slice(0, 5).map((action, index) => {
  const priorityIcon = action.priority >= 9 ? '🚨' : 
                       action.priority >= 7 ? '🔴' : 
                       action.priority >= 5 ? '🟡' : '🟢';
  const timeStr = action.estimatedTime < 60 ? `${action.estimatedTime}m` : 
                   action.estimatedTime < 120 ? '1h' : 
                   `${Math.round(action.estimatedTime / 60)}h`;
  const assignee = action.assignedTo ? ` • 👤 ${action.assignedTo}` : '';
  
  return `${index + 1}. ${priorityIcon} ${action.action.split(':')[1] || action.action} (${timeStr}, ${action.priority}/10)${assignee}`;
}).join('\n')}

${kinjaAnalysis.recommendedActions.length > 5 ? `📋 *${kinjaAnalysis.recommendedActions.length - 5} more actions available*` : ''}

⚡ **Total Estimated Effort:** ${this.formatTotalEffort(kinjaAnalysis.recommendedActions)}
🛠️ **Required Skills:** ${kinjaAnalysis.requiredSkills.slice(0, 4).join(', ')}${kinjaAnalysis.requiredSkills.length > 4 ? '...' : ''}

📧 **Email Details:**
**From:** ${email.from}
**Subject:** *${email.headers.get('subject')}*

_AI Sentiment: ${analysis.sentiment} (${(analysis.sentimentScore * 100).toFixed(0)}% confidence)_
    `.trim();
  }

  formatTimeToAnswer(hours: number): string {
    if (hours < 1) return 'Immediate';
    if (hours <= 4) return `${hours}h (Urgent)`;
    if (hours <= 24) return `${hours}h (Today)`;
    return `${Math.ceil(hours / 24)}d`;
  }

  formatCorrectness(score: number): string {
    if (score >= 0.9) return '🎯 Excellent';
    if (score >= 0.7) return '✅ Good';
    if (score >= 0.5) return '⚠️ Fair';
    return '❌ Poor';
  }

  formatTotalEffort(actions: KinjaAction[]): string {
    const totalMinutes = actions.reduce((sum, action) => sum + action.estimatedTime, 0);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else if (totalMinutes < 480) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    } else {
      const days = Math.floor(totalMinutes / 480);
      const remainingHours = Math.floor((totalMinutes % 480) / 60);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    }
  }

  formatActionPriority(priority: number): string {
    if (priority >= 9) return '🚨 Critical';
    if (priority >= 7) return '🔴 High';
    if (priority >= 5) return '🟡 Medium';
    return '🟢 Low';
  }

  buildKinjaEnhancedKeyboard(
    parsed: ParsedEmailAddress,
    kinjaAnalysis: KinjaEnhancedAnalysis,
    email: EmailData
  ): any[] {
    
    const keyboard = [];
    
    // CRITICAL PRIORITY ACTIONS
    if (kinjaAnalysis.calibratedPriority === 'p0' || kinjaAnalysis.calibratedPriority === 'crit') {
      keyboard.push([
        {
          text: '🚨 ACKNOWLEDGE CRITICAL (5m)',
          callback_data: JSON.stringify({
            action: 'acknowledge_critical',
            priority: kinjaAnalysis.calibratedPriority,
            expectedResponse: kinjaAnalysis.expectedResponseTime,
            messageId: email.headers.get('message-id'),
            estimatedTime: 5
          })
        },
        {
          text: '⚡ ESCALATE NOW (3m)',
          callback_data: JSON.stringify({
            action: 'escalate_immediately',
            priority: kinjaAnalysis.calibratedPriority,
            reason: kinjaAnalysis.priorityReason,
            messageId: email.headers.get('message-id'),
            estimatedTime: 3
          })
        }
      ]);
    }

    // HIGH PRIORITY ACTIONS
    if (kinjaAnalysis.calibratedPriority === 'p1') {
      keyboard.push([
        {
          text: '🔴 ACKNOWLEDGE HIGH (5m)',
          callback_data: JSON.stringify({
            action: 'acknowledge_high_priority',
            priority: kinjaAnalysis.calibratedPriority,
            expectedResponse: kinjaAnalysis.expectedResponseTime,
            messageId: email.headers.get('message-id'),
            estimatedTime: 5
          })
        },
        {
          text: '📊 ASSESS IMPACT (12m)',
          callback_data: JSON.stringify({
            action: 'assess_impact',
            priority: kinjaAnalysis.calibratedPriority,
            messageId: email.headers.get('message-id'),
            estimatedTime: 12
          })
        }
      ]);
    }

    // TIME-SENSITIVE ACTIONS
    if (kinjaAnalysis.temporalUrgency === 'immediate' || kinjaAnalysis.timeToAnswer < 2) {
      keyboard.push([
        {
          text: `⏰ RESPOND NOW (${kinjaAnalysis.timeToAnswer}h TTA)`,
          callback_data: JSON.stringify({
            action: 'immediate_response',
            tta: kinjaAnalysis.timeToAnswer,
            priority: kinjaAnalysis.calibratedPriority,
            deadline: kinjaAnalysis.deadline,
            messageId: email.headers.get('message-id')
          })
        }
      ]);
    }

    // CORRECTNESS VERIFICATION ACTIONS
    if (kinjaAnalysis.correctnessScore < 0.7) {
      const verificationTime = kinjaAnalysis.correctnessScore < 0.5 ? '20m' : '15m';
      keyboard.push([
        {
          text: `❌ VERIFY CONTENT (${verificationTime})`,
          callback_data: JSON.stringify({
            action: 'verify_correctness',
            score: kinjaAnalysis.correctnessScore,
            riskFactors: kinjaAnalysis.riskFactors,
            messageId: email.headers.get('message-id'),
            estimatedTime: kinjaAnalysis.correctnessScore < 0.5 ? 20 : 15
          })
        }
      ]);
    }

    // CUSTOMER CARE ACTIONS
    if (kinjaAnalysis.sentiment === 'urgent' || kinjaAnalysis.sentiment === 'negative') {
      keyboard.push([
        {
          text: '💬 DE-ESCALATE (10m)',
          callback_data: JSON.stringify({
            action: 'de_escalate_customer',
            sentiment: kinjaAnalysis.sentiment,
            messageId: email.headers.get('message-id'),
            estimatedTime: 10
          })
        },
        {
          text: '📞 SCHEDULE FOLLOW-UP (15m)',
          callback_data: JSON.stringify({
            action: 'schedule_followup',
            messageId: email.headers.get('message-id'),
            estimatedTime: 15
          })
        }
      ]);
    }

    // KINJA INTELLIGENCE ACTIONS
    keyboard.push([
      {
        text: '📊 VIEW KINJA ANALYSIS',
        callback_data: JSON.stringify({
          action: 'view_kinja_details',
          analysis: kinjaAnalysis,
          messageId: email.headers.get('message-id')
        })
      },
      {
        text: '🔄 RECALIBRATE PRIORITY',
        callback_data: JSON.stringify({
          action: 'recalibrate_priority',
          current: kinjaAnalysis.calibratedPriority,
          reason: kinjaAnalysis.priorityReason,
          messageId: email.headers.get('message-id')
        })
      }
    ]);

    // RESPONSE AND ROUTING ACTIONS
    keyboard.push([
      {
        text: `📧 DRAFT RESPONSE (20m)`,
        callback_data: JSON.stringify({
          action: 'draft_response',
          priority: kinjaAnalysis.calibratedPriority,
          tta: kinjaAnalysis.timeToAnswer,
          correctness: kinjaAnalysis.correctnessScore,
          messageId: email.headers.get('message-id'),
          estimatedTime: 20
        })
      },
      {
        text: '🗂️ ROUTE TO TEAM',
        callback_data: JSON.stringify({
          action: 'route_to_team',
          domain: parsed.domain,
          scope: parsed.scope,
          priority: kinjaAnalysis.calibratedPriority,
          requiredSkills: kinjaAnalysis.requiredSkills,
          messageId: email.headers.get('message-id')
        })
      }
    ]);

    // REVIEW AND VALIDATION ACTIONS
    if (kinjaAnalysis.calibratedPriority !== 'p3') {
      keyboard.push([
        {
          text: '✅ TECHNICAL REVIEW (12m)',
          callback_data: JSON.stringify({
            action: 'technical_review',
            priority: kinjaAnalysis.calibratedPriority,
            messageId: email.headers.get('message-id'),
            estimatedTime: 12
          })
        }
      ]);
    }

    // MONITORING ACTIONS
    keyboard.push([
      {
        text: '📊 SET MONITORING (8m)',
        callback_data: JSON.stringify({
          action: 'setup_monitoring',
          priority: kinjaAnalysis.calibratedPriority,
          messageId: email.headers.get('message-id'),
          estimatedTime: 8
        })
      },
      {
        text: '📚 CREATE KB ARTICLE',
        callback_data: JSON.stringify({
          action: 'create_knowledge_article',
          priority: kinjaAnalysis.calibratedPriority,
          messageId: email.headers.get('message-id'),
          estimatedTime: 30
        })
      }
    ]);

    return keyboard;
  }

  formatKinjaDetails(kinjaAnalysis: KinjaEnhancedAnalysis): string {
    return `
📊 **Detailed Kinja Analysis**

**Priority Calibration:**
• Current: ${kinjaAnalysis.calibratedPriority}
• Reason: ${kinjaAnalysis.priorityReason}
• Escalation: ${kinjaAnalysis.escalationRecommendation}

**Temporal Intelligence:**
• Time to Answer: ${kinjaAnalysis.timeToAnswer}h
• Expected Response: ${kinjaAnalysis.expectedResponseTime}h
• Urgency Level: ${kinjaAnalysis.temporalUrgency}
• Deadline: ${kinjaAnalysis.deadline?.toLocaleString() || 'Not set'}

**Correctness Assessment:**
• Score: ${(kinjaAnalysis.correctnessScore * 100).toFixed(1)}%
• Confidence: ${(kinjaAnalysis.confidence * 100).toFixed(1)}%
• Risk Factors: ${kinjaAnalysis.riskFactors.join(', ') || 'None'}

**Action Plan:**
• Estimated Effort: ${kinjaAnalysis.estimatedEffort}
• Required Skills: ${kinjaAnalysis.requiredSkills.join(', ')}
• Actions: ${kinjaAnalysis.recommendedActions.length} recommended

**Sentiment Analysis:**
• Sentiment: ${kinjaAnalysis.sentiment}
• Sentiment Score: ${(kinjaAnalysis.sentimentScore * 100).toFixed(1)}%
    `.trim();
  }

  generateKinjaTemplateReply(kinjaAnalysis: KinjaEnhancedAnalysis): string {
    const templates = {
      p0: "Thank you for your message. This has been flagged as critical and we are responding immediately.",
      p1: "Thank you for reaching out. This has been marked as high priority and we'll respond within 4 hours.",
      p2: "Thank you for your message. We'll review and respond within 24 hours.",
      p3: "Thank you for contacting us. We'll respond within our standard timeframe.",
      crit: "CRITICAL: This message requires immediate attention. Our team has been alerted and will respond within 1 hour.",
      blk: "This message has been blocked due to policy violations. Please contact support if you believe this is an error."
    };

    const baseTemplate = templates[kinjaAnalysis.calibratedPriority] || templates.p3;
    
    let additionalContext = '';
    if (kinjaAnalysis.correctnessScore < 0.7) {
      additionalContext += "\n\nWe're reviewing the details you provided to ensure we address your needs accurately.";
    }
    
    if (kinjaAnalysis.deadline) {
      additionalContext += `\n\nWe understand this is time-sensitive and will respond by ${kinjaAnalysis.deadline.toLocaleString()}.`;
    }

    return baseTemplate + additionalContext;
  }
}
