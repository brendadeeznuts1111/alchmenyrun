/**
 * Kinja Action Examples and Templates
 * Pre-defined action patterns for common email scenarios
 */

export const KinjaActionTemplates = {
  critical_bug: {
    actions: [
      {
        action: 'Immediate triage and reproduction',
        priority: 10,
        estimatedTime: 30,
        dependencies: [],
        assignedTo: 'on-call-engineer'
      },
      {
        action: 'Assess impact and notify stakeholders',
        priority: 9,
        estimatedTime: 15,
        dependencies: ['triage'],
        assignedTo: 'engineering-lead'
      },
      {
        action: 'Deploy hotfix or rollback',
        priority: 8,
        estimatedTime: 120,
        dependencies: ['impact-assessment'],
        assignedTo: 'platform-team'
      }
    ],
    effort: 'hours',
    requiredSkills: ['incident-response', 'debugging', 'deployment']
  },

  feature_request: {
    actions: [
      {
        action: 'Review feature feasibility and requirements',
        priority: 6,
        estimatedTime: 60,
        dependencies: [],
        assignedTo: 'product-manager'
      },
      {
        action: 'Create implementation plan and estimate',
        priority: 5,
        estimatedTime: 120,
        dependencies: ['feasibility-review'],
        assignedTo: 'engineering-team'
      },
      {
        action: 'Schedule stakeholder discussion',
        priority: 4,
        estimatedTime: 30,
        dependencies: ['implementation-plan'],
        assignedTo: 'product-manager'
      }
    ],
    effort: 'days',
    requiredSkills: ['product-management', 'technical-analysis', 'planning']
  },

  customer_support: {
    actions: [
      {
        action: 'Acknowledge customer inquiry',
        priority: 8,
        estimatedTime: 15,
        dependencies: [],
        assignedTo: 'support-specialist'
      },
      {
        action: 'Investigate and provide solution',
        priority: 7,
        estimatedTime: 180,
        dependencies: ['acknowledgment'],
        assignedTo: 'technical-support'
      },
      {
        action: 'Follow up and confirm resolution',
        priority: 5,
        estimatedTime: 30,
        dependencies: ['solution'],
        assignedTo: 'support-specialist'
      }
    ],
    effort: 'hours',
    requiredSkills: ['customer-service', 'technical-support', 'communication']
  },

  security_issue: {
    actions: [
      {
        action: 'Immediate security assessment',
        priority: 10,
        estimatedTime: 30,
        dependencies: [],
        assignedTo: 'security-team'
      },
      {
        action: 'Isolate and contain the issue',
        priority: 9,
        estimatedTime: 60,
        dependencies: ['assessment'],
        assignedTo: 'security-team'
      },
      {
        action: 'Implement fix and monitoring',
        priority: 8,
        estimatedTime: 240,
        dependencies: ['containment'],
        assignedTo: 'security-team'
      }
    ],
    effort: 'hours',
    requiredSkills: ['security', 'incident-response', 'monitoring']
  }
};

export function getActionTemplateForContent(content: string, priority: string): any {
  const lowerContent = content.toLowerCase();

  // Critical/security issues
  if (lowerContent.includes('security') || lowerContent.includes('vulnerability') ||
      lowerContent.includes('breach') || lowerContent.includes('exploit')) {
    return KinjaActionTemplates.security_issue;
  }

  // Critical bugs/incidents
  if ((priority === 'p0' || priority === 'crit') &&
      (lowerContent.includes('bug') || lowerContent.includes('error') ||
       lowerContent.includes('crash') || lowerContent.includes('broken'))) {
    return KinjaActionTemplates.critical_bug;
  }

  // Customer support
  if (lowerContent.includes('help') || lowerContent.includes('support') ||
      lowerContent.includes('customer') || lowerContent.includes('user')) {
    return KinjaActionTemplates.customer_support;
  }

  // Feature requests
  if (lowerContent.includes('feature') || lowerContent.includes('enhancement') ||
      lowerContent.includes('request') || lowerContent.includes('would like')) {
    return KinjaActionTemplates.feature_request;
  }

  // Default fallback
  return {
    actions: [
      {
        action: 'Review and assess the request',
        priority: 5,
        estimatedTime: 60,
        dependencies: [],
        assignedTo: 'team-member'
      }
    ],
    effort: 'hours',
    requiredSkills: ['general']
  };
}

export function generateKinjaResponseTemplate(kinjaAnalysis: any): string {
  const priority = kinjaAnalysis.calibratedPriority;
  const tta = kinjaAnalysis.timeToAnswer;
  const correctness = kinjaAnalysis.correctnessScore;

  let template = '';

  // Priority-based response templates
  if (priority === 'p0' || priority === 'crit') {
    template = `🚨 **CRITICAL ISSUE ACKNOWLEDGED**

I've received your critical issue and am treating it with the highest priority. Our incident response team has been notified and will begin immediate investigation.

**Expected Resolution:** Within ${tta} hours
**Status:** Active investigation in progress
**Next Update:** Within 30 minutes

I'll keep you updated on our progress.`;
  } else if (priority === 'p1') {
    template = `🟠 **HIGH PRIORITY REQUEST RECEIVED**

Thank you for your request. I've reviewed it and determined it needs prompt attention.

**Expected Response:** Within ${tta} hours
**Priority Level:** High
**Status:** In queue for immediate action

I'll follow up with you soon with more details.`;
  } else {
    template = `📧 **REQUEST RECEIVED**

Thank you for your message. I've reviewed your request and will respond appropriately.

**Expected Response:** Within ${tta} hours
**Priority Assessment:** ${priority.toUpperCase()}
**Status:** Added to our processing queue

I'll get back to you as soon as possible.`;
  }

  // Add correctness concerns
  if (correctness < 0.7) {
    template += `

**📝 Note:** I noticed some areas that could use clarification to ensure I provide the most accurate assistance. Could you please provide additional details about: ${kinjaAnalysis.riskFactors.join(', ')}?`;
  }

  // Add recommended actions summary
  if (kinjaAnalysis.recommendedActions.length > 0) {
    template += `

**🎯 Next Steps:**
${kinjaAnalysis.recommendedActions.slice(0, 2).map(action => `• ${action.action} (${action.estimatedTime}m)`).join('\n')}`;
  }

  return template;
}