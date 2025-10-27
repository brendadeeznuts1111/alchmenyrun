/**
 * Reliability Layer for Email PR Telegram Integration (Test Version)
 * Provides retry logic, circuit breakers, and golden path workflows
 */

class CircuitBreaker {
  constructor(config) {
    this.config = config;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation) {
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

  getState() {
    return this.state;
  }

  getFailureCount() {
    return this.failureCount;
  }
}

class RetryHandler {
  constructor(config) {
    this.config = config;
  }

  async executeWithRetry(operation, operationName, context) {
    let lastError;
    
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

  async executeWithTimeout(operation, timeoutMs) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  isRetryableError(error) {
    return this.config.retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || 
      error.constructor.name.includes(retryableError)
    );
  }

  calculateDelay(attempt) {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class GoldenPathExecutor {
  constructor(retryHandler, circuitBreakers, config) {
    this.retryHandler = retryHandler;
    this.circuitBreakers = circuitBreakers;
    this.config = config;
  }

  // Golden Path: Email → Telegram → GitHub → Email Reply
  async executeEmailToPRWorkflow(emailData, prId, telegramChatId, env) {
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
  async executeCallbackWorkflow(callbackData, env) {
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

  async executeStep(stepName, operation, workflowId) {
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

  async executeFallbackPath(emailData, prId, workflowId, originalError) {
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

  generateWorkflowId(emailData) {
    const timestamp = Date.now();
    const hash = this.simpleHash(JSON.stringify(emailData));
    return `workflow_${timestamp}_${hash}`;
  }

  generateCallbackWorkflowId(callbackData) {
    const timestamp = Date.now();
    const hash = this.simpleHash(JSON.stringify(callbackData));
    return `callback_${timestamp}_${hash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Placeholder methods for testing
  async processEmailContext(emailData, prId) {
    return { emailData, prId, processed: true };
  }

  async resolveTelegramChatId(prId, env) {
    return 'test-chat-id';
  }

  async sendPRCardToTelegram(context, chatId, env) {
    return { chatId, messageId: 'test-message-id', sent: true };
  }

  async storeEmailMapping(context, chatId, env) {
    return { stateId: `pr${context.prId}`, chatId, stored: true };
  }

  async executeGitHubAction(data, env) {
    return { action: data.action, prId: data.prId, executed: true };
  }

  async sendTelegramConfirmation(data, result, env) {
    return { confirmed: true, messageId: 'test-confirmation-id' };
  }

  async sendCallbackEmailReply(data, result, emailMapping, env) {
    return { emailSent: true, to: emailMapping };
  }

  async getEmailMapping(prId, env) {
    return 'test@example.com';
  }

  async validateCallbackData(callbackData) {
    if (!callbackData.action || !callbackData.prId) {
      throw new Error('Invalid callback data: missing action or prId');
    }
    return callbackData;
  }
}

// Default configurations
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network Error', 'Timeout']
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
};

const DEFAULT_GOLDEN_PATH_CONFIG = {
  enableRetry: true,
  enableCircuitBreaker: true,
  enableFallback: true,
  timeoutMs: 30000
};

// Factory function to create configured reliability layer
function createReliabilityLayer(customRetryConfig, customCircuitBreakerConfig, customGoldenPathConfig) {
  
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

module.exports = {
  CircuitBreaker,
  RetryHandler,
  GoldenPathExecutor,
  createReliabilityLayer,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_GOLDEN_PATH_CONFIG
};
