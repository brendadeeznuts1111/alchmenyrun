/**
 * Kinja-Enhanced Email Analyzer
 * Integrates temporal intelligence, correctness scoring, and priority calibration
 */

import { KinjaClient, KinjaEnhancedAnalysis, TemporalAnalysis, CorrectnessAnalysis, HistoricalContext, KinjaAction } from './kinja-analyzer';
import { TemporalIntelligenceEngine } from './temporal-engine';

export interface EmailContent {
  subject: string;
  body: string;
  stateId?: string;
  sender: string;
  receivedAt: Date;
}

export interface BasicAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent';
  confidence: number;
  urgency: string;
}

export interface ActionPlan {
  actions: KinjaAction[];
  effort: 'minutes' | 'hours' | 'days';
  requiredSkills: string[];
}

export class KinjaEnhancedEmailAnalyzer {
  private kinja: KinjaClient;
  private temporalEngine: TemporalIntelligenceEngine;
  private rpc: any; // RPC client for AI analysis

  constructor(kinjaClient: KinjaClient, rpcClient: any) {
    this.kinja = kinjaClient;
    this.rpc = rpcClient;
    this.temporalEngine = new TemporalIntelligenceEngine(kinjaClient);
  }

  async analyzeEmailWithKinja(content: EmailContent): Promise<KinjaEnhancedAnalysis> {
    
    // 1. Basic AI analysis
    const basicAnalysis = await this.rpc.call('ai.analyzeEmailContent', {
      subject: content.subject,
      body: content.body,
      stateId: content.stateId,
      context: 'email_routing'
    });

    // 2. Kinja temporal intelligence
    const temporalAnalysis = await this.temporalEngine.analyzeTemporalContext({
      content: content.body,
      sender: content.sender,
      receivedTime: content.receivedAt,
      stateId: content.stateId
    });

    // 3. Kinja correctness assessment
    const correctnessAnalysis = await this.kinja.assessCorrectness({
      content: content.body,
      subject: content.subject,
      context: content.stateId || 'general',
      senderReputation: await this.getSenderReputation(content.sender)
    });

    // 4. Priority calibration engine
    const calibratedPriority = await this.calibratePriority(
      basicAnalysis.urgency,
      temporalAnalysis,
      correctnessAnalysis,
      content.stateId
    );

    // 5. Action recommendation engine
    const actionPlan = await this.generateActionPlan({
      basicAnalysis,
      temporalAnalysis,
      correctnessAnalysis,
      calibratedPriority,
      stateId: content.stateId
    });

    return {
      sentiment: basicAnalysis.sentiment,
      sentimentScore: basicAnalysis.confidence,
      
      // Temporal intelligence
      timeToAnswer: temporalAnalysis.expectedResponseTime,
      expectedResponseTime: temporalAnalysis.slaTime,
      temporalUrgency: temporalAnalysis.urgencyLevel,
      deadline: temporalAnalysis.deadline,
      
      // Correctness scoring
      correctnessScore: correctnessAnalysis.score,
      confidence: correctnessAnalysis.confidence,
      riskFactors: correctnessAnalysis.riskFactors,
      
      // Dynamic priority
      calibratedPriority: calibratedPriority.priority,
      priorityReason: calibratedPriority.reason,
      escalationRecommendation: await this.getEscalationRecommendation(calibratedPriority.priority),
      
      // Action intelligence
      recommendedActions: actionPlan.actions,
      estimatedEffort: actionPlan.effort,
      requiredSkills: actionPlan.requiredSkills
    };
  }

  private async calibratePriority(
    initialPriority: string,
    temporal: TemporalAnalysis,
    correctness: CorrectnessAnalysis,
    stateId?: string
  ): Promise<{ priority: KinjaEnhancedAnalysis['calibratedPriority'], reason: string }> {
    
    const priorityWeights = {
      temporal: 0.4,
      correctness: 0.3,
      historical: 0.2,
      sender: 0.1
    };

    let score = 0;
    let reasons: string[] = [];
    
    // Temporal factor (sooner deadline = higher priority)
    if (temporal.urgencyLevel === 'immediate') {
      score += 100 * priorityWeights.temporal;
      reasons.push('immediate temporal urgency');
    } else if (temporal.urgencyLevel === 'hours') {
      score += 75 * priorityWeights.temporal;
      reasons.push('hour-level urgency');
    } else if (temporal.urgencyLevel === 'days') {
      score += 50 * priorityWeights.temporal;
      reasons.push('day-level urgency');
    } else {
      score += 25 * priorityWeights.temporal;
      reasons.push('standard urgency');
    }

    // Correctness factor (lower correctness = higher priority for potential issues)
    const correctnessScore = (1 - correctness.score) * 100; // Invert: lower correctness = higher priority
    score += correctnessScore * priorityWeights.correctness;
    if (correctness.score < 0.7) {
      reasons.push('correctness concerns detected');
    }

    // Historical context
    if (stateId) {
      const historicalData = await this.kinja.getHistoricalContext(stateId);
      score += historicalData.priorityScore * priorityWeights.historical;
      if (historicalData.priorityScore > 70) {
        reasons.push('historical high priority pattern');
      }
    }

    // Map score to priority levels
    let priority: KinjaEnhancedAnalysis['calibratedPriority'];
    if (score >= 90) {
      priority = 'p0';
      reasons.push('critical threshold exceeded');
    } else if (score >= 75) {
      priority = 'p1';
      reasons.push('high priority threshold');
    } else if (score >= 60) {
      priority = 'p2';
      reasons.push('medium priority threshold');
    } else if (score >= 40) {
      priority = 'p3';
      reasons.push('low priority threshold');
    } else {
      priority = 'p3';
      reasons.push('standard priority');
    }

    // Check for critical risk factors
    if (correctness.riskFactors.includes('critical') || correctness.riskFactors.includes('emergency')) {
      priority = 'crit';
      reasons.push('critical risk factors detected');
    }

    return {
      priority,
      reason: reasons.join(', ')
    };
  }

  private async generateActionPlan(params: {
    basicAnalysis: BasicAnalysis;
    temporalAnalysis: TemporalAnalysis;
    correctnessAnalysis: CorrectnessAnalysis;
    calibratedPriority: { priority: KinjaEnhancedAnalysis['calibratedPriority'], reason: string };
    stateId?: string;
  }): Promise<ActionPlan> {
    
    const actions: KinjaAction[] = [];
    
    // CRITICAL PRIORITY ACTIONS (P0/CRIT)
    if (params.calibratedPriority.priority === 'p0' || params.calibratedPriority.priority === 'crit') {
      actions.push({
        action: '🚨 IMMEDIATE: Acknowledge critical issue within 5 minutes',
        priority: 10,
        estimatedTime: 5,
        dependencies: [],
        assignedTo: 'on_call_engineer'
      });
      
      actions.push({
        action: '🚨 URGENT: Escalate to senior team lead and incident commander',
        priority: 10,
        estimatedTime: 3,
        dependencies: ['Critical acknowledgment'],
        assignedTo: 'team_lead'
      });
      
      actions.push({
        action: '⚡ EMERGENCY: Create incident ticket and notify all stakeholders',
        priority: 9,
        estimatedTime: 8,
        dependencies: ['Critical acknowledgment'],
        assignedTo: 'incident_manager'
      });
    }

    // HIGH PRIORITY ACTIONS (P1)
    if (params.calibratedPriority.priority === 'p1') {
      actions.push({
        action: '🔴 HIGH: Acknowledge within 15 minutes with ETA',
        priority: 8,
        estimatedTime: 5,
        dependencies: [],
        assignedTo: 'support_team'
      });
      
      actions.push({
        action: '🔴 PRIORITY: Assess impact and determine resource requirements',
        priority: 8,
        estimatedTime: 12,
        dependencies: ['High priority acknowledgment'],
        assignedTo: 'technical_lead'
      });
    }

    // TEMPORAL URGENCY ACTIONS
    if (params.temporalAnalysis.urgencyLevel === 'immediate') {
      actions.push({
        action: '⏰ TIME-SENSITIVE: Immediate response required (deadline approaching)',
        priority: 9,
        estimatedTime: 3,
        dependencies: [],
        assignedTo: 'on_call_team'
      });
      
      actions.push({
        action: '⏰ URGENT: Set up monitoring and alerts for this issue',
        priority: 7,
        estimatedTime: 10,
        dependencies: ['Immediate response'],
        assignedTo: 'devops_team'
      });
    } else if (params.temporalAnalysis.urgencyLevel === 'hours') {
      actions.push({
        action: '⏰ SAME-DAY: Respond within 4 hours with detailed plan',
        priority: 6,
        estimatedTime: 8,
        dependencies: [],
        assignedTo: 'primary_owner'
      });
    }

    // CORRECTNESS AND QUALITY ACTIONS
    if (params.correctnessAnalysis.score < 0.5) {
      actions.push({
        action: '❌ CRITICAL: Verify content accuracy - major issues detected',
        priority: 8,
        estimatedTime: 20,
        dependencies: [],
        assignedTo: 'quality_assurance'
      });
      
      actions.push({
        action: '🔍 INVESTIGATE: Analyze risk factors: ' + params.correctnessAnalysis.riskFactors.join(', '),
        priority: 7,
        estimatedTime: 15,
        dependencies: ['Content verification'],
        assignedTo: 'risk_analyst'
      });
    } else if (params.correctnessAnalysis.score < 0.7) {
      actions.push({
        action: '⚠️ REVIEW: Verify content accuracy and completeness',
        priority: 6,
        estimatedTime: 15,
        dependencies: [],
        assignedTo: 'content_reviewer'
      });
    }

    // TECHNICAL ASSESSMENT ACTIONS
    if (params.correctnessAnalysis.issues.length > 0) {
      actions.push({
        action: '🔧 TECHNICAL: Address identified issues: ' + params.correctnessAnalysis.issues.slice(0, 3).join(', '),
        priority: 7,
        estimatedTime: 25,
        dependencies: ['Technical assessment'],
        assignedTo: 'technical_team'
      });
    }

    // CUSTOMER/SERVICE ACTIONS
    if (params.basicAnalysis.sentiment === 'urgent' || params.basicAnalysis.sentiment === 'negative') {
      actions.push({
        action: '💬 CUSTOMER CARE: De-escalate and provide reassurance',
        priority: 7,
        estimatedTime: 10,
        dependencies: ['Initial assessment'],
        assignedTo: 'customer_success'
      });
      
      actions.push({
        action: '📞 FOLLOW-UP: Schedule check-in call if needed',
        priority: 5,
        estimatedTime: 15,
        dependencies: ['Customer care response'],
        assignedTo: 'account_manager'
      });
    }

    // DOCUMENTATION AND KNOWLEDGE ACTIONS
    if (params.calibratedPriority.priority === 'p0' || params.calibratedPriority.priority === 'p1') {
      actions.push({
        action: '📚 DOCUMENT: Create knowledge base article from resolution',
        priority: 4,
        estimatedTime: 30,
        dependencies: ['Issue resolution'],
        assignedTo: 'knowledge_manager'
      });
    }

    // STANDARD RESPONSE ACTIONS
    actions.push({
      action: '📧 DRAFT: Prepare comprehensive response based on analysis',
      priority: 5,
      estimatedTime: 20,
      dependencies: [],
      assignedTo: 'response_team'
    });

    // REVIEW AND VALIDATION ACTIONS
    if (params.calibratedPriority.priority !== 'p3') {
      actions.push({
        action: '✅ REVIEW: Technical and business validation before sending',
        priority: 4,
        estimatedTime: 12,
        dependencies: ['Draft response'],
        assignedTo: 'review_team'
      });
    }

    // MONITORING AND FOLLOW-UP ACTIONS
    actions.push({
      action: '📊 MONITOR: Track resolution progress and customer satisfaction',
      priority: 3,
      estimatedTime: 8,
      dependencies: ['Response sent'],
      assignedTo: 'operations_team'
    });

    // Calculate total effort and optimize
    const totalMinutes = actions.reduce((sum, action) => sum + action.estimatedTime, 0);
    let effort: 'minutes' | 'hours' | 'days';
    if (totalMinutes < 60) effort = 'minutes';
    else if (totalMinutes < 480) effort = 'hours';
    else effort = 'days';

    // Determine required skills based on actions
    const skills: string[] = ['email communication'];
    
    if (actions.some(a => a.action.includes('CRITICAL') || a.action.includes('URGENT'))) {
      skills.push('incident_management', 'crisis_communication');
    }
    
    if (actions.some(a => a.action.includes('TECHNICAL') || a.action.includes('VERIFY'))) {
      skills.push('technical_assessment', 'problem_analysis');
    }
    
    if (actions.some(a => a.action.includes('CUSTOMER') || a.action.includes('DE-ESCALATE'))) {
      skills.push('customer_relations', 'conflict_resolution');
    }
    
    if (params.calibratedPriority.priority === 'p0' || params.calibratedPriority.priority === 'crit') {
      skills.push('escalation_management', 'stakeholder_communication');
    }
    
    if (params.correctnessAnalysis.score < 0.7) {
      skills.push('quality_assurance', 'risk_assessment');
    }

    // Sort actions by priority and optimize dependencies
    const optimizedActions = this.optimizeActionDependencies(actions);

    return {
      actions: optimizedActions,
      effort,
      requiredSkills: [...new Set(skills)] // Remove duplicates
    };
  }

  private optimizeActionDependencies(actions: KinjaAction[]): KinjaAction[] {
    // Create a map of actions for quick lookup
    const actionMap = new Map(actions.map(a => [a.action.split(':')[0].trim(), a]));
    
    // Optimize dependencies to create parallel execution paths where possible
    const optimized = actions.map(action => {
      const optimizedAction = { ...action };
      
      // Remove circular dependencies and optimize for parallel execution
      if (optimizedAction.dependencies) {
        optimizedAction.dependencies = optimizedAction.dependencies.filter(dep => {
          const depAction = actionMap.get(dep);
          return depAction && depAction.priority > action.priority;
        });
      }
      
      return optimizedAction;
    });

    // Sort by priority (highest first) and then by estimated time (quickest first)
    return optimized.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.estimatedTime - b.estimatedTime;
    });
  }

  private async getSenderReputation(sender: string): Promise<number> {
    // Mock implementation - would integrate with reputation system
    if (sender.includes('internal')) return 0.9;
    if (sender.includes('customer')) return 0.7;
    if (sender.includes('partner')) return 0.8;
    return 0.5;
  }

  private async getEscalationRecommendation(priority: KinjaEnhancedAnalysis['calibratedPriority']): Promise<'maintain' | 'escalate' | 'de-escalate'> {
    if (priority === 'p0' || priority === 'crit') return 'escalate';
    if (priority === 'p3') return 'de-escalate';
    return 'maintain';
  }
}
