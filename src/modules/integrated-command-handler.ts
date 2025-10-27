import { TelegramManager } from './telegram-manager';
import { GitHubManager } from './github-manager';
import { CustomerServiceManager } from './customer-service-manager';
import { WorkflowManager } from './workflow-manager';
import { StateManager } from './state-manager';
import { ANSIColors } from '../utils/ansi-colors';

export class IntegratedCommandHandler {
  private telegramManager: TelegramManager;
  private githubManager: GitHubManager;
  private customerServiceManager: CustomerServiceManager;
  private workflowManager: WorkflowManager;
  private stateManager: StateManager;

  constructor(
    telegramManager: TelegramManager,
    githubManager: GitHubManager,
    customerServiceManager: CustomerServiceManager,
    workflowManager: WorkflowManager,
    stateManager: StateManager
  ) {
    this.telegramManager = telegramManager;
    this.githubManager = githubManager;
    this.customerServiceManager = customerServiceManager;
    this.workflowManager = workflowManager;
    this.stateManager = stateManager;

    this.registerCommands();
  }

  private registerCommands(): void {
    // Workflow Commands
    this.telegramManager.registerCommand('start_workflow', this.handleStartWorkflow.bind(this));
    this.telegramManager.registerCommand('approve', this.handleApprove.bind(this));
    this.telegramManager.registerCommand('reject', this.handleReject.bind(this));
    this.telegramManager.registerCommand('workflow_info', this.handleWorkflowInfo.bind(this));

    // GitHub Commands
    this.telegramManager.registerCommand('pr_review', this.handlePRReview.bind(this));
    this.telegramManager.registerCommand('pr_status', this.handlePRStatus.bind(this));

    // Customer Service Commands
    this.telegramManager.registerCommand('cs_assign', this.handleCSAssign.bind(this));
    this.telegramManager.registerCommand('cs_escalate', this.handleCSEscalate.bind(this));

    // State Management Commands
    this.telegramManager.registerCommand('state_update', this.handleStateUpdate.bind(this));

    // Callback handlers for inline keyboards
    this.telegramManager.registerCallbackQuery(/approve_(.+)/, this.handleInlineApprove.bind(this));
    this.telegramManager.registerCallbackQuery(/reject_(.+)/, this.handleInlineReject.bind(this));
    this.telegramManager.registerCallbackQuery(/complete_(.+)/, this.handleInlineComplete.bind(this));
    this.telegramManager.registerCallbackQuery(/retry_workflow_(.+)/, this.handleInlineRetryWorkflow.bind(this));
    this.telegramManager.registerCallbackQuery(/skip_step_(.+)/, this.handleInlineSkipStep.bind(this));
    this.telegramManager.registerCallbackQuery(/cancel_workflow_(.+)/, this.handleInlineCancelWorkflow.bind(this));
    this.telegramManager.registerCallbackQuery(/escalate_error_(.+)/, this.handleInlineEscalateError.bind(this));
  }

  private async handleStartWorkflow(ctx: any, args: string[]): Promise<void> {
    const [workflowId, ...rest] = args;
    const initiatedBy = ctx.from.username || ctx.from.id.toString();

    try {
      // Parse workflow data from arguments or use defaults
      const workflowData = this.parseWorkflowData(rest);

      const instance = await this.workflowManager.startWorkflow(
        workflowId,
        initiatedBy,
        workflowData
      );

      await ctx.reply(
        `🚀 Workflow started successfully!\n\n` +
        `Instance ID: ${instance.id}\n` +
        `Topic: #workflow-${instance.id}\n` +
        `Use /workflow_info ${instance.id} for details`
      );
    } catch (error) {
      await ctx.reply(`❌ Failed to start workflow: ${error.message}`);
    }
  }

  private async handleApprove(ctx: any, args: string[]): Promise<void> {
    const [instanceId, ...commentParts] = args;
    const approver = ctx.from.username || ctx.from.id.toString();
    const comments = commentParts.join(' ');

    try {
      await this.workflowManager.handleApproval(
        instanceId,
        'current', // This would need to be determined from the instance
        approver,
        'approved',
        comments
      );

      await ctx.reply(`✅ Approval submitted for workflow ${instanceId}`);
    } catch (error) {
      await ctx.reply(`❌ Approval failed: ${error.message}`);
    }
  }

  private async handleInlineApprove(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const approver = ctx.from.username || ctx.from.id.toString();

    try {
      await this.workflowManager.handleApproval(
        instanceId,
        'current',
        approver,
        'approved'
      );

      await ctx.answerCallbackQuery('✅ Approval submitted');
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Approval failed');
    }
  }

  private async handleInlineReject(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const approver = ctx.from.username || ctx.from.id.toString();

    try {
      await ctx.reply('Please provide a reason for rejection:');
      // This would need a conversation flow to capture the reason
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Rejection failed');
    }
  }

  private async handleInlineComplete(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const user = ctx.from.username || ctx.from.id.toString();

    try {
      // Mark task as complete
      await ctx.answerCallbackQuery('✅ Task marked as complete');
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Completion failed');
    }
  }

  private async handleWorkflowInfo(ctx: any, args: string[]): Promise<void> {
    const [instanceId] = args;

    try {
      const instance = this.workflowManager.getWorkflowInstance(instanceId);
      if (!instance) {
        await ctx.reply('❌ Workflow instance not found');
        return;
      }

      const info = this.formatWorkflowInfo(instance);
      await ctx.reply(info, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.reply(`❌ Failed to get workflow info: ${error.message}`);
    }
  }

  private async handlePRReview(ctx: any, args: string[]): Promise<void> {
    const [prNumber, ...reviewers] = args;

    try {
      await this.githubManager.requestCodeReview(parseInt(prNumber), reviewers);
      await ctx.reply(`🔍 Code review requested for PR #${prNumber}`);
    } catch (error) {
      await ctx.reply(`❌ Failed to request code review: ${error.message}`);
    }
  }

  private async handleCSAssign(ctx: any, args: string[]): Promise<void> {
    const [sessionId] = args;
    const agentId = ctx.from.username || ctx.from.id.toString();

    try {
      await this.customerServiceManager.assignAgent(sessionId, agentId);
      await ctx.reply(`👤 Assigned to customer session ${sessionId}`);
    } catch (error) {
      await ctx.reply(`❌ Failed to assign session: ${error.message}`);
    }
  }

  private async handleStateUpdate(ctx: any, args: string[]): Promise<void> {
    const [systemId, component, status, ...descriptionParts] = args;
    const description = descriptionParts.join(' ');

    try {
      await this.stateManager.updateComponentState(
        systemId,
        component,
        status as any,
        description
      );
      await ctx.reply(`🔄 Updated ${systemId} - ${component} to ${status}`);
    } catch (error) {
      await ctx.reply(`❌ Failed to update state: ${error.message}`);
    }
  }

  private parseWorkflowData(args: string[]): Record<string, any> {
    // Simple parsing of key=value pairs
    const data: Record<string, any> = {};

    for (const arg of args) {
      const [key, value] = arg.split('=');
      if (key && value) {
        data[key] = value;
      }
    }

    // Set defaults
    if (!data.title) data.title = 'Untitled Workflow';
    if (!data.priority) data.priority = 'medium';
    if (!data.deadline) data.deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return data;
  }

  private formatWorkflowInfo(instance: any): string {
    return [
      `*Workflow Instance: ${instance.id}*`,
      `*Status:* ${instance.status}`,
      `*Current Step:* ${instance.currentStep}`,
      `*Created:* ${instance.createdAt.toLocaleString()}`,
      `*Updated:* ${instance.updatedAt.toLocaleString()}`,
      '',
      '*Approvals:*',
      ...Array.from(instance.approvals.values()).map(approval =>
        `- ${approval.approver}: ${approval.status}`
      )
    ].join('\n');
  }

  private async handleInlineRetryWorkflow(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const user = ctx.from.username || ctx.from.id.toString();

    try {
      const instance = this.workflowManager.getWorkflowInstance(instanceId);
      if (!instance) {
        await ctx.answerCallbackQuery('❌ Workflow instance not found');
        return;
      }

      // Retry the current step
      await this.workflowManager.retryWorkflowStep(instanceId, instance.currentStep, user);
      await ctx.answerCallbackQuery('🔄 Workflow step retry initiated');
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Failed to retry workflow step');
    }
  }

  private async handleInlineSkipStep(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const user = ctx.from.username || ctx.from.id.toString();

    try {
      const instance = this.workflowManager.getWorkflowInstance(instanceId);
      if (!instance) {
        await ctx.answerCallbackQuery('❌ Workflow instance not found');
        return;
      }

      // Skip the current step
      await this.workflowManager.skipWorkflowStep(instanceId, instance.currentStep, user);
      await ctx.answerCallbackQuery('⏭️ Workflow step skipped');
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Failed to skip workflow step');
    }
  }

  private async handleInlineCancelWorkflow(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const user = ctx.from.username || ctx.from.id.toString();

    try {
      const instance = this.workflowManager.getWorkflowInstance(instanceId);
      if (!instance) {
        await ctx.answerCallbackQuery('❌ Workflow instance not found');
        return;
      }

      // Cancel the workflow
      instance.status = 'cancelled';
      instance.updatedAt = new Date();
      
      // Notify the workflow topic
      if (instance.topicId) {
        await this.telegramManager.sendMessage(
          instance.topicId,
          `🚫 *Workflow Cancelled*\n\nInstance: ${instanceId}\nCancelled by: ${user}\nTime: ${new Date().toLocaleString()}`
        );
      }

      await ctx.answerCallbackQuery('🚫 Workflow cancelled');
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Failed to cancel workflow');
    }
  }

  private async handleInlineEscalateError(ctx: any, match: RegExpMatchArray): Promise<void> {
    const instanceId = match[1];
    const user = ctx.from.username || ctx.from.id.toString();

    try {
      const instance = this.workflowManager.getWorkflowInstance(instanceId);
      if (!instance) {
        await ctx.answerCallbackQuery('❌ Workflow instance not found');
        return;
      }

      // Escalate the workflow error
      await this.workflowManager.triggerEscalation(instanceId, `Manual escalation by ${user}`);
      
      // Notify the workflow topic
      if (instance.topicId) {
        await this.telegramManager.sendMessage(
          instance.topicId,
          `🚨 *Workflow Error Escalated*\n\nInstance: ${instanceId}\nEscalated by: ${user}\nTime: ${new Date().toLocaleString()}\n\nAdministrators have been notified and will review the issue.`
        );
      }

      await ctx.answerCallbackQuery('🚨 Workflow escalated to administrators');
    } catch (error) {
      await ctx.answerCallbackQuery('❌ Failed to escalate workflow');
    }
  }
}
