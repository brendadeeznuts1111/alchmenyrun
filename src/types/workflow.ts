export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'review' | 'notification' | 'task' | 'decision';
  assignees: string[];
  required: boolean;
  timeout?: number; // in minutes
  template: string; // Jinja template name
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'matches';
  value: any;
}

export interface WorkflowAction {
  type: 'update_field' | 'send_message' | 'move_step' | 'complete_workflow';
  target: string;
  value: any;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  currentStep: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  data: Record<string, any>;
  approvals: Map<string, WorkflowApproval>;
  topicId?: number;
  pinnedMessageId?: number;
}

export interface WorkflowApproval {
  stepId: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  comments?: string;
  decidedAt?: Date;
}
