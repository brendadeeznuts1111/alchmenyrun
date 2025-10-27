import { TelegramManager } from './telegram-manager';
import { JinjaEngine } from './jinja-engine';
import { WorkflowErrorHandlerImpl, WorkflowError } from './workflow-error-handler';
import { ConditionalEngine } from './conditional-engine';
import { WorkflowAnalytics } from './workflow-analytics';
import { ColorFormatter } from '../utils/ansi-colors';
import { WorkflowStep, WorkflowInstance, WorkflowApproval } from '../types/workflow';

export class WorkflowManager {
  private telegramManager: TelegramManager;
  private jinjaEngine: JinjaEngine;
  private errorHandler: WorkflowErrorHandlerImpl;
  private conditionalEngine: ConditionalEngine;
  private analytics: WorkflowAnalytics;
  private workflows: Map<string, WorkflowStep[]> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(telegramManager: TelegramManager) {
    this.telegramManager = telegramManager;
    this.jinjaEngine = new JinjaEngine();
    this.errorHandler = new WorkflowErrorHandlerImpl(this.jinjaEngine, telegramManager, this);
    this.conditionalEngine = new ConditionalEngine();
    this.analytics = new WorkflowAnalytics();
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    // Approval Request Template
    this.jinjaEngine.registerTemplate('approval_request', `
{% if workflow.priority == 'critical' %}🚨{% else %}📋{% endif %} *Approval Required: {{ workflow.title }}*

*Description:* {{ workflow.description }}
*Priority:* {{ workflow.priority|priority_emoji }} {{ workflow.priority|upper }}
*Requested by:* {{ workflow.requested_by }}
*Deadline:* {{ workflow.deadline|format_date('YYYY-MM-DD HH:mm') }}

*Current Step:* {{ current_step.name }}
*Assignees:* {{ current_step.assignees|join(', ') }}

{% if prediction %}
🤖 *AI Prediction:* {{ prediction.likelihood|round(1) }}% approval likelihood
⏱️ *Est. Response:* {{ prediction.estimated_response_time }} hours
{% if prediction.risk_factors %}
⚠️ *Risk Factors:* {{ prediction.risk_factors|join(', ') }}
{% endif %}
💡 *Recommendation:* {{ prediction.recommendation }}
{% endif %}

*Approval Actions:*
✅ /approve_{{ instance_id }} - Approve this request
❌ /reject_{{ instance_id }} - Reject this request
⏸️ /defer_{{ instance_id }} - Defer decision
📋 /info_{{ instance_id }} - Show more information

*Workflow Progress:* {{ completed_steps }}/{{ total_steps }} steps completed
    `);

    // Customer Response Template
    this.jinjaEngine.registerTemplate('customer_response', `
🎫 *Customer Response Required*

*Customer:* {{ workflow.customer_name }}
*Issue ID:* {{ workflow.issue_id }}
*Severity:* {{ workflow.severity|priority_emoji }} {{ workflow.severity|upper }}
*Category:* {{ workflow.category }}

*Issue Description:*
{{ workflow.description }}

*Response Actions:*
✅ /approve_{{ instance_id }} - Respond to customer
❌ /reject_{{ instance_id }} - Escalate to manager
⏸️ /defer_{{ instance_id }} - Request more information

*Response Time:* {{ workflow.response_time_limit }} minutes remaining
    `);

    // Technical Review Template
    this.jinjaEngine.registerTemplate('technical_review', `
🔧 *Technical Review Required*

*Issue:* {{ workflow.title }}
*Customer Impact:* {{ workflow.affected_customers }} customers
*Systems Affected:* {{ workflow.affected_systems|join(', ') }}

*Technical Details:*
{{ workflow.technical_description }}

*Review Actions:*
✅ /approve_{{ instance_id }} - Technical solution approved
❌ /reject_{{ instance_id }} - Requires engineering intervention
📋 /info_{{ instance_id }} - Request more details

*Priority:* {{ workflow.priority|priority_emoji }} {{ workflow.priority|upper }}
    `);

    // HR Approval Template
    this.jinjaEngine.registerTemplate('hr_approval', `
👥 *HR Documentation Review*

*Employee:* {{ workflow.employee_name }}
*Position:* {{ workflow.position }}
*Department:* {{ workflow.department }}
*Start Date:* {{ workflow.start_date|format_date('YYYY-MM-DD') }}

*Documents to Review:*
{% for doc in workflow.documents %}
• {{ doc.name }} - {{ doc.status }}
{% endfor %}

*HR Actions:*
✅ /approve_{{ instance_id }} - Documentation complete
❌ /reject_{{ instance_id }} - Missing documents
📋 /info_{{ instance_id }} - View document details

*Onboarding Progress:* {{ workflow.completion_percentage }}% complete
    `);

    // IT Setup Template
    this.jinjaEngine.registerTemplate('it_setup', `
💻 *IT Setup Required*

*Employee:* {{ workflow.employee_name }}
*Position:* {{ workflow.position }}
*Department:* {{ workflow.department }}

*Equipment Needed:*
{% for item in workflow.equipment %}
• {{ item.name }} - {{ item.urgency|priority_emoji }}
{% endfor %}

*Access Required:*
{% for access in workflow.system_access %}
• {{ access.system }} - {{ access.level }}
{% endfor %}

*IT Actions:*
✅ /complete_{{ instance_id }} - Setup complete
🆘 /help_{{ instance_id }} - Requires additional resources

*Setup Deadline:* {{ workflow.deadline|format_date('YYYY-MM-DD') }}
    `);

    // Security Training Template
    this.jinjaEngine.registerTemplate('security_training', `
🔒 *Security Training Assignment*

*Employee:* {{ workflow.employee_name }}
*Training Courses:*
{% for course in workflow.courses %}
• {{ course.name }} - Due: {{ course.due_date|format_date('YYYY-MM-DD') }}
{% endfor %}

*Security Requirements:*
{% for req in workflow.requirements %}
• {{ req }}
{% endfor %}

*Training Progress:* {{ workflow.completed_courses }}/{{ workflow.total_courses }} courses completed

*Actions:*
📚 /info_{{ instance_id }} - View training materials
✅ /complete_{{ instance_id }} - Mark training complete
    `);

    // Change Request Template
    this.jinjaEngine.registerTemplate('change_request', `
🔄 *Change Request Review*

*Change ID:* {{ workflow.change_id }}
*Title:* {{ workflow.title }}
*Requester:* {{ workflow.requester }}
*Priority:* {{ workflow.priority|priority_emoji }} {{ workflow.priority|upper }}

*Change Description:*
{{ workflow.description }}

*Impact Assessment:*
• Risk Level: {{ workflow.risk_level|priority_emoji }}
• Systems Affected: {{ workflow.affected_systems|join(', ') }}
• Estimated Downtime: {{ workflow.estimated_downtime }}

*Review Actions:*
✅ /approve_{{ instance_id }} - Change approved
❌ /reject_{{ instance_id }} - Change rejected
📋 /info_{{ instance_id }} - Request more details

*Implementation Window:* {{ workflow.implementation_window }}
    `);

    // Approval Decision Template
    this.jinjaEngine.registerTemplate('approval_decision', `
{% if decision == 'approved' %}✅{% else %}❌{% endif %} *Approval Decision Made*

*Request:* {{ workflow.title }}
*Decision:* {{ decision|upper }} {{ decision|emoji_status }}
*Decided by:* {{ decided_by }}
*Comments:* {{ comments|default('No comments provided') }}

*Next Steps:*
{% if decision == 'approved' and next_step %}
➡️ Moving to next step: {{ next_step.name }}
{% elif decision == 'rejected' %}
🛑 Workflow has been rejected
{% endif %}

*Full workflow history available via /workflow_info_{{ instance_id }}*
    `);

    // Workflow Completed Template
    this.jinjaEngine.registerTemplate('workflow_completed', `
🎉 *Workflow Completed Successfully!*

*Title:* {{ workflow.title }}
*Completed by:* {{ completed_by }}
*Total Steps:* {{ total_steps }}
*Time to Complete:* {{ duration }} minutes

*Summary:* All required approvals have been obtained and the workflow is now complete.

*Final Actions:*
📊 /report_{{ instance_id }} - Generate completion report
🔁 /template_{{ workflow.id }} - Use this workflow again
📋 /workflow_history - View similar workflows
    `);
  }

  async registerWorkflow(workflowId: string, steps: WorkflowStep[]): Promise<void> {
    this.workflows.set(workflowId, steps);
    console.log(ColorFormatter.colorize(`✅ Registered workflow: ${workflowId} with ${steps.length} steps`, 'green'));
  }

  async startWorkflow(workflowId: string, initiatedBy: string, data: Record<string, any>): Promise<WorkflowInstance> {
    try {
      const workflowSteps = this.workflows.get(workflowId);
      if (!workflowSteps) {
        const error: WorkflowError = {
          type: 'validation_error',
          message: `Workflow not found: ${workflowId}`,
          details: { workflowId },
          recoverable: false,
          recovery_suggestions: ['Check workflow ID spelling', 'Verify workflow exists in registry'],
          occurred_at: new Date(),
          instance_id: 'pre-creation',
          step_id: undefined
        };
        await this.errorHandler.handleWorkflowError(error, {} as WorkflowInstance);
        throw new Error(error.message);
      }

      const instance: WorkflowInstance = {
        id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        currentStep: workflowSteps[0].id,
        status: 'in_progress',
        createdBy: initiatedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        data,
        approvals: new Map()
      };

      // Create Telegram topic for this workflow instance
      const topic = await this.telegramManager.createTopic({
        title: `🔄 ${data.title || workflowId} - ${this.getStatusEmoji(instance.status)}`,
        description: `Workflow instance ${instance.id} - Started by ${initiatedBy}`,
        type: 'workflow',
        metadata: { instanceId: instance.id }
      });

      instance.topicId = topic.id;

      // Pin workflow information
      const pinnedMessage = await this.telegramManager.pinMessage(
        topic.id,
        this.generateWorkflowSummary(instance)
      );

      instance.pinnedMessageId = pinnedMessage.message_id;
      this.instances.set(instance.id, instance);

      // Update analytics
      this.analytics.updateWorkflowData(Array.from(this.instances.values()), this.workflows);

      // Start the first step
      await this.advanceToStep(instance.id, workflowSteps[0].id);

      // Log audit event for workflow creation
      await this.auditTrail.logAuditEvent({
        id: '',
        timestamp: new Date(),
        event_type: 'workflow_created',
        user_id: initiatedBy,
        workflow_id: workflowId,
        instance_id: instance.id,
        action: 'create_workflow',
        details: {
          workflow_data: data,
          initial_step: workflowSteps[0].id
        }
      });

      console.log(ColorFormatter.colorize(`🚀 Started workflow instance: ${instance.id}`, 'blue'));
      return instance;
    } catch (error) {
      const workflowError: WorkflowError = {
        type: 'system_error',
        message: `Failed to start workflow: ${error.message}`,
        details: { error: error.message, workflowId, initiatedBy },
        recoverable: true,
        recovery_suggestions: ['Retry workflow creation', 'Check system status'],
        occurred_at: new Date(),
        instance_id: 'pre-creation',
        step_id: undefined
      };
      await this.errorHandler.handleWorkflowError(workflowError, {} as WorkflowInstance);
      throw error;
    }
  }

  private async advanceToStep(instanceId: string, stepId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const workflowSteps = this.workflows.get(instance.workflowId);
    if (!workflowSteps) return;

    const step = workflowSteps.find(s => s.id === stepId);
    if (!step) return;

    // Check step conditions before executing
    if (step.conditions && step.conditions.length > 0) {
      const conditionsMet = this.conditionalEngine.evaluateConditions(step.conditions, instance.data);
      if (!conditionsMet) {
        console.log(ColorFormatter.colorize(`⏭️ Skipping step ${stepId} - conditions not met`, 'yellow'));

        // Move to next step or complete workflow
        const currentIndex = workflowSteps.findIndex(s => s.id === stepId);
        const nextStep = workflowSteps[currentIndex + 1];

        if (nextStep) {
          await this.advanceToStep(instanceId, nextStep.id);
        } else {
          await this.completeWorkflow(instanceId, 'system', 'All steps completed (some skipped)');
        }
        return;
      }
    }

    instance.currentStep = stepId;
    instance.updatedAt = new Date();

    // Update pinned message
    await this.updateWorkflowSummary(instance);

    // Handle step based on type
    try {
      switch (step.type) {
        case 'approval':
          await this.handleApprovalStep(instance, step);
          break;
        case 'notification':
          await this.handleNotificationStep(instance, step);
          break;
        case 'task':
          await this.handleTaskStep(instance, step);
          break;
        case 'decision':
          await this.handleDecisionStep(instance, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      const workflowError: WorkflowError = {
        type: 'system_error',
        message: `Failed to execute step ${stepId}: ${error.message}`,
        details: { error: error.message, stepId, stepType: step.type },
        recoverable: true,
        recovery_suggestions: ['Retry step execution', 'Check step configuration', 'Contact system administrator'],
        occurred_at: new Date(),
        instance_id: instanceId,
        step_id: stepId
      };
      await this.errorHandler.handleWorkflowError(workflowError, instance);
    }

    // Set timeout if specified
    if (step.timeout) {
      this.setStepTimeout(instanceId, stepId, step.timeout);
    }
  }

  private async handleApprovalStep(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    // First, attempt auto-approval for low-risk workflows
    const autoApproved = await this.attemptAutoApproval(instance.id, step.id);
    if (autoApproved) {
      console.log(ColorFormatter.colorize(`🤖 Auto-approved step ${step.id} for workflow ${instance.id}`, 'green'));
      return;
    }

    // Get AI prediction for the first assignee
    const prediction = await this.predictiveEngine.predictApprovalLikelihood(
      instance.data,
      step,
      step.assignees[0]
    );

    const message = this.jinjaEngine.render('approval_request', {
      workflow: instance.data,
      current_step: step,
      instance_id: instance.id,
      completed_steps: this.getCompletedStepCount(instance),
      total_steps: this.workflows.get(instance.workflowId)?.length || 0,
      prediction: prediction
    });

    // Send approval request to all assignees
    for (const assignee of step.assignees) {
      await this.telegramManager.sendMessage(
        instance.topicId!,
        `👤 ${assignee}\n${message}`,
        undefined,
        this.generateApprovalKeyboard(instance.id)
      );

      // Also send direct message if user is available
      await this.telegramManager.sendDirectMessage(
        assignee,
        `🔔 Approval required in workflow: ${instance.data.title}\n\n${message}`
      );
    }
  }

  private async handleNotificationStep(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const notificationMessage = `📢 ${step.name}\n\n${instance.data.description || 'No additional details'}`;

    for (const assignee of step.assignees) {
      await this.telegramManager.sendMessage(
        instance.topicId!,
        `👤 ${assignee}\n${notificationMessage}`
      );
    }

    // Auto-advance after notification
    await this.completeStep(instance.id, step.id, 'system', 'Notification sent');
  }

  private async handleDecisionStep(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    // Decision steps automatically evaluate conditions and route accordingly
    // This is handled by the conditional logic in advanceToStep
    await this.completeStep(instance.id, step.id, 'system', 'Decision evaluated');
  }

  private async completeWorkflow(instanceId: string, completedBy: string, reason?: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    instance.status = 'completed';
    instance.updatedAt = new Date();

    const workflowSteps = this.workflows.get(instance.workflowId) || [];
    const completionMessage = this.jinjaEngine.render('workflow_completed', {
      workflow: instance.data,
      completed_by: completedBy,
      total_steps: workflowSteps.length,
      duration: Math.round((instance.updatedAt.getTime() - instance.createdAt.getTime()) / 60000),
      reason: reason || 'All required steps completed'
    });

    if (instance.topicId) {
      await this.telegramManager.sendMessage(instance.topicId, completionMessage);
      await this.updateWorkflowSummary(instance);
    }

    // Generate completion analytics report
    await this.analytics.generateWorkflowReport(instanceId);

    console.log(ColorFormatter.colorize(`🎉 Workflow completed: ${instanceId}`, 'green'));
  }

  async handleApproval(instanceId: string, stepId: string, approver: string, decision: 'approved' | 'rejected', comments?: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error('Instance not found');

    const approval: WorkflowApproval = {
      stepId,
      approver,
      status: decision,
      comments,
      decidedAt: new Date()
    };

    instance.approvals.set(`${stepId}-${approver}`, approval);
    instance.updatedAt = new Date();

    // Log audit event for approval decision
    await this.auditTrail.logAuditEvent({
      id: '',
      timestamp: new Date(),
      event_type: decision === 'approved' ? 'approval_granted' : 'approval_denied',
      user_id: approver,
      workflow_id: instance.workflowId,
      instance_id: instanceId,
      step_id: stepId,
      action: decision,
      details: {
        decision,
        comments,
        step_id: stepId,
        workflow_data: instance.data
      }
    });

    // Clear timeout for this step
    this.clearStepTimeout(instanceId, stepId);

    // Send decision notification
    const decisionMessage = this.jinjaEngine.render('approval_decision', {
      workflow: instance.data,
      decision,
      decided_by: approver,
      comments,
      instance_id: instanceId,
      next_step: this.getNextStep(instance, stepId)
    });

    await this.telegramManager.sendMessage(instance.topicId!, decisionMessage);

    // Check if all required approvals for this step are obtained
    if (await this.isStepComplete(instance, stepId)) {
      await this.completeStep(instanceId, stepId, approver, comments);
    } else {
      await this.updateWorkflowSummary(instance);
    }
  }

  // New method to attempt auto-approval for low-risk workflows
  async attemptAutoApproval(instanceId: string, stepId: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    const workflowSteps = this.workflows.get(instance.workflowId);
    if (!workflowSteps) return false;

    const step = workflowSteps.find(s => s.id === stepId);
    if (!step || step.type !== 'approval') return false;

    // Only attempt auto-approval if enabled and step allows it
    if (!instance.data.enable_auto_approval) return false;

    return await this.predictiveEngine.autoApproveLowRisk(instance, step);
  }

  private async completeStep(instanceId: string, stepId: string, completedBy: string, comments?: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const workflowSteps = this.workflows.get(instance.workflowId);
    if (!workflowSteps) return;

    const currentStepIndex = workflowSteps.findIndex(s => s.id === stepId);
    const nextStep = workflowSteps[currentStepIndex + 1];

    if (nextStep) {
      // Move to next step
      await this.advanceToStep(instanceId, nextStep.id);
    } else {
      // Workflow completed
      await this.completeWorkflow(instanceId, completedBy, comments);
    }
  }

  private generateApprovalKeyboard(instanceId: string): any {
    return {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `approve_${instanceId}` },
          { text: '❌ Reject', callback_data: `reject_${instanceId}` }
        ],
        [
          { text: '⏸️ Defer', callback_data: `defer_${instanceId}` },
          { text: '📋 Info', callback_data: `info_${instanceId}` }
        ]
      ]
    };
  }

  private generateTaskKeyboard(instanceId: string): any {
    return {
      inline_keyboard: [
        [
          { text: '✅ Mark Complete', callback_data: `complete_${instanceId}` },
          { text: '🆘 Need Help', callback_data: `help_${instanceId}` }
        ]
      ]
    };
  }

  private generateWorkflowSummary(instance: WorkflowInstance): string {
    const workflowSteps = this.workflows.get(instance.workflowId) || [];
    const currentStep = workflowSteps.find(s => s.id === instance.currentStep);
    const completedSteps = this.getCompletedStepCount(instance);

    return [
      ColorFormatter.colorize('🔄 Workflow Instance', 'cyan'),
      `🎯 ID: ${instance.id}`,
      `📋 Workflow: ${instance.workflowId}`,
      `👤 Created by: ${instance.createdBy}`,
      `📅 Started: ${instance.createdAt.toLocaleString()}`,
      `🔄 Status: ${instance.status.toUpperCase()} ${this.getStatusEmoji(instance.status)}`,
      `📊 Progress: ${completedSteps}/${workflowSteps.length} steps`,
      `📍 Current Step: ${currentStep?.name || 'Unknown'}`,
      `⏱️ Last Updated: ${instance.updatedAt.toLocaleString()}`,
      '',
      ColorFormatter.colorize('Use workflow commands to interact with this instance', 'yellow')
    ].join('\n');
  }

  private async updateWorkflowSummary(instance: WorkflowInstance): Promise<void> {
    if (!instance.pinnedMessageId || !instance.topicId) return;

    const summary = this.generateWorkflowSummary(instance);
    await this.telegramManager.editMessage(instance.topicId, instance.pinnedMessageId, summary);
  }

  private getCompletedStepCount(instance: WorkflowInstance): number {
    const workflowSteps = this.workflows.get(instance.workflowId) || [];
    const currentStepIndex = workflowSteps.findIndex(s => s.id === instance.currentStep);
    return currentStepIndex;
  }

  private getNextStep(instance: WorkflowInstance, currentStepId: string): WorkflowStep | null {
    const workflowSteps = this.workflows.get(instance.workflowId) || [];
    const currentIndex = workflowSteps.findIndex(s => s.id === currentStepId);
    return workflowSteps[currentIndex + 1] || null;
  }

  private async isStepComplete(instance: WorkflowInstance, stepId: string): Promise<boolean> {
    const step = this.workflows.get(instance.workflowId)?.find(s => s.id === stepId);
    if (!step) return false;

    // For approval steps, check if all required approvals are obtained
    if (step.type === 'approval') {
      const stepApprovals = Array.from(instance.approvals.values())
        .filter(approval => approval.stepId === stepId);

      const approvedCount = stepApprovals.filter(a => a.status === 'approved').length;
      const rejectedCount = stepApprovals.filter(a => a.status === 'rejected').length;

      // If any rejection, step fails
      if (rejectedCount > 0) {
        instance.status = 'rejected';
        return true;
      }

      // If all required approvers have approved
      return approvedCount >= step.assignees.length;
    }

    return true;
  }

  private setStepTimeout(instanceId: string, stepId: string, timeoutMinutes: number): void {
    const timeoutKey = `${instanceId}-${stepId}`;

    const timeout = setTimeout(async () => {
      const instance = this.instances.get(instanceId);
      if (instance && instance.currentStep === stepId) {
        console.log(ColorFormatter.colorize(`⏰ Step timeout: ${instanceId} - ${stepId}`, 'yellow'));

        // Check if this workflow should be escalated
        const shouldEscalate = this.shouldEscalateWorkflow(instance, timeoutMinutes);

        if (shouldEscalate) {
          await this.escalationEngine.escalateWorkflow(instanceId, 1);
        } else {
          // Fallback to auto-rejection for non-critical workflows
          await this.telegramManager.sendMessage(
            instance.topicId!,
            `⏰ Step timeout after ${timeoutMinutes} minutes. Auto-rejecting.`
          );

          await this.handleApproval(instanceId, stepId, 'system', 'rejected', 'Step timeout');
        }
      }

      this.timeouts.delete(timeoutKey);
    }, timeoutMinutes * 60 * 1000);

    this.timeouts.set(timeoutKey, timeout);
  }

  private clearStepTimeout(instanceId: string, stepId: string): void {
    const timeoutKey = `${instanceId}-${stepId}`;
    const timeout = this.timeouts.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(timeoutKey);
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '⚪';
    }
  }

  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  getWorkflowInstancesByUser(userId: string): WorkflowInstance[] {
    return Array.from(this.instances.values()).filter(instance =>
      instance.createdBy === userId ||
      Array.from(instance.approvals.values()).some(approval => approval.approver === userId)
    );
  }

  // Public method to get workflow steps (used by escalation engine)
  getWorkflowSteps(workflowId: string): WorkflowStep[] | undefined {
    return this.workflows.get(workflowId);
  }

  // Determine if a workflow should be escalated based on its characteristics
  private shouldEscalateWorkflow(instance: WorkflowInstance, timeoutMinutes: number): boolean {
    // Escalate if:
    // 1. Priority is critical or emergency
    if (instance.data.priority === 'critical' || instance.data.priority === 'emergency') {
      return true;
    }

    // 2. High financial impact
    if (instance.data.financial_impact && instance.data.financial_impact > 10000) {
      return true;
    }

    // 3. Security-related changes
    if (instance.data.contains_security_changes) {
      return true;
    }

    // 4. Large number of affected users
    if (instance.data.affected_users && instance.data.affected_users > 100) {
      return true;
    }

    // 5. Regulatory compliance requirements
    if (instance.data.regulatory_compliance) {
      return true;
    }

    // 6. System downtime or incident response
    if (instance.data.incident_type || instance.data.system_down) {
      return true;
    }

    return false;
  }

  // Public method to trigger escalation (for external triggers)
  async triggerEscalation(instanceId: string, reason?: string): Promise<void> {
    console.log(ColorFormatter.colorize(
      `🚨 Manual escalation triggered for ${instanceId}: ${reason || 'No reason provided'}`,
      'red'
    ));

    await this.escalationEngine.escalateWorkflow(instanceId, 1);
  }

  // Get escalation history for a workflow
  getEscalationHistory(instanceId: string): any[] {
    return this.escalationEngine.getEscalationHistory(instanceId);
  }

  // Analytics methods
  async getWorkflowReport(instanceId: string): Promise<WorkflowReport | null> {
    return await this.analytics.generateWorkflowReport(instanceId);
  }

  async getSystemAnalytics(timeRangeHours: number = 24): Promise<any> {
    return await this.analytics.generateSystemMetrics(timeRangeHours);
  }

  async getAnalyticsReport(timeRangeHours: number = 24): Promise<string> {
    return await this.analytics.generateAnalyticsReport(timeRangeHours);
  }

  // Error handling methods
  async handleWorkflowError(error: WorkflowError, instance?: WorkflowInstance): Promise<void> {
    await this.errorHandler.handleWorkflowError(error, instance || {} as WorkflowInstance);
  }

  async retryWorkflowStep(instanceId: string, stepId: string, userId: string): Promise<void> {
    await this.errorHandler.handleRetry(instanceId, userId);
    // Re-execute the step
    await this.advanceToStep(instanceId, stepId);
  }

  async skipWorkflowStep(instanceId: string, stepId: string, userId: string): Promise<void> {
    await this.errorHandler.handleSkip(instanceId, userId);
    // Skip to next step
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const workflowSteps = this.workflows.get(instance.workflowId);
    if (!workflowSteps) return;

    const currentIndex = workflowSteps.findIndex(s => s.id === stepId);
    const nextStep = workflowSteps[currentIndex + 1];

    if (nextStep) {
      await this.advanceToStep(instanceId, nextStep.id);
    } else {
      await this.completeWorkflow(instanceId, userId, 'Step skipped');
    }
  }
}
