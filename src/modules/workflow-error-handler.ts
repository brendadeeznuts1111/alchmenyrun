// src/modules/workflow-error-handler.ts - Workflow error handling implementation
import { JinjaEngine } from './jinja-engine';
import { TelegramManager } from './telegram-manager';
import { WorkflowManager } from './workflow-manager';
import { WorkflowInstance } from '../types/workflow';

export interface WorkflowError {
  type: 'validation_error' | 'timeout_error' | 'approval_error' | 'system_error' | 'network_error';
  message: string;
  details?: any;
  recoverable: boolean;
  recovery_suggestions: string[];
  occurred_at: Date;
  instance_id: string;
  step_id?: string;
}

export interface WorkflowErrorHandler {
  handleWorkflowError(error: WorkflowError, instance: WorkflowInstance): Promise<void>;
  generateErrorRecoveryKeyboard(instanceId: string): any;
  logWorkflowError(error: WorkflowError, instance: WorkflowInstance): Promise<void>;
  getRecoverySuggestions(error: WorkflowError): string[];
}

export class WorkflowErrorHandlerImpl implements WorkflowErrorHandler {
  private jinjaEngine: JinjaEngine;
  private telegramManager: TelegramManager;
  private workflowManager?: WorkflowManager; // Optional reference to workflow manager

  constructor(jinjaEngine: JinjaEngine, telegramManager: TelegramManager, workflowManager?: WorkflowManager) {
    this.jinjaEngine = jinjaEngine;
    this.telegramManager = telegramManager;
    this.workflowManager = workflowManager;
    this.registerErrorTemplates();
  }

  private registerErrorTemplates(): void {
    // Error notification template
    this.jinjaEngine.registerTemplate('workflow_error', `
🚨 *Workflow Error Occurred*

*Error Type:* {{ error_type|upper|replace('_', ' ') }}
*Message:* {{ error_message }}
*Instance:* {{ instance_id }}
*Step:* {{ step_id|default('N/A') }}
*Time:* {{ occurred_at|format_date('YYYY-MM-DD HH:mm:ss') }}

{% if recovery_suggestions %}
🔧 *Recovery Suggestions:*
{% for suggestion in recovery_suggestions %}
• {{ suggestion }}
{% endfor %}
{% endif %}

*Error Details:*
{{ details|default('No additional details available') }}

*Recovery Actions:*
{% if recoverable %}
✅ /retry_workflow_{{ instance_id }} - Retry the failed operation
⏭️ /skip_step_{{ instance_id }} - Skip this step and continue
👥 /escalate_error_{{ instance_id }} - Escalate to administrators
{% else %}
🛑 /cancel_workflow_{{ instance_id }} - Cancel workflow (unrecoverable)
📋 /info_{{ instance_id }} - Get more information
{% endif %}
    `);

    // Recovery success template
    this.jinjaEngine.registerTemplate('error_recovery_success', `
✅ *Error Recovery Successful*

*Instance:* {{ instance_id }}
*Action:* {{ recovery_action }}
*Recovered by:* {{ recovered_by }}
*Time:* {{ recovered_at|format_date('YYYY-MM-DD HH:mm:ss') }}

The workflow has been successfully recovered and will continue processing.
    `);

    // Escalation template
    this.jinjaEngine.registerTemplate('error_escalation', `
🚨 *Workflow Error Escalation*

*Instance:* {{ instance_id }}
*Error:* {{ error_message }}
*Escalated by:* {{ escalated_by }}
*Time:* {{ escalated_at|format_date('YYYY-MM-DD HH:mm:ss') }}

*Administrators Notified:*
{% for admin in administrators %}
👤 {{ admin }}
{% endfor %}

The workflow is currently paused pending administrative review.
    `);
  }

  async handleWorkflowError(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
    try {
      const errorTemplate = this.jinjaEngine.render('workflow_error', {
        error_type: error.type,
        error_message: error.message,
        instance_id: error.instance_id,
        step_id: error.step_id,
        occurred_at: error.occurred_at,
        recovery_suggestions: error.recovery_suggestions,
        details: error.details ? JSON.stringify(error.details, null, 2) : undefined,
        recoverable: error.recoverable
      });

      // Send error notification to workflow topic
      if (instance.topicId) {
        await this.telegramManager.sendMessage(
          instance.topicId,
          errorTemplate,
          { parse_mode: 'Markdown' },
          this.generateErrorRecoveryKeyboard(error.instance_id, error.recoverable)
        );
      }

      // Send critical errors to administrators
      if (this.isCriticalError(error)) {
        await this.escalateToAdministrators(error, instance);
      }

      // Log the error
      await this.logWorkflowError(error, instance);

      // Update workflow status
      instance.status = error.recoverable ? 'pending' : 'cancelled';
      instance.updatedAt = new Date();

    } catch (handlingError) {
      console.error('Failed to handle workflow error:', handlingError);
      // Fallback error handling
      await this.fallbackErrorHandling(error, instance);
    }
  }

  generateErrorRecoveryKeyboard(instanceId: string, recoverable: boolean): any {
    const keyboard = {
      inline_keyboard: []
    };

    if (recoverable) {
      keyboard.inline_keyboard.push([
        { text: '🔄 Retry Step', callback_data: `retry_workflow_${instanceId}` },
        { text: '⏭️ Skip Step', callback_data: `skip_step_${instanceId}` }
      ]);
      keyboard.inline_keyboard.push([
        { text: '👥 Escalate', callback_data: `escalate_error_${instanceId}` },
        { text: '📋 Info', callback_data: `info_${instanceId}` }
      ]);
    } else {
      keyboard.inline_keyboard.push([
        { text: '🛑 Cancel Workflow', callback_data: `cancel_workflow_${instanceId}` },
        { text: '📋 Info', callback_data: `info_${instanceId}` }
      ]);
    }

    return keyboard;
  }

  async logWorkflowError(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      error,
      instance: {
        id: instance.id,
        workflowId: instance.workflowId,
        currentStep: instance.currentStep,
        status: instance.status,
        createdBy: instance.createdBy
      },
      severity: this.getErrorSeverity(error)
    };

    // Log to console with appropriate color coding
    const color = this.getSeverityColor(logEntry.severity);
    console.log(`[${color}] WORKFLOW ERROR: ${error.type} - ${error.message} [${error.instance_id}]`);

    // TODO: Implement persistent logging to database/monitoring system
    // await this.errorLogStorage.save(logEntry);
  }

  getRecoverySuggestions(error: WorkflowError): string[] {
    const suggestions: string[] = [];

    switch (error.type) {
      case 'timeout_error':
        suggestions.push('Check if assignees are available and reachable');
        suggestions.push('Consider extending timeout duration');
        suggestions.push('Review assignee workload and redistribute if needed');
        break;

      case 'approval_error':
        suggestions.push('Verify approval criteria and requirements');
        suggestions.push('Contact assignees for clarification');
        suggestions.push('Review workflow step configuration');
        break;

      case 'validation_error':
        suggestions.push('Check input data format and completeness');
        suggestions.push('Review validation rules and constraints');
        suggestions.push('Contact data provider for corrections');
        break;

      case 'network_error':
        suggestions.push('Check network connectivity');
        suggestions.push('Retry the operation after network issues are resolved');
        suggestions.push('Consider using alternative communication channels');
        break;

      case 'system_error':
        suggestions.push('Check system status and health');
        suggestions.push('Review system logs for additional context');
        suggestions.push('Contact system administrators');
        break;

      default:
        suggestions.push('Review error details and system logs');
        suggestions.push('Contact system administrators for assistance');
    }

    return suggestions;
  }

  private isCriticalError(error: WorkflowError): boolean {
    return error.type === 'system_error' ||
           (error.type === 'timeout_error' && !error.recoverable) ||
           error.message.toLowerCase().includes('critical');
  }

  private async escalateToAdministrators(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
    const administrators = process.env.ADMINISTRATORS?.split(',') || ['admin'];

    const escalationMessage = this.jinjaEngine.render('error_escalation', {
      instance_id: error.instance_id,
      error_message: error.message,
      escalated_by: 'system',
      escalated_at: new Date(),
      administrators
    });

    // Send to admin group/channel
    const adminChannel = process.env.ADMIN_CHANNEL;
    if (adminChannel) {
      await this.telegramManager.sendMessage(adminChannel, escalationMessage, {
        parse_mode: 'Markdown'
      });
    }

    // Send direct messages to administrators
    for (const admin of administrators) {
      try {
        await this.telegramManager.sendDirectMessage(
          admin,
          `🚨 *Critical Workflow Error*\n\n${escalationMessage}`
        );
      } catch (dmError) {
        console.error(`Failed to DM admin ${admin}:`, dmError);
      }
    }
  }

  private getErrorSeverity(error: WorkflowError): 'low' | 'medium' | 'high' | 'critical' {
    if (error.type === 'system_error') return 'critical';
    if (error.type === 'timeout_error' && !error.recoverable) return 'high';
    if (error.type === 'network_error') return 'medium';
    return 'low';
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '\x1b[91mCRITICAL\x1b[0m'; // Bright red
      case 'high': return '\x1b[31mHIGH\x1b[0m'; // Red
      case 'medium': return '\x1b[33mMEDIUM\x1b[0m'; // Yellow
      case 'low': return '\x1b[32mLOW\x1b[0m'; // Green
      default: return '\x1b[37mUNKNOWN\x1b[0m'; // White
    }
  }

  private async fallbackErrorHandling(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
    // Simple fallback when error handling itself fails
    const fallbackMessage = `🚨 WORKFLOW ERROR: ${error.message}\nInstance: ${error.instance_id}`;

    if (instance.topicId) {
      await this.telegramManager.sendMessage(instance.topicId, fallbackMessage);
    }
  }

  // Public methods for recovery actions
  async handleRetry(instanceId: string, userId: string): Promise<void> {
    // Implementation for retry logic
    const successMessage = this.jinjaEngine.render('error_recovery_success', {
      instance_id: instanceId,
      recovery_action: 'retry',
      recovered_by: userId,
      recovered_at: new Date()
    });

    const instance = await this.getWorkflowInstance(instanceId);
    if (instance?.topicId) {
      await this.telegramManager.sendMessage(instance.topicId, successMessage);
    }
  }

  async handleSkip(instanceId: string, userId: string): Promise<void> {
    // Implementation for skip logic
    const successMessage = this.jinjaEngine.render('error_recovery_success', {
      instance_id: instanceId,
      recovery_action: 'skip_step',
      recovered_by: userId,
      recovered_at: new Date()
}

// Log the error
await this.logWorkflowError(error, instance);

// Update workflow status
instance.status = error.recoverable ? 'pending' : 'cancelled';
instance.updatedAt = new Date();

} catch (handlingError) {
  console.error('Failed to handle workflow error:', handlingError);
  // Fallback error handling
  await this.fallbackErrorHandling(error, instance);
}

generateErrorRecoveryKeyboard(instanceId: string, recoverable: boolean): any {
  const keyboard = {
    inline_keyboard: []
  };

  if (recoverable) {
    keyboard.inline_keyboard.push([
      { text: '🔄 Retry Step', callback_data: `retry_workflow_${instanceId}` },
      { text: '⏭️ Skip Step', callback_data: `skip_step_${instanceId}` }
    ]);
    keyboard.inline_keyboard.push([
      { text: '👥 Escalate', callback_data: `escalate_error_${instanceId}` },
      { text: '📋 Info', callback_data: `info_${instanceId}` }
    ]);
  } else {
    keyboard.inline_keyboard.push([
      { text: '🛑 Cancel Workflow', callback_data: `cancel_workflow_${instanceId}` },
      { text: '📋 Info', callback_data: `info_${instanceId}` }
    ]);
  }

  return keyboard;
}

async logWorkflowError(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
  const logEntry = {
    timestamp: new Date(),
    error,
    instance: {
      id: instance.id,
      workflowId: instance.workflowId,
      currentStep: instance.currentStep,
      status: instance.status,
      createdBy: instance.createdBy
    },
    severity: this.getErrorSeverity(error)
  };

  // Log to console with appropriate color coding
  const color = this.getSeverityColor(logEntry.severity);
  console.log(`[${color}] WORKFLOW ERROR: ${error.type} - ${error.message} [${error.instance_id}]`);

  // TODO: Implement persistent logging to database/monitoring system
  // await this.errorLogStorage.save(logEntry);
}

getRecoverySuggestions(error: WorkflowError): string[] {
  const suggestions: string[] = [];

  switch (error.type) {
    case 'timeout_error':
      suggestions.push('Check if assignees are available and reachable');
      suggestions.push('Consider extending timeout duration');
      suggestions.push('Review assignee workload and redistribute if needed');
      break;

    case 'approval_error':
      suggestions.push('Verify approval criteria and requirements');
      suggestions.push('Contact assignees for clarification');
      suggestions.push('Review workflow step configuration');
      break;

    case 'validation_error':
      suggestions.push('Check input data format and completeness');
      suggestions.push('Review validation rules and constraints');
      suggestions.push('Contact data provider for corrections');
      break;

    case 'network_error':
      suggestions.push('Check network connectivity');
      suggestions.push('Retry the operation after network issues are resolved');
      suggestions.push('Consider using alternative communication channels');
      break;

    case 'system_error':
      suggestions.push('Check system status and health');
      suggestions.push('Review system logs for additional context');
      suggestions.push('Contact system administrators');
      break;

    default:
      suggestions.push('Review error details and system logs');
      suggestions.push('Contact system administrators for assistance');
  }

  return suggestions;
}

private isCriticalError(error: WorkflowError): boolean {
  return error.type === 'system_error' ||
         (error.type === 'timeout_error' && !error.recoverable) ||
         error.message.toLowerCase().includes('critical');
}

private async escalateToAdministrators(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
  const administrators = process.env.ADMINISTRATORS?.split(',') || ['admin'];

  const escalationMessage = this.jinjaEngine.render('error_escalation', {
    instance_id: error.instance_id,
    error_message: error.message,
    escalated_by: 'system',
    escalated_at: new Date(),
    administrators
  });

  // Send to admin group/channel
  const adminChannel = process.env.ADMIN_CHANNEL;
  if (adminChannel) {
    await this.telegramManager.sendMessage(adminChannel, escalationMessage, {
      parse_mode: 'Markdown'
    });
  }

  // Send direct messages to administrators
  for (const admin of administrators) {
    try {
      await this.telegramManager.sendDirectMessage(
        admin,
        `🚨 *Critical Workflow Error*\n\n${escalationMessage}`
      );
    } catch (dmError) {
      console.error(`Failed to DM admin ${admin}:`, dmError);
    }
  }
}

private getErrorSeverity(error: WorkflowError): 'low' | 'medium' | 'high' | 'critical' {
  if (error.type === 'system_error') return 'critical';
  if (error.type === 'timeout_error' && !error.recoverable) return 'high';
  if (error.type === 'network_error') return 'medium';
  return 'low';
}

private getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '\x1b[91mCRITICAL\x1b[0m'; // Bright red
    case 'high': return '\x1b[31mHIGH\x1b[0m'; // Red
    case 'medium': return '\x1b[33mMEDIUM\x1b[0m'; // Yellow
    case 'low': return '\x1b[32mLOW\x1b[0m'; // Green
    default: return '\x1b[37mUNKNOWN\x1b[0m'; // White
  }
}

private async fallbackErrorHandling(error: WorkflowError, instance: WorkflowInstance): Promise<void> {
  // Simple fallback when error handling itself fails
  const fallbackMessage = `🚨 WORKFLOW ERROR: ${error.message}\nInstance: ${error.instance_id}`;

  if (instance.topicId) {
    await this.telegramManager.sendMessage(instance.topicId, fallbackMessage);
  }
}

// Public methods for recovery actions
async handleRetry(instanceId: string, userId: string): Promise<void> {
  // Implementation for retry logic
  const successMessage = this.jinjaEngine.render('error_recovery_success', {
    instance_id: instanceId,
    recovery_action: 'retry',
    recovered_by: userId,
    recovered_at: new Date()
  });

  const instance = await this.getWorkflowInstance(instanceId);
  if (instance?.topicId) {
    await this.telegramManager.sendMessage(instance.topicId, successMessage);
  }
}

async handleSkip(instanceId: string, userId: string): Promise<void> {
  // Implementation for skip logic
  const successMessage = this.jinjaEngine.render('error_recovery_success', {
    instance_id: instanceId,
    recovery_action: 'skip_step',
    recovered_by: userId,
    recovered_at: new Date()
  });

  const instance = await this.getWorkflowInstance(instanceId);
  if (instance?.topicId) {
    await this.telegramManager.sendMessage(instance.topicId, successMessage);
  }
}

private async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | undefined> {
  if (this.workflowManager) {
    return this.workflowManager.getWorkflowInstance(instanceId);
  }
  
  // If no workflow manager is available, return undefined
  // In a real implementation, this might query a database
  return undefined;
}
}
