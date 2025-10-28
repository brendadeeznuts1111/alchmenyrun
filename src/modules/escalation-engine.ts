import { WorkflowInstance } from '../types/workflow';
import { ColorFormatter } from '../utils/ansi-colors';

export interface EscalationCriteria {
  priority: string[];
  minFinancialImpact: number;
  securityChange: boolean;
  minAffectedUsers: number;
  regulatoryCompliance: boolean;
  systemDowntime: boolean;
  incidentResponse: boolean;
  enableLogging: boolean;
}

export interface EscalationResult {
  shouldEscalate: boolean;
  factors: string[];
  riskScore: number;
  reason?: string;
}

export class EscalationEngine {
  private defaultCriteria: EscalationCriteria = {
    priority: ['critical', 'emergency'],
    minFinancialImpact: 10000,
    securityChange: true,
    minAffectedUsers: 100,
    regulatoryCompliance: true,
    systemDowntime: true,
    incidentResponse: true,
    enableLogging: true
  };

  constructor(private customCriteria?: Partial<EscalationCriteria>) {
    this.defaultCriteria = { ...this.defaultCriteria, ...customCriteria };
  }

  /**
   * Determines if a workflow should be escalated based on its characteristics
   */
  shouldEscalateWorkflow(instance: WorkflowInstance, timeoutMinutes: number): boolean {
    const result = this.evaluateEscalation(instance, timeoutMinutes);
    return result.shouldEscalate;
  }

  /**
   * Comprehensive escalation evaluation with detailed results
   */
  evaluateEscalation(instance: WorkflowInstance, timeoutMinutes: number): EscalationResult {
    const data = instance.data;
    const factors: string[] = [];
    let shouldEscalate = false;

    // Check priority escalation
    if (this.shouldEscalateByPriority(data.priority)) {
      factors.push(`High priority: ${data.priority}`);
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `🚨 Escalation triggered by priority: ${data.priority}`,
          'red'
        ));
      }
    }

    // Check financial impact escalation
    if (this.shouldEscalateByFinancialImpact(data.financial_impact)) {
      factors.push(`Financial impact: $${data.financial_impact}`);
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `💰 Escalation triggered by financial impact: $${data.financial_impact}`,
          'red'
        ));
      }
    }

    // Check security-related escalation
    if (this.shouldEscalateBySecurityChanges(data.contains_security_changes)) {
      factors.push('Security-related changes');
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `🔒 Escalation triggered by security changes`,
          'red'
        ));
      }
    }

    // Check user impact escalation
    if (this.shouldEscalateByUserImpact(data.affected_users)) {
      factors.push(`Affects ${data.affected_users} users`);
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `👥 Escalation triggered by affected users: ${data.affected_users}`,
          'red'
        ));
      }
    }

    // Check regulatory compliance escalation
    if (this.shouldEscalateByCompliance(data.regulatory_compliance)) {
      factors.push('Regulatory compliance required');
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `⚖️ Escalation triggered by regulatory compliance requirements`,
          'red'
        ));
      }
    }

    // Check system downtime escalation
    if (this.shouldEscalateBySystemDowntime(data.system_down)) {
      factors.push('System downtime involved');
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `🔌 Escalation triggered by system downtime`,
          'red'
        ));
      }
    }

    // Check incident response escalation
    if (this.shouldEscalateByIncident(data.incident_type)) {
      factors.push(`Incident type: ${data.incident_type}`);
      shouldEscalate = true;
      if (this.defaultCriteria.enableLogging) {
        console.log(ColorFormatter.colorize(
          `🚑 Escalation triggered by incident response: ${data.incident_type}`,
          'red'
        ));
      }
    }

    const riskScore = this.calculateRiskScore(factors, data);
    
    return {
      shouldEscalate,
      factors,
      riskScore,
      reason: shouldEscalate ? `Escalation triggered by ${factors.length} factors` : undefined
    };
  }

  /**
   * Calculate risk score based on factors and workflow data
   */
  private calculateRiskScore(factors: string[], data: any): number {
    const baseScore = factors.length * 15; // Each factor adds 15 points
    
    // Additional scoring based on specific conditions
    let additionalScore = 0;

    if (data.priority === 'emergency') additionalScore += 25;
    if (data.financial_impact && data.financial_impact > 100000) additionalScore += 20;
    if (data.affected_users && data.affected_users > 1000) additionalScore += 15;

    return Math.min(100, baseScore + additionalScore);
  }

  private shouldEscalateByPriority(priority: string): boolean {
    return this.defaultCriteria.priority.includes(priority?.toLowerCase());
  }

  private shouldEscalateByFinancialImpact(financialImpact: number): boolean {
    return financialImpact && financialImpact > this.defaultCriteria.minFinancialImpact;
  }

  private shouldEscalateBySecurityChanges(containsSecurityChanges: boolean): boolean {
    return this.defaultCriteria.securityChange && containsSecurityChanges === true;
  }

  private shouldEscalateByUserImpact(affectedUsers: number): boolean {
    return affectedUsers && affectedUsers > this.defaultCriteria.minAffectedUsers;
  }

  private shouldEscalateByCompliance(regulatoryCompliance: boolean): boolean {
    return this.defaultCriteria.regulatoryCompliance && regulatoryCompliance === true;
  }

  private shouldEscalateBySystemDowntime(systemDown: boolean): boolean {
    return this.defaultCriteria.systemDowntime && systemDown === true;
  }

  private shouldEscalateByIncident(incidentType: string): boolean {
    return this.defaultCriteria.incidentResponse && incidentType;
  }

  /**
   * Get escalation factors for a workflow instance
   */
  getEscalationFactors(instance: WorkflowInstance): string[] {
    const factors: string[] = [];
    const data = instance.data;

    if (this.shouldEscalateByPriority(data.priority)) {
      factors.push(`High priority: ${data.priority}`);
    }

    if (this.shouldEscalateByFinancialImpact(data.financial_impact)) {
      factors.push(`Financial impact: $${data.financial_impact}`);
    }

    if (this.shouldEscalateBySecurityChanges(data.contains_security_changes)) {
      factors.push('Security-related changes');
    }

    if (this.shouldEscalateByUserImpact(data.affected_users)) {
      factors.push(`Affects ${data.affected_users} users`);
    }

    if (this.shouldEscalateByCompliance(data.regulatory_compliance)) {
      factors.push('Regulatory compliance required');
    }

    if (this.shouldEscalateBySystemDowntime(data.system_down)) {
      factors.push('System downtime involved');
    }

    if (this.shouldEscalateByIncident(data.incident_type)) {
      factors.push(`Incident type: ${data.incident_type}`);
    }

    return factors;
  }

  /**
   * Get escalation risk score (0-100)
   */
  getEscalationRiskScore(instance: WorkflowInstance): number {
    const factors = this.getEscalationFactors(instance);
    const baseScore = factors.length * 15; // Each factor adds 15 points
    
    // Additional scoring based on specific conditions
    const data = instance.data;
    let additionalScore = 0;

    if (data.priority === 'emergency') additionalScore += 25;
    if (data.financial_impact && data.financial_impact > 100000) additionalScore += 20;
    if (data.affected_users && data.affected_users > 1000) additionalScore += 15;

    return Math.min(100, baseScore + additionalScore);
  }

  /**
   * Update escalation criteria
   */
  updateCriteria(newCriteria: Partial<EscalationCriteria>): void {
    this.defaultCriteria = { ...this.defaultCriteria, ...newCriteria };
    console.log(ColorFormatter.colorize('🔧 Escalation criteria updated', 'yellow'));
  }

  /**
   * Get current escalation criteria
   */
  getCriteria(): EscalationCriteria {
    return { ...this.defaultCriteria };
  }
}
