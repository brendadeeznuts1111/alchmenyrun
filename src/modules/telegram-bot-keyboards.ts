/**
 * Telegram Bot Keyboard Generation Utility
 * Centralizes all keyboard generation logic for Telegram interactions
 */

export interface KeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboard {
  inline_keyboard: KeyboardButton[][];
}

export interface KeyboardConfig {
  maxButtonsPerRow: number;
  maxRows: number;
  validateButtons: boolean;
}

export class TelegramBotKeyboards {
  
  /**
   * Generate approval keyboard for workflow steps
   */
  static generateApprovalKeyboard(instanceId: string): InlineKeyboard {
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

  /**
   * Generate task keyboard for workflow steps
   */
  static generateTaskKeyboard(instanceId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '✅ Mark Complete', callback_data: `complete_${instanceId}` },
          { text: '🆘 Need Help', callback_data: `help_${instanceId}` }
        ]
      ]
    };
  }

  /**
   * Generate escalation keyboard for timeout situations
   */
  static generateEscalationKeyboard(instanceId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '🚨 Escalate', callback_data: `escalate_${instanceId}` },
          { text: '⏰ Extend Timeout', callback_data: `extend_${instanceId}` }
        ],
        [
          { text: '❌ Reject', callback_data: `reject_${instanceId}` }
        ]
      ]
    };
  }

  /**
   * Generate workflow management keyboard
   */
  static generateWorkflowManagementKeyboard(instanceId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '📊 Status', callback_data: `status_${instanceId}` },
          { text: '📜 History', callback_data: `history_${instanceId}` }
        ],
        [
          { text: '⚙️ Settings', callback_data: `settings_${instanceId}` },
          { text: '🔄 Restart', callback_data: `restart_${instanceId}` }
        ]
      ]
    };
  }

  /**
   * Generate notification keyboard for info messages
   */
  static generateNotificationKeyboard(instanceId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '✅ Acknowledge', callback_data: `acknowledge_${instanceId}` },
          { text: '📋 Details', callback_data: `details_${instanceId}` }
        ]
      ]
    };
  }

  /**
   * Generate error handling keyboard
   */
  static generateErrorHandlingKeyboard(instanceId: string, stepId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '🔄 Retry', callback_data: `retry_${instanceId}_${stepId}` },
          { text: '⏭️ Skip', callback_data: `skip_${instanceId}_${stepId}` }
        ],
        [
          { text: '🚨 Escalate', callback_data: `escalate_${instanceId}_${stepId}` }
        ]
      ]
    };
  }

  /**
   * Generate priority selection keyboard
   */
  static generatePrioritySelectionKeyboard(instanceId: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '🔴 Critical', callback_data: `priority_${instanceId}_critical` },
          { text: '🟠 High', callback_data: `priority_${instanceId}_high` }
        ],
        [
          { text: '🟡 Medium', callback_data: `priority_${instanceId}_medium` },
          { text: '🟢 Low', callback_data: `priority_${instanceId}_low` }
        ]
      ]
    };
  }

  /**
   * Generate confirmation keyboard
   */
  static generateConfirmationKeyboard(instanceId: string, action: string): InlineKeyboard {
    return {
      inline_keyboard: [
        [
          { text: '✅ Confirm', callback_data: `confirm_${instanceId}_${action}` },
          { text: '❌ Cancel', callback_data: `cancel_${instanceId}_${action}` }
        ]
      ]
    };
  }

  /**
   * Generate multi-select keyboard for assignee selection
   */
  static generateAssigneeSelectionKeyboard(instanceId: string, availableUsers: string[]): InlineKeyboard {
    const buttons: KeyboardButton[][] = [];
    
    // Create rows with 2 buttons each
    for (let i = 0; i < availableUsers.length; i += 2) {
      const row: KeyboardButton[] = [];
      
      if (i < availableUsers.length) {
        row.push({
          text: availableUsers[i],
          callback_data: `assign_${instanceId}_${availableUsers[i]}`
        });
      }
      
      if (i + 1 < availableUsers.length) {
        row.push({
          text: availableUsers[i + 1],
          callback_data: `assign_${instanceId}_${availableUsers[i + 1]}`
        });
      }
      
      if (row.length > 0) {
        buttons.push(row);
      }
    }
    
    // Add control buttons
    buttons.push([
      { text: '✅ Done', callback_data: `assign_done_${instanceId}` },
      { text: '❌ Cancel', callback_data: `assign_cancel_${instanceId}` }
    ]);
    
    return { inline_keyboard: buttons };
  }

  /**
   * Generate customizable keyboard with provided buttons
   */
  static generateCustomKeyboard(buttons: KeyboardButton[], columns: number = 2): InlineKeyboard {
    const rows: KeyboardButton[][] = [];
    
    for (let i = 0; i < buttons.length; i += columns) {
      const row: KeyboardButton[] = [];
      
      for (let j = 0; j < columns && i + j < buttons.length; j++) {
        row.push(buttons[i + j]);
      }
      
      if (row.length > 0) {
        rows.push(row);
      }
    }
    
    return { inline_keyboard: rows };
  }

  /**
   * Validate keyboard structure
   */
  static validateKeyboard(keyboard: InlineKeyboard): boolean {
    if (!keyboard || !keyboard.inline_keyboard || !Array.isArray(keyboard.inline_keyboard)) {
      return false;
    }
    
    for (const row of keyboard.inline_keyboard) {
      if (!Array.isArray(row)) {
        return false;
      }
      
      for (const button of row) {
        if (!button.text || !button.callback_data) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get keyboard callback data patterns
   */
  static getKeyboardPatterns(): Record<string, RegExp> {
    return {
      approve: /^approve_(.+)$/,
      reject: /^reject_(.+)$/,
      defer: /^defer_(.+)$/,
      info: /^info_(.+)$/,
      complete: /^complete_(.+)$/,
      help: /^help_(.+)$/,
      escalate: /^escalate_(.+)$/,
      status: /^status_(.+)$/,
      history: /^history_(.+)$/,
      acknowledge: /^acknowledge_(.+)$/,
      retry: /^retry_(.+)_(.+)$/,
      skip: /^skip_(.+)_(.+)$/,
      confirm: /^confirm_(.+)_(.+)$/,
      cancel: /^cancel_(.+)_(.+)$/,
      priority: /^priority_(.+)_(.+)$/,
      assign: /^assign_(.+)_(.+)$/
    };
  }

  /**
   * Generate keyboard with configuration options
   */
  static generateKeyboardWithConfig(
    buttons: KeyboardButton[], 
    config: Partial<KeyboardConfig> = {}
  ): InlineKeyboard {
    const finalConfig: KeyboardConfig = {
      maxButtonsPerRow: 2,
      maxRows: 10,
      validateButtons: true,
      ...config
    };

    if (finalConfig.validateButtons) {
      const validation = this.validateButtonArray(buttons);
      if (!validation.isValid) {
        throw new Error(`Invalid keyboard buttons: ${validation.errors.join(', ')}`);
      }
    }

    const rows: KeyboardButton[][] = [];
    let currentRow: KeyboardButton[] = [];

    for (let i = 0; i < buttons.length && rows.length < finalConfig.maxRows; i++) {
      currentRow.push(buttons[i]);
      
      if (currentRow.length >= finalConfig.maxButtonsPerRow) {
        rows.push([...currentRow]);
        currentRow = [];
      }
    }

    // Add remaining buttons
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return { inline_keyboard: rows };
  }

  /**
   * Validate an array of keyboard buttons
   */
  static validateButtonArray(buttons: KeyboardButton[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    buttons.forEach((button, index) => {
      if (!button.text || button.text.trim().length === 0) {
        errors.push(`Button ${index}: text is empty`);
      }
      if (!button.callback_data || button.callback_data.trim().length === 0) {
        errors.push(`Button ${index}: callback_data is empty`);
      }
      if (button.text.length > 64) {
        errors.push(`Button ${index}: text exceeds 64 characters`);
      }
      if (button.callback_data.length > 64) {
        errors.push(`Button ${index}: callback_data exceeds 64 characters`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get button count from keyboard
   */
  static getButtonCount(keyboard: InlineKeyboard): number {
    return keyboard.inline_keyboard.reduce((total, row) => total + row.length, 0);
  }

  /**
   * Check if keyboard is empty
   */
  static isEmpty(keyboard: InlineKeyboard): boolean {
    return !keyboard.inline_keyboard || keyboard.inline_keyboard.length === 0;
  }

  /**
   * Format keyboard callback data with prefix
   */
  static formatCallbackData(action: string, instanceId: string, additional?: string): string {
    const parts = [action, instanceId];
    if (additional) {
      parts.push(additional);
    }
    return parts.join('_');
  }
}
