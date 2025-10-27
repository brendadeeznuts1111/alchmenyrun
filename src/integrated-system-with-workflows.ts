import { TelegramManager } from '../modules/telegram-manager';
import { GitHubManager } from '../modules/github-manager';
import { CustomerServiceManager } from '../modules/customer-service-manager';
import { WorkflowManager } from '../modules/workflow-manager';
import { StateManager } from '../modules/state-manager';
import { BannerScheduler } from '../modules/banner-scheduler';
import { IntegratedCommandHandler } from '../modules/integrated-command-handler';
import { ANSIColors } from '../utils/ansi-colors';
import { WorkflowStep } from '../types/workflow';

export class IntegratedSystemWithWorkflows {
  private telegramManager: TelegramManager;
  private githubManager: GitHubManager;
  private customerServiceManager: CustomerServiceManager;
  private workflowManager: WorkflowManager;
  private stateManager: StateManager;
  private bannerScheduler: BannerScheduler;
  private commandHandler: IntegratedCommandHandler;

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const supergroupId = process.env.TELEGRAM_SUPERGROUP_ID!;
    const githubToken = process.env.GITHUB_TOKEN!;

    this.telegramManager = new TelegramManager(botToken, supergroupId);
    this.githubManager = new GitHubManager(githubToken, this.telegramManager);
    this.customerServiceManager = new CustomerServiceManager(this.telegramManager);
    this.workflowManager = new WorkflowManager(this.telegramManager);
    this.stateManager = new StateManager(this.telegramManager);
    this.bannerScheduler = new BannerScheduler(this.telegramManager);

    this.commandHandler = new IntegratedCommandHandler(
      this.telegramManager,
      this.githubManager,
      this.customerServiceManager,
      this.workflowManager,
      this.stateManager
    );
  }

  async initialize(): Promise<void> {
    try {
      // Initialize all components
      await this.telegramManager.initialize();
      await this.initializeGitHubWebhooks();
      await this.initializeCustomerService();
      await this.initializeSystemStates();
      await this.initializeWorkflowTemplates();

      // Start schedulers
      this.bannerScheduler.startBannerUpdates('*/5 * * * *');

      this.displayEnhancedSystemBanner();

      console.log(ANSIColors.colorize(
        '🚀 Integrated System with Human-in-the-Loop Workflows Started!',
        'brightGreen'
      ));
    } catch (error) {
      console.error(ANSIColors.colorize(`❌ Initialization failed: ${error}`, 'red'));
      throw error;
    }
  }

  private async initializeWorkflowTemplates(): Promise<void> {
    // PR Approval Workflow
    const prApprovalWorkflow: WorkflowStep[] = [
      {
        id: 'code_review',
        name: 'Code Review',
        type: 'approval',
        assignees: ['senior_devs'],
        required: true,
        timeout: 120, // 2 hours
        template: 'approval_request',
        conditions: [],
        actions: []
      },
      {
        id: 'qa_approval',
        name: 'QA Approval',
        type: 'approval',
        assignees: ['qa_team'],
        required: true,
        timeout: 60,
        template: 'approval_request',
        conditions: [],
        actions: []
      },
      {
        id: 'security_review',
        name: 'Security Review',
        type: 'approval',
        assignees: ['security_team'],
        required: false,
        timeout: 180,
        template: 'approval_request',
        conditions: [
          { field: 'data.contains_security_changes', operator: 'eq', value: true }
        ],
        actions: []
      },
      {
        id: 'deployment_approval',
        name: 'Deployment Approval',
        type: 'approval',
        assignees: ['tech_lead'],
        required: true,
        timeout: 30,
        template: 'approval_request',
        conditions: [],
        actions: []
      }
    ];

    await this.workflowManager.registerWorkflow('pr_approval', prApprovalWorkflow);

    // Incident Response Workflow
    const incidentWorkflow: WorkflowStep[] = [
      {
        id: 'incident_acknowledge',
        name: 'Acknowledge Incident',
        type: 'approval',
        assignees: ['on_call_engineer'],
        required: true,
        timeout: 5, // 5 minutes for critical incidents
        template: 'approval_request',
        conditions: [],
        actions: []
      },
      {
        id: 'team_notification',
        name: 'Notify Team',
        type: 'notification',
        assignees: ['engineering_team'],
        required: true,
        template: 'approval_request',
        conditions: [],
        actions: []
      },
      {
        id: 'resolution_plan',
        name: 'Create Resolution Plan',
        type: 'task',
        assignees: ['incident_commander'],
        required: true,
        timeout: 15,
        template: 'approval_request',
        conditions: [],
        actions: []
      }
    ];

    await this.workflowManager.registerWorkflow('incident_response', incidentWorkflow);

    // Customer Escalation Workflow
    const customerEscalationWorkflow: WorkflowStep[] = [
      {
        id: 'initial_response',
        name: 'Initial Customer Response',
        type: 'approval',
        assignees: ['support_agent'],
        required: true,
        timeout: 30,
        template: 'customer_response',
        conditions: [],
        actions: []
      },
      {
        id: 'technical_review',
        name: 'Technical Review',
        type: 'approval',
        assignees: ['technical_support'],
        required: false,
        timeout: 60,
        template: 'technical_review',
        conditions: [
          { field: 'data.requires_technical_review', operator: 'eq', value: true }
        ],
        actions: []
      },
      {
        id: 'management_approval',
        name: 'Management Approval',
        type: 'approval',
        assignees: ['support_manager'],
        required: false,
        timeout: 120,
        template: 'management_approval',
        conditions: [
          { field: 'data.severity', operator: 'in', value: ['high', 'critical'] }
        ],
        actions: []
      },
      {
        id: 'customer_resolution',
        name: 'Final Customer Resolution',
        type: 'approval',
        assignees: ['support_agent'],
        required: true,
        timeout: 60,
        template: 'customer_resolution',
        conditions: [],
        actions: []
      }
    ];

    await this.workflowManager.registerWorkflow('customer_escalation', customerEscalationWorkflow);

    // Employee Onboarding Workflow
    const onboardingWorkflow: WorkflowStep[] = [
      {
        id: 'hr_approval',
        name: 'HR Documentation Review',
        type: 'approval',
        assignees: ['hr_team'],
        required: true,
        timeout: 1440, // 24 hours
        template: 'hr_approval',
        conditions: [],
        actions: []
      },
      {
        id: 'it_setup',
        name: 'IT Equipment and Access',
        type: 'task',
        assignees: ['it_team'],
        required: true,
        timeout: 480, // 8 hours
        template: 'it_setup',
        conditions: [],
        actions: []
      },
      {
        id: 'security_training',
        name: 'Security Training Assignment',
        type: 'notification',
        assignees: ['security_team', 'new_hire'],
        required: true,
        template: 'security_training',
        conditions: [],
        actions: []
      },
      {
        id: 'team_introduction',
        name: 'Team Introduction',
        type: 'approval',
        assignees: ['team_lead'],
        required: true,
        timeout: 240, // 4 hours
        template: 'team_introduction',
        conditions: [],
        actions: []
      }
    ];

    await this.workflowManager.registerWorkflow('employee_onboarding', onboardingWorkflow);

    // Change Management Workflow
    const changeManagementWorkflow: WorkflowStep[] = [
      {
        id: 'change_request',
        name: 'Change Request Review',
        type: 'approval',
        assignees: ['change_manager'],
        required: true,
        timeout: 240, // 4 hours
        template: 'change_request',
        conditions: [],
        actions: []
      },
      {
        id: 'technical_assessment',
        name: 'Technical Impact Assessment',
        type: 'approval',
        assignees: ['technical_lead'],
        required: true,
        timeout: 480, // 8 hours
        template: 'technical_assessment',
        conditions: [],
        actions: []
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        type: 'approval',
        assignees: ['risk_team'],
        required: false,
        timeout: 720, // 12 hours
        template: 'risk_assessment',
        conditions: [
          { field: 'data.risk_level', operator: 'in', value: ['medium', 'high', 'critical'] }
        ],
        actions: []
      },
      {
        id: 'stakeholder_approval',
        name: 'Stakeholder Approval',
        type: 'approval',
        assignees: ['business_stakeholders'],
        required: true,
        timeout: 1440, // 24 hours
        template: 'stakeholder_approval',
        conditions: [
          { field: 'data.requires_business_approval', operator: 'eq', value: true }
        ],
        actions: []
      },
      {
        id: 'implementation_approval',
        name: 'Implementation Approval',
        type: 'approval',
        assignees: ['operations_team'],
        required: true,
        timeout: 120, // 2 hours
        template: 'implementation_approval',
        conditions: [],
        actions: []
      }
    ];

    await this.workflowManager.registerWorkflow('change_management', changeManagementWorkflow);

    console.log(ANSIColors.colorize('✅ Workflow templates registered', 'green'));
  }

  private async initializeGitHubWebhooks(): Promise<void> {
    const repos = process.env.GITHUB_REPOS?.split(',') || [];

    for (const repo of repos) {
      const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/github/${repo}`;
      await this.githubManager.initializeWebhooks(repo, webhookUrl);
    }
  }

  private async initializeCustomerService(): Promise<void> {
    const agents = process.env.CS_AGENTS?.split(',') || [];
    agents.forEach(agent => this.customerServiceManager.registerAgent(agent));
  }

  private async initializeSystemStates(): Promise<void> {
    const systems = [
      {
        id: 'api-gateway',
        name: 'API Gateway',
        components: [
          { name: 'Load Balancer', status: 'operational', description: 'Traffic distribution', dependencies: [] },
          { name: 'Rate Limiter', status: 'operational', description: 'Request throttling', dependencies: [] }
        ]
      }
    ];

    for (const system of systems) {
      await this.stateManager.registerSystem(system.id, system.name, system.components);
    }
  }

  private displayEnhancedSystemBanner(): void {
    const banner = ANSIColors.createBanner(
      'Human-in-the-Loop Workflow System',
      'Jinja Templates + Telegram + GitHub + Approval Workflows',
      'rainbow'
    );

    const features = [
      '🤖 *Smart Workflows*: Jinja-templated approval processes',
      '👥 *Human-in-the-Loop*: Interactive approval system',
      '📋 *Template Engine*: Dynamic message generation',
      '🔔 *Real-time Notifications*: Instant workflow updates',
      '⏰ *Timeout Management*: Automated escalation',
      '📊 *Progress Tracking*: Visual workflow status',
      '🎯 *Conditional Logic*: Smart step routing',
      '🔗 *Multi-platform*: GitHub, Telegram, Customer Service integration'
    ].join('\n');

    console.log(`\n${banner}\n`);
    console.log(features);
    console.log(ANSIColors.colorize('\n🟢 Human-in-the-loop system ready!', 'brightGreen'));
  }

  // Public API for external workflow triggers
  async startPRApprovalWorkflow(prData: any): Promise<string> {
    const instance = await this.workflowManager.startWorkflow(
      'pr_approval',
      'github-bot',
      {
        title: `PR Approval: ${prData.title}`,
        description: `Pull Request #${prData.number} requires approval`,
        priority: prData.priority || 'medium',
        pr_number: prData.number,
        contains_security_changes: prData.labels?.includes('security') || false
      }
    );

    return instance.id;
  }

  async startIncidentWorkflow(incidentData: any): Promise<string> {
    const instance = await this.workflowManager.startWorkflow(
      'incident_response',
      'monitoring-system',
      {
        title: `Incident: ${incidentData.title}`,
        description: incidentData.description,
        priority: 'critical',
        severity: incidentData.severity,
        affected_services: incidentData.affected_services
      }
    );

    return instance.id;
  }

  async shutdown(): Promise<void> {
    this.bannerScheduler.stopBannerUpdates();
    console.log(ANSIColors.colorize('\n🛑 Integrated Workflow System shutdown complete.', 'red'));
  }
}

// Export singleton instance
export const workflowSystem = new IntegratedSystemWithWorkflows();

// Graceful shutdown
process.on('SIGINT', async () => {
  await workflowSystem.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await workflowSystem.shutdown();
  process.exit(0);
});
