/**
 * Kinja-Enhanced Telegram Message Formatter
 * Formats messages with temporal intelligence, correctness scoring, and action recommendations
 */

export class KinjaEnhancedTelegramFormatter {
  formatTelegramMessageWithKinja(parsed: any, analysis: any, email: any, kinjaAnalysis: any) {
    const priorityIcon = this.getPriorityIcon(kinjaAnalysis.calibratedPriority);
    const timeToAnswer = this.formatTimeToAnswer(kinjaAnalysis.timeToAnswer);
    const correctnessIndicator = this.formatCorrectness(kinjaAnalysis.correctnessScore);

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
• **Deadline:** ${kinjaAnalysis.deadline ? kinjaAnalysis.deadline.toLocaleString() : 'Not specified'}
• **Escalation:** ${kinjaAnalysis.escalationRecommendation}

🎯 **Recommended Actions:**
${kinjaAnalysis.recommendedActions.slice(0, 3).map(action =>
  `• ${action.action} (${action.estimatedTime}m, ${action.priority}/10 priority)`
).join('\n')}

**From:** ${email.from}
**Subject:** *${email.headers.get('subject')}*

_AI Sentiment: ${analysis.sentiment} (${(analysis.sentimentScore * 100).toFixed(0)}% confidence)_
  `.trim();
  }

  private getPriorityIcon(priority: string): string {
    const icons = {
      'p0': '🔴',
      'p1': '🟠',
      'p2': '🟡',
      'p3': '🟢',
      'blk': '🚨',
      'crit': '💀'
    };
    return icons[priority] || '⚪';
  }

  private formatTimeToAnswer(hours: number): string {
    if (hours < 1) return 'Immediate';
    if (hours <= 4) return `${hours}h (Urgent)`;
    if (hours <= 24) return `${hours}h (Today)`;
    return `${Math.ceil(hours / 24)}d`;
  }

  private formatCorrectness(score: number): string {
    if (score >= 0.9) return '🎯 Excellent';
    if (score >= 0.7) return '✅ Good';
    if (score >= 0.5) return '⚠️ Fair';
    return '❌ Poor';
  }

  buildKinjaEnhancedKeyboard(parsed: any, kinjaAnalysis: any, email: any) {
    const keyboard = [];

    // Priority-based quick actions
    if (kinjaAnalysis.calibratedPriority === 'p0' || kinjaAnalysis.calibratedPriority === 'crit') {
      keyboard.push([
        {
          text: '🚨 ACKNOWLEDGE CRITICAL',
          callback_data: JSON.stringify({
            action: 'acknowledge_critical',
            priority: kinjaAnalysis.calibratedPriority,
            expectedResponse: kinjaAnalysis.expectedResponseTime,
            messageId: email.headers.get('message-id')
          })
        }
      ]);
    }

    // Time-sensitive actions
    if (kinjaAnalysis.temporalUrgency === 'immediate' || kinjaAnalysis.timeToAnswer < 2) {
      keyboard.push([
        {
          text: `⏰ RESPOND (${kinjaAnalysis.timeToAnswer}h TTA)`,
          callback_data: JSON.stringify({
            action: 'quick_response',
            tta: kinjaAnalysis.timeToAnswer,
            priority: kinjaAnalysis.calibratedPriority
          })
        }
      ]);
    }

    // Correctness-based actions
    if (kinjaAnalysis.correctnessScore < 0.7) {
      keyboard.push([
        {
          text: `❌ VERIFY (${(kinjaAnalysis.correctnessScore * 100).toFixed(0)}% correct)`,
          callback_data: JSON.stringify({
            action: 'verify_correctness',
            score: kinjaAnalysis.correctnessScore,
            riskFactors: kinjaAnalysis.riskFactors
          })
        }
      ]);
    }

    // Kinja intelligence actions
    keyboard.push([
      {
        text: '📊 View Kinja Analysis',
        callback_data: JSON.stringify({
          action: 'view_kinja_details',
          analysis: kinjaAnalysis,
          messageId: email.headers.get('message-id')
        })
      },
      {
        text: '🔄 Recalibrate Priority',
        callback_data: JSON.stringify({
          action: 'recalibrate_priority',
          current: kinjaAnalysis.calibratedPriority,
          reason: kinjaAnalysis.priorityReason
        })
      }
    ]);

    // Standard actions with Kinja context
    keyboard.push([
      {
        text: '📧 Reply with Kinja Template',
        callback_data: JSON.stringify({
          action: 'kinja_template_reply',
          priority: kinjaAnalysis.calibratedPriority,
          tta: kinjaAnalysis.timeToAnswer,
          correctness: kinjaAnalysis.correctnessScore
        })
      }
    ]);

    return keyboard;
  }
}