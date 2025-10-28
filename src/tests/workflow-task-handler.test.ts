import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowTaskHandler } from '../modules/workflow-task-handler';
import { TelegramManager } from '../modules/telegram-manager';
import { JinjaEngine } from '../modules/jinja-engine';
import { WorkflowStep, WorkflowInstance } from '../types/workflow';

describe('WorkflowTaskHandler', () => {
  let taskHandler: WorkflowTaskHandler;
  let mockTelegramManager: any;
  let mockJinjaEngine: any;

  beforeEach(() => {
    mockTelegramManager = {
      sendMessage: vi.fn().mockResolvedValue({}),
      sendDirectMessage: vi.fn().mockResolvedValue({})
    };

    mockJinjaEngine = {
      registerTemplate: vi.fn(),
      render: vi.fn().mockReturnValue('Mock task message')
    };

    taskHandler = new WorkflowTaskHandler(mockTelegramManager, mockJinjaEngine);
  });

  describe('handleTaskStep', () => {
    it('should handle generic task steps', async () => {
      const instance: WorkflowInstance = {
        id: 'test-instance-1',
        workflowId: 'test-workflow',
        currentStep: 'task-step-1',
        status: 'in_progress',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          title: 'Test Task',
          description: 'Test description',
          priority: 'medium'
        },
        approvals: new Map(),
        topicId: 12345
      };

      const step: WorkflowStep = {
        id: 'task-step-1',
        name: 'Test Task Step',
        type: 'task',
        assignees: ['user1', 'user2'],
        required: true
      };

      await taskHandler.handleTaskStep(instance, step, 0, 3);

      expect(mockJinjaEngine.registerTemplate).toHaveBeenCalledTimes(3); // Generic, IT, Security templates
      expect(mockJinjaEngine.render).toHaveBeenCalledWith('task_notification', expect.any(Object));
      expect(mockTelegramManager.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockTelegramManager.sendDirectMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle IT setup tasks', async () => {
      const instance: WorkflowInstance = {
        id: 'test-instance-2',
        workflowId: 'it-workflow',
        currentStep: 'it-setup-step',
        status: 'in_progress',
        createdBy: 'hr-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          type: 'it_setup',
          employee_name: 'John Doe',
          position: 'Developer',
          department: 'Engineering',
          equipment: [
            { name: 'Laptop', urgency: 'high' }
          ],
          system_access: [
            { system: 'GitHub', level: 'admin' }
          ]
        },
        approvals: new Map(),
        topicId: 12346
      };

      const step: WorkflowStep = {
        id: 'it-setup-step',
        name: 'IT Setup',
        type: 'task',
        assignees: ['it-admin'],
        required: true
      };

      await taskHandler.handleTaskStep(instance, step, 1, 5);

      expect(mockJinjaEngine.render).toHaveBeenCalledWith('it_setup', expect.any(Object));
      expect(mockTelegramManager.sendMessage).toHaveBeenCalledWith(
        12346,
        '👤 it-admin\nMock task message',
        undefined,
        expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ text: '✅ Mark Complete' }),
              expect.objectContaining({ text: '🆘 Need Help' })
            ])
          ])
        })
      );
    });

    it('should handle security training tasks', async () => {
      const instance: WorkflowInstance = {
        id: 'test-instance-3',
        workflowId: 'security-workflow',
        currentStep: 'security-step',
        status: 'in_progress',
        createdBy: 'security-admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          type: 'security_training',
          employee_name: 'Jane Smith',
          courses: [
            { name: 'Security 101', due_date: new Date() }
          ],
          requirements: ['Password policy', 'Data handling'],
          completed_courses: 0,
          total_courses: 5
        },
        approvals: new Map(),
        topicId: 12347
      };

      const step: WorkflowStep = {
        id: 'security-step',
        name: 'Security Training',
        type: 'task',
        assignees: ['jane.smith'],
        required: true
      };

      await taskHandler.handleTaskStep(instance, step, 2, 4);

      expect(mockJinjaEngine.render).toHaveBeenCalledWith('security_training', expect.any(Object));
    });
  });

  describe('generateTaskKeyboard', () => {
    it('should generate correct keyboard structure', async () => {
      const instance: WorkflowInstance = {
        id: 'test-keyboard',
        workflowId: 'test-workflow',
        currentStep: 'task-step',
        status: 'in_progress',
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {},
        approvals: new Map(),
        topicId: 12348
      };

      const step: WorkflowStep = {
        id: 'task-step',
        name: 'Test Step',
        type: 'task',
        assignees: ['user1'],
        required: true
      };

      await taskHandler.handleTaskStep(instance, step);

      expect(mockTelegramManager.sendMessage).toHaveBeenCalledWith(
        12348,
        expect.any(String),
        undefined,
        {
          inline_keyboard: [
            [
              { text: '✅ Mark Complete', callback_data: 'complete_test-keyboard' },
              { text: '🆘 Need Help', callback_data: 'help_test-keyboard' }
            ]
          ]
        }
      );
    });
  });
});
