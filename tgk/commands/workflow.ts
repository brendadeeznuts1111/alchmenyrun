#!/usr/bin/env node

/**
 * tgk workflow - Advanced Orchestration Engine
 * Commands: create, run, status, list, cancel
 */

import { ui } from '../utils/ui.js';

// Workflow orchestration engine
const workflowEngine = {
  workflows: new Map(),

  // Predefined workflow templates
  templates: {
    'release-pipeline': {
      name: 'Release Pipeline',
      description: 'Complete release process from planning to deployment',
      steps: [
        { id: 'plan', name: 'AI Release Planning', type: 'ai', action: 'suggest-strategy', params: { context: 'release' } },
        { id: 'validate', name: 'Code Validation', type: 'ci', action: 'run-tests', params: {} },
        { id: 'security', name: 'Security Scan', type: 'security', action: 'scan', params: {} },
        { id: 'approve', name: 'Council Approval', type: 'manual', action: 'request-approval', params: {} },
        { id: 'deploy', name: 'Production Deploy', type: 'deploy', action: 'rolling-update', params: { environment: 'production' } },
        { id: 'monitor', name: 'Post-Deploy Monitor', type: 'monitor', action: 'health-check', params: { duration: '24h' } }
      ]
    },

    'incident-response': {
      name: 'Incident Response',
      description: 'Automated incident detection and response',
      steps: [
        { id: 'detect', name: 'Anomaly Detection', type: 'ai', action: 'detect-anomalies', params: {} },
        { id: 'assess', name: 'Impact Assessment', type: 'ai', action: 'predict-risk', params: { component: 'system' } },
        { id: 'notify', name: 'Stakeholder Notification', type: 'notify', action: 'alert-team', params: {} },
        { id: 'mitigate', name: 'Auto-Mitigation', type: 'auto', action: 'apply-fix', params: {} },
        { id: 'verify', name: 'Resolution Verification', type: 'test', action: 'validate-fix', params: {} },
        { id: 'report', name: 'Incident Report', type: 'docs', action: 'generate-report', params: {} }
      ]
    },

    'feature-rollout': {
      name: 'Feature Rollout',
      description: 'Gradual feature deployment with monitoring',
      steps: [
        { id: 'prepare', name: 'Pre-Rollout Prep', type: 'setup', action: 'create-feature-flag', params: {} },
        { id: 'canary', name: 'Canary Deployment', type: 'deploy', action: 'canary-deploy', params: { percentage: 5 } },
        { id: 'monitor', name: 'User Monitoring', type: 'monitor', action: 'track-usage', params: {} },
        { id: 'feedback', name: 'User Feedback', type: 'survey', action: 'send-survey', params: {} },
        { id: 'expand', name: 'Gradual Expansion', type: 'deploy', action: 'increase-percentage', params: { percentage: 25 } },
        { id: 'full', name: 'Full Rollout', type: 'deploy', action: 'full-deploy', params: {} }
      ]
    },

    'security-audit': {
      name: 'Security Audit',
      description: 'Comprehensive security assessment and remediation',
      steps: [
        { id: 'scan', name: 'Vulnerability Scan', type: 'security', action: 'vulnerability-scan', params: {} },
        { id: 'assess', name: 'Risk Assessment', type: 'ai', action: 'risk-analysis', params: {} },
        { id: 'remediate', name: 'Auto-Remediation', type: 'auto', action: 'apply-patches', params: {} },
        { id: 'verify', name: 'Remediation Verification', type: 'test', action: 'security-test', params: {} },
        { id: 'report', name: 'Security Report', type: 'docs', action: 'audit-report', params: {} },
        { id: 'notify', name: 'Stakeholder Notification', type: 'notify', action: 'security-alert', params: {} }
      ]
    }
  },

  createWorkflow: function(template, customParams = {}) {
    const baseTemplate = this.templates[template];
    if (!baseTemplate) {
      throw new Error(`Unknown workflow template: ${template}`);
    }

    const workflow = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: baseTemplate.name,
      template: template,
      description: baseTemplate.description,
      steps: JSON.parse(JSON.stringify(baseTemplate.steps)), // Deep copy
      status: 'created',
      created: new Date(),
      progress: 0,
      currentStep: null,
      results: {},
      customParams
    };

    // Apply custom parameters
    workflow.steps.forEach(step => {
      if (step.params && customParams[step.id]) {
        Object.assign(step.params, customParams[step.id]);
      }
    });

    this.workflows.set(workflow.id, workflow);
    return workflow;
  },

  runWorkflow: async function(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'running';
    workflow.started = new Date();

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        workflow.currentStep = step.id;
        workflow.progress = (i / workflow.steps.length) * 100;

        // Execute step
        const result = await this.executeStep(step);
        workflow.results[step.id] = result;

        // Check if step failed and should stop workflow
        if (result.status === 'failed' && !step.continueOnFailure) {
          workflow.status = 'failed';
          workflow.error = result.error;
          return workflow;
        }
      }

      workflow.status = 'completed';
      workflow.completed = new Date();
      workflow.progress = 100;

    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
    }

    return workflow;
  },

  executeStep: async function(step) {
    // Simulate step execution based on type
    const delay = 1000 + Math.random() * 2000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate different outcomes based on step type
    let status = 'completed';
    let error = null;
    let data = {};

    switch (step.type) {
      case 'ai':
        data = { confidence: 0.85, insights: ['Analysis complete'] };
        break;
      case 'ci':
        if (Math.random() < 0.1) { // 10% failure rate
          status = 'failed';
          error = 'Tests failed';
        } else {
          data = { testsPassed: 95, coverage: 87 };
        }
        break;
      case 'security':
        data = { vulnerabilities: 2, critical: 0 };
        break;
      case 'manual':
        status = 'waiting';
        data = { waitingFor: 'human approval' };
        break;
      case 'deploy':
        if (Math.random() < 0.05) { // 5% failure rate
          status = 'failed';
          error = 'Deployment failed';
        } else {
          data = { deployedTo: step.params.environment || 'staging' };
        }
        break;
      case 'monitor':
        data = { uptime: 99.9, responseTime: 245 };
        break;
      default:
        data = { executed: true };
    }

    return { status, error, data, duration: delay };
  },

  getWorkflowStatus: function(workflowId) {
    return this.workflows.get(workflowId);
  },

  listWorkflows: function() {
    return Array.from(this.workflows.values());
  },

  cancelWorkflow: function(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'cancelled';
      workflow.cancelled = new Date();
      return true;
    }
    return false;
  }
};

export async function createWorkflow(template: string, params: any = {}) {
  ui.header(`Creating Workflow: ${template}`, ui.symbols.rocket);

  try {
    const workflow = workflowEngine.createWorkflow(template, params);

    ui.section('Workflow Details', ui.symbols.gear);
    ui.keyValue('ID', workflow.id, 'cyan', 'yellow');
    ui.keyValue('Name', workflow.name, 'cyan', 'white');
    ui.keyValue('Description', workflow.description, 'cyan', 'white');
    ui.keyValue('Steps', workflow.steps.length.toString(), 'cyan', 'blue');
    ui.keyValue('Status', ui.badge(workflow.status.toUpperCase(), 'info'), 'cyan', 'blue');

    ui.section('Workflow Steps', ui.symbols.list);
    ui.table(
      ['Step', 'Name', 'Type', 'Action'],
      workflow.steps.map(step => [
        step.id,
        step.name,
        step.type,
        step.action
      ])
    );

    ui.success(`Workflow created successfully: ${workflow.id}`);
    ui.info(`Run with: tgk workflow run ${workflow.id}`);

    return workflow;

  } catch (error) {
    ui.error(`Failed to create workflow: ${error.message}`);
    throw error;
  }
}

export async function runWorkflow(workflowId: string) {
  ui.header(`Running Workflow: ${workflowId}`, ui.symbols.play);

  try {
    const workflow = workflowEngine.getWorkflowStatus(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== 'created') {
      throw new Error(`Workflow is already ${workflow.status}`);
    }

    ui.loading('Starting workflow execution...');

    // Run workflow asynchronously with progress updates
    const execution = workflowEngine.runWorkflow(workflowId);

    // Show progress while running
    const progressInterval = setInterval(() => {
      const current = workflowEngine.getWorkflowStatus(workflowId);
      if (current) {
        const progress = Math.round(current.progress);
        ui.progress(progress, 100, `Executing workflow: ${current.currentStep || 'initializing'}`);

        if (current.status !== 'running') {
          clearInterval(progressInterval);
        }
      }
    }, 500);

    const result = await execution;
    clearInterval(progressInterval);

    // Show final results
    ui.section('Execution Results', ui.symbols.check);

    const statusColor = {
      completed: 'success',
      failed: 'error',
      cancelled: 'warning'
    }[result.status] || 'info';

    ui.keyValue('Final Status', ui.badge(result.status.toUpperCase(), statusColor), 'cyan', 'white');

    if (result.error) {
      ui.keyValue('Error', result.error, 'red', 'white');
    }

    ui.keyValue('Duration', result.completed ?
      `${(result.completed - result.started) / 1000}s` : 'In progress', 'cyan', 'white');

    ui.keyValue('Steps Completed', Object.keys(result.results).length.toString(), 'cyan', 'green');

    // Show step results
    if (Object.keys(result.results).length > 0) {
      ui.section('Step Results', ui.symbols.list);
      ui.table(
        ['Step', 'Status', 'Duration', 'Details'],
        result.steps.map(step => {
          const result = result.results[step.id];
          return [
            step.id,
            result ? ui.badge(result.status.toUpperCase(),
              result.status === 'completed' ? 'success' :
              result.status === 'failed' ? 'error' : 'warning') : 'pending',
            result ? `${(result.duration / 1000).toFixed(1)}s` : '-',
            result ? (result.error || 'OK') : '-'
          ];
        })
      );
    }

    const statusIcon = result.status === 'completed' ? ui.symbols.success :
                      result.status === 'failed' ? ui.symbols.error : ui.symbols.warning;

    ui.summaryBox('Workflow Execution Summary', [
      `Workflow: ${result.name}`,
      `Status: ${ui.badge(result.status.toUpperCase(), statusColor)}`,
      `Steps: ${result.steps.length}`,
      `Completed: ${Object.keys(result.results).length}`,
      `Duration: ${result.completed ? `${(result.completed - result.started) / 1000}s` : 'In progress'}`
    ], statusIcon);

    return result;

  } catch (error) {
    ui.error(`Failed to run workflow: ${error.message}`);
    throw error;
  }
}

export async function getWorkflowStatus(workflowId: string) {
  ui.header(`Workflow Status: ${workflowId}`, ui.symbols.monitor);

  try {
    const workflow = workflowEngine.getWorkflowStatus(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    ui.section('Workflow Overview', ui.symbols.info);
    ui.keyValue('Name', workflow.name, 'cyan', 'white');
    ui.keyValue('Template', workflow.template, 'cyan', 'white');
    ui.keyValue('Status', ui.badge(workflow.status.toUpperCase(),
      workflow.status === 'completed' ? 'success' :
      workflow.status === 'failed' ? 'error' :
      workflow.status === 'running' ? 'info' : 'warning'), 'cyan', 'white');
    ui.keyValue('Progress', `${Math.round(workflow.progress)}%`, 'cyan', 'green');
    ui.keyValue('Created', ui.timeAgo(workflow.created), 'cyan', 'gray');

    if (workflow.currentStep) {
      ui.keyValue('Current Step', workflow.currentStep, 'cyan', 'yellow');
    }

    if (workflow.error) {
      ui.keyValue('Error', workflow.error, 'red', 'white');
    }

    ui.section('Step Status', ui.symbols.list);
    ui.table(
      ['Step', 'Name', 'Status', 'Result'],
      workflow.steps.map(step => {
        const result = workflow.results[step.id];
        return [
          step.id,
          step.name,
          result ? ui.badge(result.status.toUpperCase(),
            result.status === 'completed' ? 'success' : 'error') : 'pending',
          result ? (result.status === 'completed' ? '✓' : result.error || '✗') : '-'
        ];
      })
    );

    return workflow;

  } catch (error) {
    ui.error(`Failed to get workflow status: ${error.message}`);
    throw error;
  }
}

export async function listWorkflows() {
  ui.header('Workflow Inventory', ui.symbols.list);

  try {
    const workflows = workflowEngine.listWorkflows();

    if (workflows.length === 0) {
      ui.info('No workflows found. Create one with: tgk workflow create <template>');
      return [];
    }

    ui.section('Active Workflows', ui.symbols.gear);
    ui.table(
      ['ID', 'Name', 'Status', 'Progress', 'Created'],
      workflows.map(wf => [
        wf.id.split('_')[1], // Short ID
        wf.name,
        ui.badge(wf.status.toUpperCase(),
          wf.status === 'completed' ? 'success' :
          wf.status === 'failed' ? 'error' :
          wf.status === 'running' ? 'info' : 'warning'),
        `${Math.round(wf.progress)}%`,
        ui.timeAgo(wf.created)
      ])
    );

    // Summary statistics
    const stats = {
      total: workflows.length,
      completed: workflows.filter(w => w.status === 'completed').length,
      running: workflows.filter(w => w.status === 'running').length,
      failed: workflows.filter(w => w.status === 'failed').length
    };

    ui.summaryBox('Workflow Statistics', [
      `Total Workflows: ${stats.total}`,
      `Completed: ${stats.completed}`,
      `Running: ${stats.running}`,
      `Failed: ${stats.failed}`,
      `Success Rate: ${stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%`
    ], ui.symbols.chart);

    return workflows;

  } catch (error) {
    ui.error(`Failed to list workflows: ${error.message}`);
    throw error;
  }
}

export async function cancelWorkflow(workflowId: string) {
  ui.header(`Cancelling Workflow: ${workflowId}`, ui.symbols.stop);

  try {
    const cancelled = workflowEngine.cancelWorkflow(workflowId);

    if (cancelled) {
      ui.success(`Workflow ${workflowId} cancelled successfully`);
      ui.warning('Note: Currently running steps may complete before cancellation takes effect');
    } else {
      ui.warning(`Workflow ${workflowId} could not be cancelled (not running or not found)`);
    }

    return { cancelled };

  } catch (error) {
    ui.error(`Failed to cancel workflow: ${error.message}`);
    throw error;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];

async function main() {
  try {
    switch (subCommand) {
      case 'create':
        const template = args[2];
        if (!template) {
          console.log('Available templates:');
          Object.entries(workflowEngine.templates).forEach(([key, tmpl]) => {
            console.log(`  ${key}: ${tmpl.description}`);
          });
          console.log('\nUsage: tgk workflow create <template>');
          process.exit(1);
        }
        await createWorkflow(template);
        break;

      case 'run':
        const workflowId = args[2];
        if (!workflowId) {
          console.error('Usage: tgk workflow run <workflow-id>');
          process.exit(1);
        }
        await runWorkflow(workflowId);
        break;

      case 'status':
        const statusId = args[2];
        if (!statusId) {
          console.error('Usage: tgk workflow status <workflow-id>');
          process.exit(1);
        }
        await getWorkflowStatus(statusId);
        break;

      case 'list':
        await listWorkflows();
        break;

      case 'cancel':
        const cancelId = args[2];
        if (!cancelId) {
          console.error('Usage: tgk workflow cancel <workflow-id>');
          process.exit(1);
        }
        await cancelWorkflow(cancelId);
        break;

      default:
        console.log('Available commands:');
        console.log('  tgk workflow create <template> - Create workflow from template');
        console.log('  tgk workflow run <id>         - Execute workflow');
        console.log('  tgk workflow status <id>      - Check workflow status');
        console.log('  tgk workflow list             - List all workflows');
        console.log('  tgk workflow cancel <id>      - Cancel running workflow');
        console.log('\nAvailable templates:');
        Object.entries(workflowEngine.templates).forEach(([key, tmpl]) => {
          console.log(`  ${key}: ${tmpl.description}`);
        });
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
