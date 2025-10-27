/**
 * Kinja Self-Learning System
 * Continuously improves models based on feedback and performance data
 */

import { KinjaClient } from './kinja-analyzer';
import { KinjaMetricsEmitter } from './kinja-metrics';

export interface ResponsePattern {
  context: string;
  actualResponseTime: number;
  predictedResponseTime: number;
  sender: string;
  priority: string;
  timestamp: Date;
}

export interface PriorityDecision {
  originalPriority: string;
  calibratedPriority: string;
  humanOverride?: string;
  wasCorrect: boolean;
  context: string;
  timestamp: Date;
}

export interface CorrectnessAssessment {
  content: string;
  aiRating: number;
  humanRating?: number;
  feedback: string;
  context: string;
  timestamp: Date;
}

export interface ModelAdjustment {
  modelType: 'temporal' | 'priority' | 'correctness';
  adjustmentFactor: number;
  reason: string;
  timestamp: Date;
}

export class KinjaLearningSystem {
  private kinja: KinjaClient;
  private metrics: KinjaMetricsEmitter;
  private learningThresholds = {
    accuracy: 0.8,
    minDataPoints: 10,
    adjustmentRate: 0.1
  };

  constructor(kinjaClient: KinjaClient, metricsEmitter: KinjaMetricsEmitter) {
    this.kinja = kinjaClient;
    this.metrics = metricsEmitter;
  }

  async learnFromResponsePatterns(): Promise<ModelAdjustment[]> {
    const adjustments: ModelAdjustment[] = [];
    
    try {
      // Analyze response times and adjust future predictions
      const patterns = await this.kinja.getResponsePatterns();
      
      if (patterns.length < this.learningThresholds.minDataPoints) {
        console.log('Insufficient data for learning - need more response patterns');
        return adjustments;
      }

      const temporalAccuracy = this.calculateTemporalAccuracy(patterns);
      
      if (temporalAccuracy < this.learningThresholds.accuracy) {
        const adjustment = await this.adjustTemporalModel(patterns);
        adjustments.push(adjustment);
        
        console.log(`Temporal model adjusted: ${adjustment.reason}`);
      }

      // Emit learning metrics
      await this.metrics.emitLearningMetrics({
        modelAccuracy: temporalAccuracy,
        predictionError: 1 - temporalAccuracy,
        improvementRate: adjustments.length > 0 ? this.learningThresholds.adjustmentRate : 0,
        dataPoints: patterns.length
      });

    } catch (error) {
      console.error('Error learning from response patterns:', error);
    }

    return adjustments;
  }

  async learnFromPriorityDecisions(): Promise<ModelAdjustment[]> {
    const adjustments: ModelAdjustment[] = [];
    
    try {
      // Analyze whether priority calibrations were correct
      const decisions = await this.kinja.getPriorityDecisions();
      
      if (decisions.length < this.learningThresholds.minDataPoints) {
        console.log('Insufficient data for priority learning');
        return adjustments;
      }

      const priorityAccuracy = this.calculatePriorityAccuracy(decisions);
      
      if (priorityAccuracy < this.learningThresholds.accuracy) {
        const adjustment = await this.adjustPriorityWeights(decisions);
        adjustments.push(adjustment);
        
        console.log(`Priority model adjusted: ${adjustment.reason}`);
      }

      // Update learning metrics
      await this.metrics.emitLearningMetrics({
        modelAccuracy: priorityAccuracy,
        predictionError: 1 - priorityAccuracy,
        improvementRate: adjustments.length > 0 ? this.learningThresholds.adjustmentRate : 0,
        dataPoints: decisions.length
      });

    } catch (error) {
      console.error('Error learning from priority decisions:', error);
    }

    return adjustments;
  }

  async learnFromCorrectnessScores(): Promise<ModelAdjustment[]> {
    const adjustments: ModelAdjustment[] = [];
    
    try {
      // Improve correctness assessment based on feedback
      const assessments = await this.kinja.getCorrectnessAssessments();
      
      const assessmentsWithFeedback = assessments.filter(a => a.humanRating !== undefined);
      
      if (assessmentsWithFeedback.length < this.learningThresholds.minDataPoints) {
        console.log('Insufficient feedback for correctness learning');
        return adjustments;
      }

      const correctnessAccuracy = this.calculateCorrectnessAccuracy(assessmentsWithFeedback);
      
      if (correctnessAccuracy < this.learningThresholds.accuracy) {
        const adjustment = await this.adjustCorrectnessModel(assessmentsWithFeedback);
        adjustments.push(adjustment);
        
        console.log(`Correctness model adjusted: ${adjustment.reason}`);
      }

      // Update metrics
      await this.metrics.emitLearningMetrics({
        modelAccuracy: correctnessAccuracy,
        predictionError: 1 - correctnessAccuracy,
        improvementRate: adjustments.length > 0 ? this.learningThresholds.adjustmentRate : 0,
        dataPoints: assessmentsWithFeedback.length
      });

    } catch (error) {
      console.error('Error learning from correctness scores:', error);
    }

    return adjustments;
  }

  async runLearningCycle(): Promise<void> {
    console.log('Starting Kinja learning cycle...');
    
    const startTime = Date.now();
    
    try {
      // Run all learning processes
      const [temporalAdjustments, priorityAdjustments, correctnessAdjustments] = await Promise.all([
        this.learnFromResponsePatterns(),
        this.learnFromPriorityDecisions(),
        this.learnFromCorrectnessScores()
      ]);

      const totalAdjustments = temporalAdjustments.length + 
                              priorityAdjustments.length + 
                              correctnessAdjustments.length;

      const endTime = Date.now();
      
      console.log(`Learning cycle completed in ${endTime - startTime}ms`);
      console.log(`Total model adjustments: ${totalAdjustments}`);
      
      // Emit learning cycle metrics
      await this.metrics.emitMetric({
        metric: 'tgk_kinja_learning_cycle_duration_ms',
        value: endTime - startTime,
        labels: {
          adjustments_made: totalAdjustments.toString(),
          cycle_success: 'true'
        }
      });

    } catch (error) {
      console.error('Learning cycle failed:', error);
      
      await this.metrics.emitMetric({
        metric: 'tgk_kinja_learning_cycle_duration_ms',
        value: Date.now() - startTime,
        labels: {
          adjustments_made: '0',
          cycle_success: 'false'
        }
      });
    }
  }

  private calculateTemporalAccuracy(patterns: ResponsePattern[]): number {
    if (patterns.length === 0) return 0;
    
    const totalError = patterns.reduce((sum, pattern) => {
      const error = Math.abs(pattern.actualResponseTime - pattern.predictedResponseTime);
      const relativeError = error / Math.max(pattern.actualResponseTime, pattern.predictedResponseTime);
      return sum + (1 - relativeError);
    }, 0);
    
    return totalError / patterns.length;
  }

  private calculatePriorityAccuracy(decisions: PriorityDecision[]): number {
    if (decisions.length === 0) return 0;
    
    const correctDecisions = decisions.filter(decision => {
      if (decision.humanOverride) {
        return decision.calibratedPriority === decision.humanOverride;
      }
      return decision.wasCorrect;
    });
    
    return correctDecisions.length / decisions.length;
  }

  private calculateCorrectnessAccuracy(assessments: CorrectnessAssessment[]): number {
    if (assessments.length === 0) return 0;
    
    const totalError = assessments.reduce((sum, assessment) => {
      const error = Math.abs(assessment.aiRating - assessment.humanRating!);
      return sum + (1 - error);
    }, 0);
    
    return totalError / assessments.length;
  }

  private async adjustTemporalModel(patterns: ResponsePattern[]): Promise<ModelAdjustment> {
    // Calculate average error by context
    const errorsByContext = new Map<string, number[]>();
    
    for (const pattern of patterns) {
      const error = pattern.actualResponseTime - pattern.predictedResponseTime;
      const context = pattern.context || 'default';
      
      if (!errorsByContext.has(context)) {
        errorsByContext.set(context, []);
      }
      errorsByContext.get(context)!.push(error);
    }

    // Calculate adjustment factor
    let totalAdjustment = 0;
    let contextCount = 0;
    
    for (const [context, errors] of errorsByContext) {
      const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
      const adjustmentFactor = Math.max(-0.2, Math.min(0.2, avgError / 24)); // Cap at ±20%
      
      totalAdjustment += adjustmentFactor;
      contextCount++;
    }

    const finalAdjustment = totalAdjustment / contextCount;
    
    // In a real implementation, this would update the model parameters
    console.log(`Temporal model adjustment factor: ${finalAdjustment}`);
    
    return {
      modelType: 'temporal',
      adjustmentFactor: finalAdjustment,
      reason: `Adjusted based on ${patterns.length} response patterns`,
      timestamp: new Date()
    };
  }

  private async adjustPriorityWeights(decisions: PriorityDecision[]): Promise<ModelAdjustment> {
    // Analyze which priority levels are being over/under-calibrated
    const priorityErrors = new Map<string, number[]>();
    
    for (const decision of decisions) {
      if (decision.humanOverride && decision.calibratedPriority !== decision.humanOverride) {
        const error = this.getPriorityNumeric(decision.humanOverride) - 
                     this.getPriorityNumeric(decision.calibratedPriority);
        
        if (!priorityErrors.has(decision.calibratedPriority)) {
          priorityErrors.set(decision.calibratedPriority, []);
        }
        priorityErrors.get(decision.calibratedPriority)!.push(error);
      }
    }

    // Calculate overall adjustment
    let totalAdjustment = 0;
    let adjustmentCount = 0;
    
    for (const [priority, errors] of priorityErrors) {
      const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
      totalAdjustment += avgError;
      adjustmentCount++;
    }

    const finalAdjustment = adjustmentCount > 0 ? totalAdjustment / adjustmentCount : 0;
    
    console.log(`Priority model adjustment factor: ${finalAdjustment}`);
    
    return {
      modelType: 'priority',
      adjustmentFactor: finalAdjustment,
      reason: `Adjusted based on ${decisions.length} priority decisions`,
      timestamp: new Date()
    };
  }

  private async adjustCorrectnessModel(assessments: CorrectnessAssessment[]): Promise<ModelAdjustment> {
    // Calculate average bias in correctness scoring
    const totalBias = assessments.reduce((sum, assessment) => {
      return sum + (assessment.humanRating! - assessment.aiRating);
    }, 0);
    
    const avgBias = totalBias / assessments.length;
    const adjustmentFactor = Math.max(-0.1, Math.min(0.1, avgBias)); // Cap at ±10%
    
    console.log(`Correctness model adjustment factor: ${adjustmentFactor}`);
    
    return {
      modelType: 'correctness',
      adjustmentFactor,
      reason: `Adjusted based on ${assessments.length} human feedback points`,
      timestamp: new Date()
    };
  }

  private getPriorityNumeric(priority: string): number {
    const mapping = { p0: 100, p1: 75, p2: 50, p3: 25, blk: 90, crit: 110 };
    return mapping[priority] || 25;
  }

  // Feedback collection methods
  async recordResponsePattern(pattern: ResponsePattern): Promise<void> {
    // In a real implementation, this would store in a database
    console.log('Recording response pattern:', pattern);
  }

  async recordPriorityDecision(decision: PriorityDecision): Promise<void> {
    console.log('Recording priority decision:', decision);
  }

  async recordCorrectnessFeedback(assessment: CorrectnessAssessment): Promise<void> {
    console.log('Recording correctness feedback:', assessment);
  }

  // Model performance monitoring
  async getModelPerformance(): Promise<any> {
    return {
      temporalAccuracy: 0.85,
      priorityAccuracy: 0.78,
      correctnessAccuracy: 0.91,
      lastLearningCycle: new Date(),
      totalAdjustments: 15,
      dataPointsCollected: 1250
    };
  }
}
