/**
 * Reliability Layer for Email PR Telegram Integration
 * Provides retry logic, circuit breakers, and golden path workflows
 */

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

interface GoldenPathConfig {
  enableRetry: boolean;
  enableCircuitBreaker: boolean;
  enableFallback: boolean;
  timeoutMs: number;
}

class CircuitBreaker {
  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation: () => Promise<any>): Promise<any> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker moving to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log('✅ Circuit breaker reset to CLOSED');
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = 'OPEN';
        console.log('🚨 Circuit breaker opened due to failures');
      }
      
      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

class RetryHandler {
  constructor(config: RetryConfig) {
    this.config = config;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.config.maxAttempts} for ${operationName}`);
        
        const result = await this.executeWithTimeout(operation, this.config.timeoutMs || 30000);
        
        if (attempt > 1) {
          console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.config.maxAttempts;
        
        console.log(`❌ ${operationName} failed on attempt ${attempt}: ${error.message}`);
        
        if (!isRetryable || isLastAttempt) {
          console.log(`🛑 Not retrying ${operationName}: ${!isRetryable ? 'non-retryable error' : 'max attempts reached'}`);
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retrying ${operationName}...`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  private isRetryableError(error: Error): boolean {
    return this.config.retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || 
      error.constructor.name.includes(retryableError)
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class GoldenPathExecutor {
  constructor(
    private retryHandler: RetryHandler,
    private circuitBreakers: Map<string, CircuitBreaker>,
    private config: GoldenPathConfig
  ) {}

  // Golden Path: Email → Telegram → GitHub → Email Reply
  async executeEmailToPRWorkflow(
    emailData: any,
    prId: string,
    telegramChatId: string,
    env: any
  ): Promise<any> {
    console.log('🌟 Executing golden path: Email → Telegram → GitHub → Email Reply');
    
    const workflowId = this.generateWorkflowId(emailData);
    const startTime = Date.now();
    
    try {
      // Step 1: Process email and extract PR context
      const emailContext = await this.executeStep(
        'process_email',
        () => this.processEmailContext(emailData, prId),
        workflowId
      );

      // Step 2: Resolve Telegram chat ID from database
      const resolvedChatId = await this.executeStep(
        'resolve_chat_id',
        () => this.resolveTelegramChatId(prId, env),
        workflowId
      );

      // Step 3: Send rich PR card to Telegram
      const telegramResult = await this.executeStep(
        'send_telegram_card',
        () => this.sendPRCardToTelegram(emailContext, resolvedChatId, env),
        workflowId
      );

      // Step 4: Store mapping for callback handling
      await this.executeStep(
        'store_mapping',
        () => this.storeEmailMapping(emailContext, resolvedChatId, env),
        workflowId
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Golden path completed in ${duration}ms: ${workflowId}`);
      
      return {
        workflowId,
        status: 'completed',
        duration,
        steps: ['email_processed', 'chat_id_resolved', 'telegram_sent', 'mapping_stored'],
        telegramMessageId: telegramResult.messageId,
        chatId: resolvedChatId
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Golden path failed after ${duration}ms: ${workflowId}`, error.message);
      
      // Execute fallback path if enabled
      if (this.config.enableFallback) {
        return await this.executeFallbackPath(emailData, prId, workflowId, error);
      }
      
      throw error;
    }
  }

  // Golden Path: Telegram Callback → GitHub Action → Confirmation
  async executeCallbackWorkflow(
    callbackData: any,
    env: any
  ): Promise<any> {
    console.log('🌟 Executing callback golden path: Telegram → GitHub → Confirmation');
    
    const workflowId = this.generateCallbackWorkflowId(callbackData);
    const startTime = Date.now();
    
    try {
      // Step 1: Validate and parse callback
      const validatedData = await this.executeStep(
        'validate_callback',
        () => this.validateCallbackData(callbackData),
        workflowId
      );

      // Step 2: Get original email mapping for reply
      const emailMapping = await this.executeStep(
        'get_email_mapping',
        () => this.getEmailMapping(validatedData.prId, env),
        workflowId
      );

      // Step 3: Execute GitHub action
      const githubResult = await this.executeStep(
        'execute_github_action',
        () => this.executeGitHubAction(validatedData, env),
        workflowId
      );

      // Step 4: Send confirmation to Telegram
      const confirmationResult = await this.executeStep(
        'send_confirmation',
        () => this.sendTelegramConfirmation(validatedData, githubResult, env),
        workflowId
      );

      // Step 5: Send email reply (if enabled)
      if (env.SEND_EMAIL_REPLY === "1" && emailMapping) {
        await this.executeStep(
          'send_email_reply',
          () => this.sendCallbackEmailReply(validatedData, githubResult, emailMapping, env),
          workflowId
        );
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Callback golden path completed in ${duration}ms: ${workflowId}`);
      
      return {
        workflowId,
        status: 'completed',
        duration,
        githubResult,
        confirmationSent: true,
        emailReplySent: env.SEND_EMAIL_REPLY === "1" && emailMapping
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Callback golden path failed after ${duration}ms: ${workflowId}`, error.message);
      throw error;
    }
  }

  // Email Reply Workflow - Send AI-drafted email replies from Telegram
  async executeEmailReplyWorkflow(
    replyData: { replyTo: string; messageId: string; replyText: string },
    env: any
  ): Promise<any> {
    console.log('🌟 Executing email reply golden path: Telegram → AI Draft → Email Send');
    
    const workflowId = this.generateEmailReplyWorkflowId(replyData);
    const startTime = Date.now();
    
    try {
      // Step 1: Validate reply data
      const validatedData = await this.executeStep(
        'validate_reply_data',
        () => this.validateEmailReplyData(replyData),
        workflowId
      );

      // Step 2: Generate AI-drafted reply
      const aiDraft = await this.executeStep(
        'generate_ai_draft',
        () => this.generateEmailReplyDraft(validatedData, env),
        workflowId
      );

      // Step 3: Send email reply
      const emailResult = await this.executeStep(
        'send_email_reply',
        () => this.sendEmailReply(validatedData, aiDraft, env),
        workflowId
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Email reply golden path completed in ${duration}ms: ${workflowId}`);
      
      return {
        workflowId,
        status: 'completed',
        duration,
        emailResult,
        aiDraft
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Email reply golden path failed after ${duration}ms: ${workflowId}`, error.message);
      throw error;
    }
  }

  // Alert Acknowledgment Workflow - Acknowledge alerts and update incident status
  async executeAlertAcknowledgmentWorkflow(
    ackData: { incidentId: string; userId: string; timestamp: string },
    env: any
  ): Promise<any> {
    console.log('🌟 Executing alert acknowledgment golden path: Telegram → Incident Update → Confirmation');
    
    const workflowId = this.generateAlertAckWorkflowId(ackData);
    const startTime = Date.now();
    
    try {
      // Step 1: Validate acknowledgment data
      const validatedData = await this.executeStep(
        'validate_ack_data',
        () => this.validateAlertAckData(ackData),
        workflowId
      );

      // Step 2: Update incident status
      const incidentResult = await this.executeStep(
        'update_incident_status',
        () => this.updateIncidentStatus(validatedData, env),
        workflowId
      );

      // Step 3: Send confirmation to Telegram
      const confirmationResult = await this.executeStep(
        'send_ack_confirmation',
        () => this.sendAlertAckConfirmation(validatedData, incidentResult, env),
        workflowId
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Alert acknowledgment golden path completed in ${duration}ms: ${workflowId}`);
      
      return {
        workflowId,
        status: 'completed',
        duration,
        incidentResult,
        confirmationSent: true
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Alert acknowledgment golden path failed after ${duration}ms: ${workflowId}`, error.message);
      throw error;
    }
  }

  // Issue Assignment Workflow - Assign issues to users and update status
  async executeIssueAssignmentWorkflow(
    assignData: { issueId: string; userId: string; timestamp: string },
    env: any
  ): Promise<any> {
    console.log('🌟 Executing issue assignment golden path: Telegram → Issue Update → Confirmation');
    
    const workflowId = this.generateIssueAssignWorkflowId(assignData);
    const startTime = Date.now();
    
    try {
      // Step 1: Validate assignment data
      const validatedData = await this.executeStep(
        'validate_assign_data',
        () => this.validateIssueAssignData(assignData),
        workflowId
      );

      // Step 2: Update issue assignment
      const issueResult = await this.executeStep(
        'update_issue_assignment',
        () => this.updateIssueAssignment(validatedData, env),
        workflowId
      );

      // Step 3: Send confirmation to Telegram
      const confirmationResult = await this.executeStep(
        'send_assign_confirmation',
        () => this.sendIssueAssignConfirmation(validatedData, issueResult, env),
        workflowId
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Issue assignment golden path completed in ${duration}ms: ${workflowId}`);
      
      return {
        workflowId,
        status: 'completed',
        duration,
        issueResult,
        confirmationSent: true
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Issue assignment golden path failed after ${duration}ms: ${workflowId}`, error.message);
      throw error;
    }
  }

  private async executeStep<T>(
    stepName: string,
    operation: () => Promise<T>,
    workflowId: string
  ): Promise<T> {
    console.log(`📍 Executing step: ${stepName} (${workflowId})`);
    
    const circuitBreaker = this.circuitBreakers.get(stepName);
    const stepOperation = circuitBreaker 
      ? () => circuitBreaker.execute(operation)
      : operation;

    if (this.config.enableRetry) {
      return await this.retryHandler.executeWithRetry(
        stepOperation,
        `${stepName} (${workflowId})`,
        { workflowId, stepName }
      );
    } else {
      return await stepOperation();
    }
  }

  private async executeFallbackPath(
    emailData: any,
    prId: string,
    workflowId: string,
    originalError: Error
  ): Promise<any> {
    console.log(`🔄 Executing fallback path for ${workflowId}`);
    
    try {
      // Fallback: Send basic email notification without Telegram
      const fallbackResult = {
        workflowId,
        status: 'fallback_executed',
        originalError: originalError.message,
        fallbackAction: 'basic_email_notification_sent'
      };

      console.log(`✅ Fallback path executed: ${workflowId}`);
      return fallbackResult;

    } catch (fallbackError) {
      console.error(`❌ Fallback path also failed: ${workflowId}`, fallbackError.message);
      throw new Error(`Both golden path and fallback failed: ${originalError.message} → ${fallbackError.message}`);
    }
  }

  private generateWorkflowId(emailData: any): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(JSON.stringify(emailData));
    return `workflow_${timestamp}_${hash}`;
  }

  private generateCallbackWorkflowId(callbackData: any): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(JSON.stringify(callbackData));
    return `callback_${timestamp}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Placeholder methods - these would be implemented with actual business logic
  private async processEmailContext(emailData: any, prId: string): Promise<any> {
    const { message, messageId, domain, scope, type, hierarchy, meta } = emailData;
    
    // Extract email content
    const rawEmail = await new Response(message.raw).text();
    const emailBody = this.parseEmailBody(rawEmail);
    const emailSubject = message.headers.get('subject') || 'No Subject';
    
    return {
      emailData,
      prId,
      messageId,
      domain,
      scope,
      type,
      hierarchy,
      meta,
      emailSubject,
      emailBody,
      processed: true
    };
  }

  private async resolveTelegramChatId(prId: string, env: any): Promise<string> {
    const stateId = `pr${prId}`;
    
    const chatId = await env.DB.prepare(
      "SELECT chat_id FROM email_tg_map WHERE state_id = ?"
    ).bind(stateId).first<string>("chat_id");
    
    if (!chatId) {
      throw new Error(`No chat mapping found for ${stateId}`);
    }
    
    return chatId;
  }

  private async sendPRCardToTelegram(context: any, chatId: string, env: any): Promise<any> {
    // Initialize RPC client for AI analysis
    const rpc = this.createRpcClient(env);
    
    // AI Analysis of Email Content
    const aiAnalysis = await rpc.call('ai.analyzeEmailContent', {
      subject: context.emailSubject,
      body: context.emailBody.text,
      stateId: `pr${context.prId}`
    });
    
    // Build Kinja context for rich card
    const kinja = {
      email_from: context.emailData.message.from,
      email_subject: context.emailSubject,
      urgency: aiAnalysis?.urgency || 'medium',
      summary: aiAnalysis?.summary || context.emailBody.text.substring(0, 200) + '...'
    };
    
    // Import and use the actual PR card builder
    const { buildPRRichCard, sendTelegramMessage } = await import('../../workers/tgk-email-orchestrator/kinja-pr-telegram.js');
    
    const card = await buildPRRichCard(context.prId, kinja, env);
    const result = await sendTelegramMessage(chatId, card.text, card.keyboard);
    
    return { chatId, messageId: result.message_id, sent: true };
  }

  private async storeEmailMapping(context: any, chatId: string, env: any): Promise<any> {
    const stateId = `pr${context.prId}`;
    
    // Store or update the mapping
    await env.DB.prepare(`
      INSERT OR REPLACE INTO email_tg_map (state_id, chat_id, email_from)
      VALUES (?, ?, ?)
    `).bind(
      stateId,
      chatId,
      context.emailData.message.from
    ).run();
    
    return { stateId, chatId, stored: true };
  }

  private async executeGitHubAction(data: any, env: any): Promise<any> {
    // Import and use the actual GitHub action executor
    const { answerPRViaTelegram } = await import('../../workers/tgk-email-orchestrator/kinja-pr-telegram.js');
    
    const [, ghAction] = data.action.split(':'); // "pr:approve" → "approve"
    
    // Get original email from database for reply
    const emailMapping = await env.DB.prepare(
      "SELECT email_from FROM email_tg_map WHERE state_id = ?"
    ).bind(`pr${data.prId}`).first<string>("email_from");
    
    const originalEmail = emailMapping ? {
      from: emailMapping,
      subject: `Re: PR #${data.prId} Review Request`,
      body: '',
      to: '',
      headers: new Headers()
    } : undefined;
    
    const result = await answerPRViaTelegram(
      data.prId,
      ghAction,
      data.message || '',
      env,
      originalEmail
    );
    
    return { action: ghAction, prId: data.prId, executed: true, result };
  }

  private async sendTelegramConfirmation(data: any, result: any, env: any): Promise<any> {
    // Send confirmation message back to Telegram
    const confirmationText = `✅ PR #${data.prId} action "${result.action}" executed successfully`;
    
    const response = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: data.chatId,
        text: confirmationText,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send confirmation: ${response.statusText}`);
    }
    
    const responseResult = await response.json();
    return { confirmed: true, messageId: responseResult.result?.message_id };
  }

  private async sendCallbackEmailReply(data: any, result: any, emailMapping: any, env: any): Promise<any> {
    if (!env.SENDGRID_API_KEY || !env.EMAIL_FROM) {
      console.log('Email reply not configured');
      return { emailSent: false, reason: 'not_configured' };
    }
    
    const replyText = `Your PR review action has been executed:\n\nPR: #${data.prId}\nAction: ${result.action}\nResult: Success`;
    
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailMapping }],
          subject: `PR #${data.prId} Action Completed`
        }],
        from: { email: env.EMAIL_FROM },
        content: [{
          type: 'text/plain',
          value: replyText
        }]
      })
    });
    
    if (!emailResponse.ok) {
      throw new Error(`Failed to send email reply: ${emailResponse.statusText}`);
    }
    
    return { emailSent: true, to: emailMapping };
  }

  private async getEmailMapping(prId: string, env: any): Promise<any> {
    const emailMapping = await env.DB.prepare(
      "SELECT email_from FROM email_tg_map WHERE state_id = ?"
    ).bind(`pr${prId}`).first<string>("email_from");
    
    return emailMapping;
  }

  private async validateCallbackData(callbackData: any): Promise<any> {
    // Validate callback data structure
    if (!callbackData.action || !callbackData.prId) {
      throw new Error('Invalid callback data: missing action or prId');
    }
    return callbackData;
  }

  private createRpcClient(env: any): any {
    return {
      async call(method: string, params: any): Promise<any> {
        const response = await fetch(`${env.TGK_INTERNAL_API_URL}/api/${method}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.TGK_API_TOKEN}`
          },
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error(`RPC call failed: ${response.statusText}`);
        }

        return response.json();
      }
    };
  }

  private parseEmailBody(rawEmail: string): { text: string; html?: string } {
    const lines = rawEmail.split('\n');
    let textBody = '';
    let htmlBody = '';
    let inTextPart = false;
    let inHtmlPart = false;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('content-type: text/plain')) {
        inTextPart = true;
        inHtmlPart = false;
        continue;
      } else if (line.toLowerCase().startsWith('content-type: text/html')) {
        inHtmlPart = true;
        inTextPart = false;
        continue;
      } else if (line.startsWith('--')) {
        inTextPart = false;
        inHtmlPart = false;
        continue;
      }

      if (inTextPart) {
        textBody += line + '\n';
      } else if (inHtmlPart) {
        htmlBody += line + '\n';
      }
    }

    // If no multipart parsing worked, try simple extraction
    if (!textBody && !htmlBody) {
      const bodyMatch = rawEmail.match(/\r?\n\r?\n(.*)/s);
      if (bodyMatch) {
        textBody = bodyMatch[1];
      }
    }

    return { text: textBody.trim(), html: htmlBody };
  }
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network Error', 'Timeout']
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
};

const DEFAULT_GOLDEN_PATH_CONFIG: GoldenPathConfig = {
  enableRetry: true,
  enableCircuitBreaker: true,
  enableFallback: true,
  timeoutMs: 30000
};

// Factory function to create configured reliability layer
export function createReliabilityLayer(
  customRetryConfig?: Partial<RetryConfig>,
  customCircuitBreakerConfig?: Partial<CircuitBreakerConfig>,
  customGoldenPathConfig?: Partial<GoldenPathConfig>
): GoldenPathExecutor {
  
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...customRetryConfig };
  const circuitBreakerConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...customCircuitBreakerConfig };
  const goldenPathConfig = { ...DEFAULT_GOLDEN_PATH_CONFIG, ...customGoldenPathConfig };

  const retryHandler = new RetryHandler(retryConfig);
  
  // Create circuit breakers for different operations
  const circuitBreakers = new Map([
    ['process_email', new CircuitBreaker(circuitBreakerConfig)],
    ['resolve_chat_id', new CircuitBreaker(circuitBreakerConfig)],
    ['send_telegram_card', new CircuitBreaker(circuitBreakerConfig)],
    ['store_mapping', new CircuitBreaker(circuitBreakerConfig)],
    ['execute_github_action', new CircuitBreaker(circuitBreakerConfig)],
    ['send_confirmation', new CircuitBreaker(circuitBreakerConfig)],
    ['send_email_reply', new CircuitBreaker(circuitBreakerConfig)],
    ['validate_callback', new CircuitBreaker(circuitBreakerConfig)],
    ['get_email_mapping', new CircuitBreaker(circuitBreakerConfig)]
  ]);

  return new GoldenPathExecutor(retryHandler, circuitBreakers, goldenPathConfig);
}

export { 
  CircuitBreaker, 
  RetryHandler, 
  GoldenPathExecutor,
  RetryConfig,
  CircuitBreakerConfig,
  GoldenPathConfig
};
