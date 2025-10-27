/**
 * Kinja (Knowledge Intelligence Judgment Assistant) Integration
 * Temporal intelligence, correctness scoring, and dynamic priority calibration
 */

export interface KinjaEnhancedAnalysis {
  // Core email analysis
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent';
  sentimentScore: number;

  // Kinja temporal intelligence
  timeToAnswer: number; // hours
  expectedResponseTime: number; // hours based on priority + context
  temporalUrgency: 'immediate' | 'hours' | 'days' | 'weeks';
  deadline?: Date; // Calculated deadline

  // Kinja correctness scoring
  correctnessScore: number; // 0-1 scale
  confidence: number; // 0-1 scale
  riskFactors: string[]; // Potential issues detected

  // Dynamic priority calibration
  calibratedPriority: 'p0' | 'p1' | 'p2' | 'p3' | 'blk' | 'crit';
  priorityReason: string; // Why priority was adjusted
  escalationRecommendation: 'maintain' | 'escalate' | 'de-escalate';

  // Action intelligence
  recommendedActions: KinjaAction[];
  estimatedEffort: 'minutes' | 'hours' | 'days';
  requiredSkills: string[];
}

export interface KinjaAction {
  action: string;
  priority: number;
  estimatedTime: number; // minutes
  dependencies?: string[];
  assignedTo?: string; // Suggested assignee
}

export interface TemporalAnalysis {
  expectedResponseTime: number; // hours
  slaTime: number; // hours
  urgencyLevel: 'immediate' | 'hours' | 'days' | 'weeks';
  deadline?: Date;
  timePhrases: TimePhrase[];
  isTimeSensitive: boolean;
}

export interface TimePhrase {
  phrase: string;
  urgency: 'immediate' | 'urgent' | 'today' | 'soon' | 'later';
  hours: number;
}

export interface CorrectnessAnalysis {
  score: number; // 0-1
  confidence: number; // 0-1
  riskFactors: string[];
  recommendations: string[];
}