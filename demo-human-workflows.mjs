// Comprehensive Human-in-the-Loop Workflow Demo
import { ColorFormatter } from './src/utils/ansi-colors.js';

console.log(ColorFormatter.createRainbowBanner('🤖 Human-in-the-Loop Workflow System', 'Jinja Templates + Telegram + Approval Workflows'));

// Demo workflow scenarios
const workflowScenarios = [
  {
    name: 'PR Approval Workflow',
    workflowId: 'pr_approval',
    description: 'Automated code review and approval process',
    steps: [
      '📝 Code Review (Senior Developers)',
      '🧪 QA Approval (QA Team)',
      '🔒 Security Review (Security Team - conditional)',
      '🚀 Deployment Approval (Tech Lead)'
    ],
    sampleData: {
      title: 'Feature: User Authentication System',
      description: 'Implement OAuth2 authentication with JWT tokens',
      priority: 'high',
      pr_number: 12345,
      contains_security_changes: true,
      requested_by: 'alice',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  },
  {
    name: 'Incident Response Workflow',
    workflowId: 'incident_response',
    description: 'Critical incident management and resolution',
    steps: [
      '⚡ Acknowledge Incident (On-call Engineer - 5min timeout)',
      '📢 Notify Team (Engineering Team)',
      '📋 Create Resolution Plan (Incident Commander)'
    ],
    sampleData: {
      title: 'Database Connection Pool Exhaustion',
      description: 'Production database experiencing connection pool exhaustion',
      priority: 'critical',
      severity: 'critical',
      affected_services: ['api-gateway', 'user-service', 'payment-service']
    }
  },
  {
    name: 'Customer Escalation Workflow',
    workflowId: 'customer_escalation',
    description: 'Customer support escalation and resolution',
    steps: [
      '🎫 Initial Customer Response (Support Agent)',
      '🔧 Technical Review (Technical Support - conditional)',
      '👔 Management Approval (Support Manager - conditional)',
      '✅ Final Customer Resolution (Support Agent)'
    ],
    sampleData: {
      customer_name: 'Acme Corporation',
      issue_id: 'CS-2024-001',
      severity: 'high',
      category: 'Technical Issue',
      description: 'API integration failing with timeout errors',
      requires_technical_review: true
    }
  },
  {
    name: 'Employee Onboarding Workflow',
    workflowId: 'employee_onboarding',
    description: 'New employee onboarding and setup process',
    steps: [
      '👥 HR Documentation Review (HR Team)',
      '💻 IT Equipment and Access (IT Team)',
      '🔒 Security Training Assignment (Security Team + New Hire)',
      '👋 Team Introduction (Team Lead)'
    ],
    sampleData: {
      employee_name: 'John Doe',
      position: 'Senior Software Engineer',
      department: 'Engineering',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      equipment: [
        { name: 'MacBook Pro 16"', urgency: 'high' },
        { name: '4K Monitor', urgency: 'medium' },
        { name: 'Mechanical Keyboard', urgency: 'low' }
      ],
      system_access: [
        { system: 'GitHub', level: 'write' },
        { system: 'AWS Console', level: 'developer' },
        { system: 'Slack', level: 'full' }
      ]
    }
  },
  {
    name: 'Change Management Workflow',
    workflowId: 'change_management',
    description: 'IT change management and approval process',
    steps: [
      '🔄 Change Request Review (Change Manager)',
      '🔬 Technical Impact Assessment (Technical Lead)',
      '⚠️ Risk Assessment (Risk Team - conditional)',
      '🤝 Stakeholder Approval (Business Stakeholders - conditional)',
      '🚀 Implementation Approval (Operations Team)'
    ],
    sampleData: {
      change_id: 'CHG-2024-042',
      title: 'Database Migration to PostgreSQL 15',
      description: 'Upgrade production database from PostgreSQL 13 to 15',
      priority: 'high',
      risk_level: 'high',
      affected_systems: ['user-database', 'analytics-db', 'backup-system'],
      estimated_downtime: '15 minutes',
      requires_business_approval: true,
      implementation_window: 'Saturday 2:00 AM - 4:00 AM UTC'
    }
  }
];

// Display workflow scenarios
console.log('\n📋 Available Workflow Templates:\n');
workflowScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${ColorFormatter.colorize(scenario.name, 'cyan')}`);
  console.log(`   ${scenario.description}`);
  console.log(`   Workflow ID: ${scenario.workflowId}`);
  console.log(`   Steps: ${scenario.steps.length}`);
  scenario.steps.forEach(step => console.log(`     ${step}`));
  console.log('');
});

// Jinja template examples
console.log(ColorFormatter.colorize('🎨 Jinja Template Examples:', 'yellow'));

const templateExamples = [
  {
    name: 'Approval Request Template',
    template: 'approval_request',
    context: workflowScenarios[0].sampleData,
    preview: `
🚨 *Approval Required: Feature: User Authentication System*

*Description:* Implement OAuth2 authentication with JWT tokens
*Priority:* 🟠 HIGH
*Requested by:* alice
*Deadline:* 2024-01-15 17:00

*Current Step:* Code Review
*Assignees:* senior_devs

*Approval Actions:*
✅ /approve_wf-123456789 - Approve this request
❌ /reject_wf-123456789 - Reject this request
⏸️ /defer_wf-123456789 - Defer decision
📋 /info_wf-123456789 - Show more information

*Workflow Progress:* 0/4 steps completed`
  },
  {
    name: 'Customer Response Template',
    template: 'customer_response',
    context: workflowScenarios[2].sampleData,
    preview: `
🎫 *Customer Response Required*

*Customer:* Acme Corporation
*Issue ID:* CS-2024-001
*Severity:* 🟠 HIGH
*Category:* Technical Issue

*Issue Description:*
API integration failing with timeout errors

*Response Actions:*
✅ /approve_wf-123456789 - Respond to customer
❌ /reject_wf-123456789 - Escalate to manager
⏸️ /defer_wf-123456789 - Request more information

*Response Time:* 30 minutes remaining`
  },
  {
    name: 'Change Request Template',
    template: 'change_request',
    context: workflowScenarios[4].sampleData,
    preview: `
🔄 *Change Request Review*

*Change ID:* CHG-2024-042
*Title:* Database Migration to PostgreSQL 15
*Requester:* change_manager
*Priority:* 🟠 HIGH

*Change Description:*
Upgrade production database from PostgreSQL 13 to 15

*Impact Assessment:*
• Risk Level: 🔴
• Systems Affected: user-database, analytics-db, backup-system
• Estimated Downtime: 15 minutes

*Review Actions:*
✅ /approve_wf-123456789 - Change approved
❌ /reject_wf-123456789 - Change rejected
📋 /info_wf-123456789 - Request more details

*Implementation Window:* Saturday 2:00 AM - 4:00 AM UTC`
  }
];

templateExamples.forEach((example, index) => {
  console.log(`\n${index + 1}. ${ColorFormatter.colorize(example.name, 'brightBlue')}:`);
  console.log(example.preview.trim());
});

// Command examples
console.log(ColorFormatter.colorize('\n💬 Interactive Command Examples:', 'brightGreen'));

const commandExamples = [
  {
    category: 'Workflow Management',
    commands: [
      '/start_workflow pr_approval title="Feature: Auth System" priority=high',
      '/workflow_info wf-123456789',
      '/approve wf-123456789 "Looks good, approved!"',
      '/reject wf-123456789 "Needs more testing"'
    ]
  },
  {
    category: 'Error Recovery',
    commands: [
      '/retry_workflow_wf-123456789 - Retry failed step',
      '/skip_step_wf-123456789 - Skip problematic step',
      '/cancel_workflow_wf-123456789 - Cancel workflow',
      '/escalate_error_wf-123456789 - Escalate to admins'
    ]
  },
  {
    category: 'Inline Keyboard Actions',
    commands: [
      '[✅ Approve] [❌ Reject] [⏸️ Defer] [📋 Info]',
      '[🔄 Retry Step] [⏭️ Skip Step] [👥 Escalate]',
      '[✅ Mark Complete] [🆘 Need Help]'
    ]
  }
];

commandExamples.forEach(category => {
  console.log(`\n${ColorFormatter.colorize(category.category, 'yellow')}:`);
  category.commands.forEach(cmd => console.log(`  ${cmd}`));
});

// Integration points
console.log(ColorFormatter.colorize('\n🔗 Integration Points:', 'brightMagenta'));

const integrations = [
  '🐙 **GitHub**: PR creation → Automatic workflow initiation',
  '📱 **Telegram**: Real-time notifications and approvals',
  '🎫 **Customer Service**: Issue escalation workflows',
  '📊 **Monitoring**: Incident response automation',
  '👥 **HR Systems**: Employee onboarding processes',
  '🔄 **IT Operations**: Change management workflows'
];

integrations.forEach(integration => console.log(`  ${integration}`));

// Features showcase
console.log(ColorFormatter.colorize('\n✨ Key Features:', 'brightCyan'));

const features = [
  '🎯 **Smart Routing**: Conditional step execution based on data',
  '⏰ **Timeout Management**: Automatic escalation and reminders',
  '📊 **Progress Tracking**: Real-time workflow status updates',
  '🎨 **Dynamic Templates**: Jinja-powered message generation',
  '🔔 **Multi-channel**: Telegram topics + direct messages',
  '📋 **Audit Trail**: Complete workflow history logging',
  '🔄 **Error Recovery**: Retry, skip, cancel, and escalate options',
  '🎛️ **Flexible Configuration**: Custom workflows and templates'
];

features.forEach(feature => console.log(`  ${feature}`));

// Usage statistics
console.log(ColorFormatter.colorize('\n📈 System Capabilities:', 'brightYellow'));

const stats = [
  '📋 **5 Pre-built Workflow Templates**',
  '🎨 **8+ Jinja Templates**',
  '💬 **15+ Interactive Commands**',
  '🔗 **6 Integration Points**',
  '⚡ **Real-time Processing**',
  '🛡️ **Error Handling & Recovery**',
  '📊 **Progress Tracking**',
  '🔔 **Automated Notifications**'
];

stats.forEach(stat => console.log(`  ${stat}`));

console.log(ColorFormatter.colorize('\n🚀 Getting Started:', 'green'));

console.log(`
1. **Initialize the system**:
   import { workflowSystem } from './src/integrated-system-with-workflows.js';
   await workflowSystem.initialize();

2. **Start a workflow**:
   const instanceId = await workflowSystem.startPRApprovalWorkflow({
     title: 'My Feature PR',
     priority: 'high',
     pr_number: 12345
   });

3. **Monitor progress**:
   // Real-time updates in Telegram topics
   // Interactive approval buttons
   // Automatic notifications

4. **Handle errors**:
   // Retry failed steps
   // Skip problematic steps
   // Escalate to administrators
`);

console.log(ColorFormatter.createRainbowBanner('🎉 Human-in-the-Loop Workflow System Ready!', 'Perfect for: DevOps, Customer Support, HR, IT Operations, and more!'));
