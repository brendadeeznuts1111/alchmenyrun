import { TelegramManager } from './telegram-manager';
import { JinjaEngine } from './jinja-engine';
import { TelegramBotKeyboards } from './telegram-bot-keyboards';
import { WorkflowStep, WorkflowInstance } from '../types/workflow';
import { ColorFormatter } from '../utils/ansi-colors';

export class WorkflowTaskHandler {
  private telegramManager: TelegramManager;
  private jinjaEngine: JinjaEngine;
  private templatesRegistered: boolean = false;
  private enableLogging: boolean = true;

  constructor(telegramManager: TelegramManager, jinjaEngine: JinjaEngine, enableLogging: boolean = true) {
    this.telegramManager = telegramManager;
    this.jinjaEngine = jinjaEngine;
    this.enableLogging = enableLogging;
  }

  async handleTaskStep(instance: WorkflowInstance, step: WorkflowStep, completedSteps?: number, totalSteps?: number): Promise<void> {
    try {
      // Register task-related templates if not already registered
      this.registerTaskTemplates();

      // Determine the appropriate template based on workflow data
      const templateName = this.getTaskTemplateName(instance.data);
      
      // Render the task message
      const message = this.jinjaEngine.render(templateName, {
        workflow: instance.data,
        current_step: step,
        instance_id: instance.id,
        completed_steps: completedSteps || 0,
        total_steps: totalSteps || 1
      });

      // Send task notification to all assignees
      for (const assignee of step.assignees) {
        try {
          await this.telegramManager.sendMessage(
            instance.topicId!,
            `👤 ${assignee}\n${message}`,
            undefined,
            TelegramBotKeyboards.generateTaskKeyboard(instance.id)
          );

          // Also send direct message if user is available
          await this.telegramManager.sendDirectMessage(
            assignee,
            `📋 Task assigned in workflow: ${instance.data.title || instance.id}\n\n${message}`
          );
        } catch (error) {
          console.error(`Failed to send task notification to ${assignee}:`, error);
          // Continue with other assignees even if one fails
        }
      }

      if (this.enableLogging) {
        console.log(ColorFormatter.colorize(`📋 Task step ${step.id} processed for workflow ${instance.id}`, 'blue'));
      }
    } catch (error) {
      console.error(`Error handling task step ${step.id} for workflow ${instance.id}:`, error);
      throw error; // Re-throw for the workflow manager to handle
    }
  }

  private registerTaskTemplates(): void {
    if (this.templatesRegistered) return;

    // Generic Task Template
    this.jinjaEngine.registerTemplate('task_notification', `
📋 *Task Required: {{ workflow.title || 'Untitled Task' }}*

*Description:* {{ workflow.description || 'No description provided' }}
*Priority:* {{ workflow.priority|priority_emoji }} {{ workflow.priority|upper }}
*Assigned by:* {{ workflow.assigned_by || 'System' }}
{% if workflow.deadline %}
*Deadline:* {{ workflow.deadline|format_date('YYYY-MM-DD HH:mm') }}
{% endif %}

*Current Step:* {{ current_step.name }}
*Assignees:* {{ current_step.assignees|join(', ') }}

{% if workflow.estimated_time %}
⏱️ *Estimated Time:* {{ workflow.estimated_time }}
{% endif %}

*Task Actions:*
✅ /complete_{{ instance_id }} - Mark task as complete
🆘 /help_{{ instance_id }} - Request assistance
📋 /info_{{ instance_id }} - Show more information

*Workflow Progress:* {{ completed_steps }}/{{ total_steps }} steps completed
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

{% if workflow.deadline %}
*Setup Deadline:* {{ workflow.deadline|format_date('YYYY-MM-DD') }}
{% endif %}
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

    this.templatesRegistered = true;
    if (this.enableLogging) {
      console.log(ColorFormatter.colorize('✅ Task templates registered', 'green'));
    }
  }

  private getTaskTemplateName(workflowData: any): string {
    // Determine which template to use based on workflow data
    if (workflowData.type === 'it_setup' || workflowData.equipment || workflowData.system_access) {
      return 'it_setup';
    } else if (workflowData.type === 'security_training' || workflowData.courses) {
      return 'security_training';
    } else {
      return 'task_notification';
    }
  }

}
