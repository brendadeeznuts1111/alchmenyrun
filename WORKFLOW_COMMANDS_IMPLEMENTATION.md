# Workflow Management Commands Implementation

## Overview

This implementation adds comprehensive workflow management commands to handle error recovery and workflow control operations. The system provides four main commands for managing workflow instances when errors occur or manual intervention is needed.

## Commands

### 1. `/retry_workflow_{instance_id}` - Retry Failed Operations
**Purpose**: Retry the current failed workflow step
**Use Case**: When a step fails due to temporary issues (network, timeout, etc.)
**Callback Data**: `retry_workflow_{instance_id}`

**Implementation**:
- Validates workflow instance exists
- Calls `workflowManager.retryWorkflowStep()`
- Provides user feedback via callback response
- Logs the retry action

### 2. `/skip_step_{instance_id}` - Skip Problematic Steps
**Purpose**: Skip the current problematic step and continue to the next one
**Use Case**: When a step is non-critical or blocking progress
**Callback Data**: `skip_step_{instance_id}`

**Implementation**:
- Validates workflow instance exists
- Calls `workflowManager.skipWorkflowStep()`
- Advances to next step or completes workflow
- Updates workflow status and notifies users

### 3. `/cancel_workflow_{instance_id}` - Cancel Unrecoverable Workflows
**Purpose**: Cancel the entire workflow when it cannot be recovered
**Use Case**: Critical errors, invalid data, or user-initiated cancellation
**Callback Data**: `cancel_workflow_{instance_id}`

**Implementation**:
- Sets workflow status to 'cancelled'
- Updates timestamp
- Sends cancellation notification to workflow topic
- Provides immediate user feedback

### 4. `/escalate_error_{instance_id}` - Escalate to Administrators
**Purpose**: Escalate workflow issues to system administrators
**Use Case**: Critical errors, security issues, or when manual intervention is required
**Callback Data**: `escalate_error_{instance_id}`

**Implementation**:
- Calls `workflowManager.triggerEscalation()`
- Notifies administrators via Telegram
- Updates workflow topic with escalation information
- Logs escalation for audit purposes

## Architecture

### Integrated Command Handler
Located in `src/modules/integrated-command-handler.ts`, this component:
- Registers callback query handlers with regex patterns
- Implements the four workflow management commands
- Handles error cases and provides user feedback
- Integrates with the WorkflowManager for operations

### Telegram Manager Enhancements
Located in `src/modules/telegram-manager.ts`, enhancements include:
- `registerCallbackQuery()` method for pattern-based callback handling
- `processCallbackQuery()` method for routing callback data
- `processCommand()` method for handling text commands
- Proper error handling and user feedback

### Workflow Error Handler Updates
Located in `src/modules/workflow-error-handler.ts`, updates include:
- Updated error templates with correct command references
- Enhanced error recovery keyboard with new callback data
- Integration with WorkflowManager for instance lookup
- Improved error logging and escalation

### Workflow Manager Integration
The WorkflowManager in `src/modules/workflow-manager.ts`:
- Passes itself to the error handler for instance lookup
- Provides retry and skip methods for step recovery
- Handles escalation triggers and notifications
- Maintains workflow state throughout operations

## Error Recovery Flow

1. **Error Detection**: Workflow step fails or times out
2. **Error Handling**: WorkflowErrorHandler processes the error
3. **User Notification**: Error message sent with recovery keyboard
4. **User Action**: User clicks recovery button (retry/skip/escalate/cancel)
5. **Callback Processing**: IntegratedCommandHandler routes the callback
6. **Action Execution**: Appropriate workflow operation is performed
7. **Status Update**: Workflow state and user notifications updated

## Usage Examples

### Error Recovery Keyboard
When an error occurs, users see:
```
🚨 Workflow Error Occurred

Error Type: TIMEOUT_ERROR
Message: Step timed out after 60 minutes
Instance: wf-123456789-abcdef
Step: step1

🔧 Recovery Suggestions:
• Check if assignees are available and reachable
• Consider extending timeout duration

Recovery Actions:
[🔄 Retry Step] [⏭️ Skip Step]
[👥 Escalate]    [📋 Info]
```

### Command Callbacks
- **Retry**: `callback_data: "retry_workflow_wf-123456789-abcdef"`
- **Skip**: `callback_data: "skip_step_wf-123456789-abcdef"`
- **Cancel**: `callback_data: "cancel_workflow_wf-123456789-abcdef"`
- **Escalate**: `callback_data: "escalate_error_wf-123456789-abcdef"`

## Security Considerations

1. **Authorization**: Commands are only available to users with access to the workflow topic
2. **Audit Trail**: All actions are logged with user identification
3. **Validation**: Instance IDs are validated before processing
4. **Error Handling**: Graceful failure with user-friendly messages

## Testing

The implementation includes:
- Pattern matching tests for callback data
- Integration tests for command registration
- Error handling validation
- User feedback verification

Run tests with:
```bash
node test-workflow-commands-simple.mjs
```

## Future Enhancements

1. **Bulk Operations**: Support for multiple workflow instances
2. **Conditional Recovery**: Smart retry based on error type
3. **Scheduled Actions**: Delayed retry or automatic escalation
4. **Custom Recovery**: User-defined recovery procedures
5. **Analytics**: Recovery success rates and patterns

## Files Modified

- `src/modules/integrated-command-handler.ts` - Added command handlers
- `src/modules/telegram-manager.ts` - Added callback processing
- `src/modules/workflow-error-handler.ts` - Updated templates and keyboard
- `src/modules/workflow-manager.ts` - Enhanced error handler integration

## Files Created

- `test-workflow-commands-simple.mjs` - Command pattern tests
- `WORKFLOW_COMMANDS_IMPLEMENTATION.md` - This documentation

## Summary

The workflow management commands provide a robust foundation for handling workflow errors and manual interventions. The implementation follows existing patterns in the codebase and provides comprehensive error handling, user feedback, and audit capabilities.
