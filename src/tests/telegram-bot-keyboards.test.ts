import { describe, it, expect } from 'vitest';
import { TelegramBotKeyboards } from '../modules/telegram-bot-keyboards';

describe('TelegramBotKeyboards', () => {
  describe('generateApprovalKeyboard', () => {
    it('should generate approval keyboard with correct structure', () => {
      const keyboard = TelegramBotKeyboards.generateApprovalKeyboard('test-instance-123');
      
      expect(keyboard).toHaveProperty('inline_keyboard');
      expect(Array.isArray(keyboard.inline_keyboard)).toBe(true);
      expect(keyboard.inline_keyboard).toHaveLength(2); // 2 rows
      
      // First row: Approve and Reject
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '✅ Approve',
        callback_data: 'approve_test-instance-123'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '❌ Reject',
        callback_data: 'reject_test-instance-123'
      });
      
      // Second row: Defer and Info
      expect(keyboard.inline_keyboard[1]).toHaveLength(2);
      expect(keyboard.inline_keyboard[1][0]).toEqual({
        text: '⏸️ Defer',
        callback_data: 'defer_test-instance-123'
      });
      expect(keyboard.inline_keyboard[1][1]).toEqual({
        text: '📋 Info',
        callback_data: 'info_test-instance-123'
      });
    });
  });

  describe('generateTaskKeyboard', () => {
    it('should generate task keyboard with correct structure', () => {
      const keyboard = TelegramBotKeyboards.generateTaskKeyboard('task-456');
      
      expect(keyboard).toHaveProperty('inline_keyboard');
      expect(keyboard.inline_keyboard).toHaveLength(1); // 1 row
      expect(keyboard.inline_keyboard[0]).toHaveLength(2); // 2 buttons
      
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '✅ Mark Complete',
        callback_data: 'complete_task-456'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '🆘 Need Help',
        callback_data: 'help_task-456'
      });
    });
  });

  describe('generateEscalationKeyboard', () => {
    it('should generate escalation keyboard with correct structure', () => {
      const keyboard = TelegramBotKeyboards.generateEscalationKeyboard('escalate-789');
      
      expect(keyboard.inline_keyboard).toHaveLength(2); // 2 rows
      
      // First row: Escalate and Extend
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '🚨 Escalate',
        callback_data: 'escalate_escalate-789'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '⏰ Extend Timeout',
        callback_data: 'extend_escalate-789'
      });
      
      // Second row: Reject
      expect(keyboard.inline_keyboard[1]).toHaveLength(1);
      expect(keyboard.inline_keyboard[1][0]).toEqual({
        text: '❌ Reject',
        callback_data: 'reject_escalate-789'
      });
    });
  });

  describe('generateWorkflowManagementKeyboard', () => {
    it('should generate workflow management keyboard', () => {
      const keyboard = TelegramBotKeyboards.generateWorkflowManagementKeyboard('workflow-abc');
      
      expect(keyboard.inline_keyboard).toHaveLength(2); // 2 rows
      
      // First row: Status and History
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '📊 Status',
        callback_data: 'status_workflow-abc'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '📜 History',
        callback_data: 'history_workflow-abc'
      });
      
      // Second row: Settings and Restart
      expect(keyboard.inline_keyboard[1]).toHaveLength(2);
      expect(keyboard.inline_keyboard[1][0]).toEqual({
        text: '⚙️ Settings',
        callback_data: 'settings_workflow-abc'
      });
      expect(keyboard.inline_keyboard[1][1]).toEqual({
        text: '🔄 Restart',
        callback_data: 'restart_workflow-abc'
      });
    });
  });

  describe('generateNotificationKeyboard', () => {
    it('should generate notification keyboard', () => {
      const keyboard = TelegramBotKeyboards.generateNotificationKeyboard('notify-123');
      
      expect(keyboard.inline_keyboard).toHaveLength(1);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '✅ Acknowledge',
        callback_data: 'acknowledge_notify-123'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '📋 Details',
        callback_data: 'details_notify-123'
      });
    });
  });

  describe('generateErrorHandlingKeyboard', () => {
    it('should generate error handling keyboard', () => {
      const keyboard = TelegramBotKeyboards.generateErrorHandlingKeyboard('error-123', 'step-456');
      
      expect(keyboard.inline_keyboard).toHaveLength(2);
      
      // First row: Retry and Skip
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '🔄 Retry',
        callback_data: 'retry_error-123_step-456'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '⏭️ Skip',
        callback_data: 'skip_error-123_step-456'
      });
      
      // Second row: Escalate
      expect(keyboard.inline_keyboard[1]).toHaveLength(1);
      expect(keyboard.inline_keyboard[1][0]).toEqual({
        text: '🚨 Escalate',
        callback_data: 'escalate_error-123_step-456'
      });
    });
  });

  describe('generatePrioritySelectionKeyboard', () => {
    it('should generate priority selection keyboard', () => {
      const keyboard = TelegramBotKeyboards.generatePrioritySelectionKeyboard('priority-123');
      
      expect(keyboard.inline_keyboard).toHaveLength(2);
      
      // First row: Critical and High
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '🔴 Critical',
        callback_data: 'priority_priority-123_critical'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '🟠 High',
        callback_data: 'priority_priority-123_high'
      });
      
      // Second row: Medium and Low
      expect(keyboard.inline_keyboard[1][0]).toEqual({
        text: '🟡 Medium',
        callback_data: 'priority_priority-123_medium'
      });
      expect(keyboard.inline_keyboard[1][1]).toEqual({
        text: '🟢 Low',
        callback_data: 'priority_priority-123_low'
      });
    });
  });

  describe('generateConfirmationKeyboard', () => {
    it('should generate confirmation keyboard', () => {
      const keyboard = TelegramBotKeyboards.generateConfirmationKeyboard('confirm-123', 'delete');
      
      expect(keyboard.inline_keyboard).toHaveLength(1);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: '✅ Confirm',
        callback_data: 'confirm_confirm-123_delete'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: '❌ Cancel',
        callback_data: 'cancel_confirm-123_delete'
      });
    });
  });

  describe('generateAssigneeSelectionKeyboard', () => {
    it('should generate assignee selection keyboard for multiple users', () => {
      const users = ['alice', 'bob', 'charlie', 'dave'];
      const keyboard = TelegramBotKeyboards.generateAssigneeSelectionKeyboard('assign-123', users);
      
      expect(keyboard.inline_keyboard).toHaveLength(3); // 2 rows for users + 1 row for controls
      
      // First row: alice and bob
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: 'alice',
        callback_data: 'assign_assign-123_alice'
      });
      expect(keyboard.inline_keyboard[0][1]).toEqual({
        text: 'bob',
        callback_data: 'assign_assign-123_bob'
      });
      
      // Second row: charlie and dave
      expect(keyboard.inline_keyboard[1][0]).toEqual({
        text: 'charlie',
        callback_data: 'assign_assign-123_charlie'
      });
      expect(keyboard.inline_keyboard[1][1]).toEqual({
        text: 'dave',
        callback_data: 'assign_assign-123_dave'
      });
      
      // Control row
      expect(keyboard.inline_keyboard[2][0]).toEqual({
        text: '✅ Done',
        callback_data: 'assign_done_assign-123'
      });
      expect(keyboard.inline_keyboard[2][1]).toEqual({
        text: '❌ Cancel',
        callback_data: 'assign_cancel_assign-123'
      });
    });

    it('should handle single user', () => {
      const users = ['alice'];
      const keyboard = TelegramBotKeyboards.generateAssigneeSelectionKeyboard('assign-123', users);
      
      expect(keyboard.inline_keyboard).toHaveLength(2); // 1 row for user + 1 row for controls
      expect(keyboard.inline_keyboard[0]).toHaveLength(1);
      expect(keyboard.inline_keyboard[0][0]).toEqual({
        text: 'alice',
        callback_data: 'assign_assign-123_alice'
      });
    });
  });

  describe('generateCustomKeyboard', () => {
    it('should generate custom keyboard with specified columns', () => {
      const buttons = [
        { text: 'Button 1', callback_data: 'btn1' },
        { text: 'Button 2', callback_data: 'btn2' },
        { text: 'Button 3', callback_data: 'btn3' },
        { text: 'Button 4', callback_data: 'btn4' }
      ];
      
      const keyboard = TelegramBotKeyboards.generateCustomKeyboard(buttons, 2);
      
      expect(keyboard.inline_keyboard).toHaveLength(2);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[1]).toHaveLength(2);
    });

    it('should handle odd number of buttons', () => {
      const buttons = [
        { text: 'Button 1', callback_data: 'btn1' },
        { text: 'Button 2', callback_data: 'btn2' },
        { text: 'Button 3', callback_data: 'btn3' }
      ];
      
      const keyboard = TelegramBotKeyboards.generateCustomKeyboard(buttons, 2);
      
      expect(keyboard.inline_keyboard).toHaveLength(2);
      expect(keyboard.inline_keyboard[0]).toHaveLength(2);
      expect(keyboard.inline_keyboard[1]).toHaveLength(1);
    });
  });

  describe('validateKeyboard', () => {
    it('should validate correct keyboard structure', () => {
      const validKeyboard = {
        inline_keyboard: [
          [
            { text: 'Test', callback_data: 'test' }
          ]
        ]
      };
      
      expect(TelegramBotKeyboards.validateKeyboard(validKeyboard)).toBe(true);
    });

    it('should reject invalid keyboard structure', () => {
      const invalidKeyboard = {
        inline_keyboard: 'not an array'
      };
      
      expect(TelegramBotKeyboards.validateKeyboard(invalidKeyboard)).toBe(false);
    });

    it('should reject keyboard with missing button properties', () => {
      const invalidKeyboard = {
        inline_keyboard: [
          [
            { text: 'Test' } // Missing callback_data
          ]
        ]
      };
      
      expect(TelegramBotKeyboards.validateKeyboard(invalidKeyboard)).toBe(false);
    });
  });

  describe('getKeyboardPatterns', () => {
    it('should return all keyboard patterns', () => {
      const patterns = TelegramBotKeyboards.getKeyboardPatterns();
      
      expect(patterns).toHaveProperty('approve');
      expect(patterns).toHaveProperty('reject');
      expect(patterns).toHaveProperty('defer');
      expect(patterns).toHaveProperty('info');
      expect(patterns).toHaveProperty('complete');
      expect(patterns).toHaveProperty('help');
      expect(patterns).toHaveProperty('escalate');
      expect(patterns).toHaveProperty('status');
      expect(patterns).toHaveProperty('history');
      expect(patterns).toHaveProperty('acknowledge');
      expect(patterns).toHaveProperty('retry');
      expect(patterns).toHaveProperty('skip');
      expect(patterns).toHaveProperty('confirm');
      expect(patterns).toHaveProperty('cancel');
      expect(patterns).toHaveProperty('priority');
      expect(patterns).toHaveProperty('assign');
      
      // Test pattern matching
      expect(patterns.approve.test('approve_test-123')).toBe(true);
      expect(patterns.reject.test('reject_test-123')).toBe(true);
      expect(patterns.complete.test('complete_test-123')).toBe(true);
    });
  });
});
