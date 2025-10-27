/**
 * Kinja-Enhanced Metrics and Observability
 * Emits detailed metrics for Kinja intelligence performance
 */

import { KinjaEnhancedAnalysis } from './kinja-analyzer';

export interface ParsedEmailAddress {
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
}

export interface MetricData {
  metric: string;
  value: number;
  labels: Record<string, string>;
  timestamp?: Date;
}

export class KinjaMetricsEmitter {
  private metricsEndpoint: string;
  private apiKey: string;

  constructor(metricsEndpoint: string, apiKey: string) {
    this.metricsEndpoint = metricsEndpoint;
    this.apiKey = apiKey;
  }

  async emitKinjaEnhancedMetrics(
    parsed: ParsedEmailAddress,
    kinjaAnalysis: KinjaEnhancedAnalysis,
    status: string
  ): Promise<void> {
    const metrics = [
      {
        metric: 'tgk_kinja_email_priority_calibration',
        value: this.priorityToNumber(kinjaAnalysis.calibratedPriority),
        labels: {
          domain: parsed.domain,
          original_priority: parsed.hierarchy,
          calibrated_priority: kinjaAnalysis.calibratedPriority,
          reason: kinjaAnalysis.priorityReason,
          status
        }
      },
      {
        metric: 'tgk_kinja_email_correctness_score',
        value: kinjaAnalysis.correctnessScore,
        labels: {
          domain: parsed.domain,
          risk_factors: kinjaAnalysis.riskFactors.join(','),
          confidence_level: this.confidenceToCategory(kinjaAnalysis.confidence)
        }
      },
      {
        metric: 'tgk_kinja_email_response_timeliness',
        value: kinjaAnalysis.timeToAnswer,
        labels: {
          domain: parsed.domain,
          temporal_urgency: kinjaAnalysis.temporalUrgency,
          expected_vs_actual: (kinjaAnalysis.expectedResponseTime - kinjaAnalysis.timeToAnswer).toString(),
          deadline_missed: kinjaAnalysis.deadline ? 
            (new Date() > kinjaAnalysis.deadline ? 'true' : 'false') : 'false'
        }
      },
      {
        metric: 'tgk_kinja_email_confidence_level',
        value: kinjaAnalysis.confidence,
        labels: {
          domain: parsed.domain,
          sentiment: kinjaAnalysis.sentiment,
          priority: kinjaAnalysis.calibratedPriority
        }
      },
      {
        metric: 'tgk_kinja_email_risk_factors_detected',
        value: kinjaAnalysis.riskFactors.length,
        labels: {
          domain: parsed.domain,
          priority: kinjaAnalysis.calibratedPriority,
          risk_types: kinjaAnalysis.riskFactors.join(',')
        }
      },
      {
        metric: 'tgk_kinja_email_action_count',
        value: kinjaAnalysis.recommendedActions.length,
        labels: {
          domain: parsed.domain,
          priority: kinjaAnalysis.calibratedPriority,
          effort: kinjaAnalysis.estimatedEffort
        }
      },
      {
        metric: 'tgk_kinja_email_escalation_rate',
        value: kinjaAnalysis.escalationRecommendation === 'escalate' ? 1 : 0,
        labels: {
          domain: parsed.domain,
          priority: kinjaAnalysis.calibratedPriority,
          temporal_urgency: kinjaAnalysis.temporalUrgency
        }
      }
    ];

    // Emit all metrics
    for (const metric of metrics) {
      await this.emitMetric(metric);
    }
  }

  async emitLearningMetrics(learningData: {
    modelAccuracy: number;
    predictionError: number;
    improvementRate: number;
    dataPoints: number;
  }): Promise<void> {
    const metrics = [
      {
        metric: 'tgk_kinja_model_accuracy',
        value: learningData.modelAccuracy,
        labels: {
          model_type: 'temporal_intelligence'
        }
      },
      {
        metric: 'tgk_kinja_prediction_error',
        value: learningData.predictionError,
        labels: {
          model_type: 'priority_calibration'
        }
      },
      {
        metric: 'tgk_kinja_learning_rate',
        value: learningData.improvementRate,
        labels: {
          data_points: learningData.dataPoints.toString()
        }
      }
    ];

    for (const metric of metrics) {
      await this.emitMetric(metric);
    }
  }

  async emitBusinessImpactMetrics(businessData: {
    customerSatisfactionScore: number;
    meanTimeToResponse: number;
    escalationReduction: number;
    accuracyImprovement: number;
  }): Promise<void> {
    const metrics = [
      {
        metric: 'tgk_kinja_customer_satisfaction',
        value: businessData.customerSatisfactionScore,
        labels: {
          measurement_period: 'daily'
        }
      },
      {
        metric: 'tgk_kinja_mean_time_to_response',
        value: businessData.meanTimeToResponse,
        labels: {
          unit: 'hours'
        }
      },
      {
        metric: 'tgk_kinja_escalation_reduction',
        value: businessData.escalationReduction,
        labels: {
          improvement_type: 'percentage'
        }
      },
      {
        metric: 'tgk_kinja_accuracy_improvement',
        value: businessData.accuracyImprovement,
        labels: {
          baseline_comparison: 'true'
        }
      }
    ];

    for (const metric of metrics) {
      await this.emitMetric(metric);
    }
  }

  private async emitMetric(metric: MetricData): Promise<void> {
    try {
      // Mock implementation - would integrate with actual metrics system
      console.log(`Emitting metric: ${metric.metric} = ${metric.value}`, metric.labels);
      
      // In production, this would send to Prometheus, Datadog, etc.
      // await fetch(this.metricsEndpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`
      //   },
      //   body: JSON.stringify({
      //     ...metric,
      //     timestamp: metric.timestamp || new Date()
      //   })
      // });
    } catch (error) {
      console.error('Failed to emit metric:', error);
    }
  }

  private priorityToNumber(priority: string): number {
    const mapping = { 
      p0: 100, 
      p1: 75, 
      p2: 50, 
      p3: 25, 
      blk: 90, 
      crit: 110 
    };
    return mapping[priority] || 25;
  }

  private confidenceToCategory(confidence: number): string {
    if (confidence >= 0.9) return 'very_high';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  // Performance monitoring methods
  async trackAnalysisLatency(startTime: number, endTime: number, context: string): Promise<void> {
    const latency = endTime - startTime;
    
    await this.emitMetric({
      metric: 'tgk_kinja_analysis_latency_ms',
      value: latency,
      labels: {
        context,
        performance_tier: latency < 1000 ? 'fast' : latency < 5000 ? 'medium' : 'slow'
      }
    });
  }

  async trackModelPerformance(modelName: string, accuracy: number, errorRate: number): Promise<void> {
    await this.emitMetric({
      metric: 'tgk_kinja_model_performance',
      value: accuracy,
      labels: {
        model_name: modelName,
        error_rate: errorRate.toString()
      }
    });
  }

  // Dashboard data aggregation
  async getDashboardMetrics(timeRange: string): Promise<any> {
    // Mock implementation - would query actual metrics backend
    return {
      priorityCalibrationAccuracy: 0.87,
      correctnessScoreAccuracy: 0.92,
      responseTimePredictionAccuracy: 0.78,
      modelImprovementRate: 0.15,
      meanTimeToResponse: 6.5,
      customerSatisfactionScore: 4.2,
      totalEmailsProcessed: 1250,
      escalationReduction: 0.23
    };
  }
}

// Export constants for metric names
export const KinjaEnhancedMetrics = {
  // Priority calibration accuracy
  PRIORITY_CALIBRATION_ACCURACY: 'tgk_kinja_priority_calibration_accuracy',
  
  // Correctness scoring performance
  CORRECTNESS_SCORE_ACCURACY: 'tgk_kinja_correctness_accuracy',
  
  // Temporal prediction accuracy
  RESPONSE_TIME_PREDICTION_ACCURACY: 'tgk_kinja_response_time_accuracy',
  
  // Kinja learning effectiveness
  MODEL_IMPROVEMENT_RATE: 'tgk_kinja_model_improvement_rate',
  
  // Business impact
  MEAN_TIME_TO_RESPONSE: 'tgk_kinja_mean_time_to_response',
  CUSTOMER_SATISFACTION_SCORE: 'tgk_kinja_customer_satisfaction_score',
  
  // Operational metrics
  ANALYSIS_LATENCY: 'tgk_kinja_analysis_latency_ms',
  MODEL_PERFORMANCE: 'tgk_kinja_model_performance',
  ESCALATION_RATE: 'tgk_kinja_escalation_rate',
  RISK_DETECTION_RATE: 'tgk_kinja_risk_detection_rate'
};
