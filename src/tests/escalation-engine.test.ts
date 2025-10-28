import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EscalationEngine } from '../modules/escalation-engine';
import { WorkflowInstance } from '../types/workflow';

describe('EscalationEngine', () => {
  let escalationEngine: EscalationEngine;

  beforeEach(() => {
    escalationEngine = new EscalationEngine();
  });

  describe('shouldEscalateWorkflow', () => {
    it('should escalate critical priority workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-1',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { priority: 'critical' },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should escalate emergency priority workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-2',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { priority: 'emergency' },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should not escalate normal priority workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-3',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { priority: 'normal' },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(false);
    });

    it('should escalate high financial impact workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-4',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { financial_impact: 50000 },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should escalate security-related workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-5',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { contains_security_changes: true },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should escalate workflows affecting many users', () => {
      const instance: WorkflowInstance = {
        id: 'test-6',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { affected_users: 500 },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should escalate regulatory compliance workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-7',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { regulatory_compliance: true },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should escalate system downtime workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-8',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { system_down: true },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });

    it('should escalate incident response workflows', () => {
      const instance: WorkflowInstance = {
        id: 'test-9',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { incident_type: 'security_breach' },
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(true);
    });
  });

  describe('getEscalationFactors', () => {
    it('should return all applicable escalation factors', () => {
      const instance: WorkflowInstance = {
        id: 'test-10',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          priority: 'critical',
          financial_impact: 25000,
          contains_security_changes: true,
          affected_users: 200,
          regulatory_compliance: true,
          incident_type: 'data_breach'
        },
        approvals: new Map(),
        topicId: 12345
      };

      const factors = escalationEngine.getEscalationFactors(instance);
      expect(factors).toHaveLength(6);
      expect(factors).toContain('High priority: critical');
      expect(factors).toContain('Financial impact: $25000');
      expect(factors).toContain('Security-related changes');
      expect(factors).toContain('Affects 200 users');
      expect(factors).toContain('Regulatory compliance required');
      expect(factors).toContain('Incident type: data_breach');
    });

    it('should return empty array for low-risk workflow', () => {
      const instance: WorkflowInstance = {
        id: 'test-11',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { priority: 'low' },
        approvals: new Map(),
        topicId: 12345
      };

      const factors = escalationEngine.getEscalationFactors(instance);
      expect(factors).toHaveLength(0);
    });
  });

  describe('getEscalationRiskScore', () => {
    it('should calculate appropriate risk score', () => {
      const instance: WorkflowInstance = {
        id: 'test-12',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          priority: 'critical',
          financial_impact: 150000,
          affected_users: 1500,
          contains_security_changes: true
        },
        approvals: new Map(),
        topicId: 12345
      };

      const score = escalationEngine.getEscalationRiskScore(instance);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('updateCriteria', () => {
    it('should update escalation criteria', () => {
      escalationEngine.updateCriteria({
        minFinancialImpact: 50000,
        minAffectedUsers: 200
      });

      const instance: WorkflowInstance = {
        id: 'test-13',
        workflowId: 'test-workflow',
        currentStep: 'approval',
        status: 'pending',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { financial_impact: 30000 }, // Below new threshold
        approvals: new Map(),
        topicId: 12345
      };

      expect(escalationEngine.shouldEscalateWorkflow(instance, 60)).toBe(false);
    });
  });

  describe('getCriteria', () => {
    it('should return current criteria', () => {
      const criteria = escalationEngine.getCriteria();
      expect(criteria).toHaveProperty('priority');
      expect(criteria).toHaveProperty('minFinancialImpact');
      expect(criteria).toHaveProperty('securityChange');
      expect(criteria).toHaveProperty('minAffectedUsers');
      expect(criteria).toHaveProperty('regulatoryCompliance');
      expect(criteria).toHaveProperty('systemDowntime');
      expect(criteria).toHaveProperty('incidentResponse');
    });
  });
});
