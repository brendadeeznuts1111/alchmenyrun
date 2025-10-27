export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    ai_service: CheckResult;
    telegram: CheckResult;
    database: CheckResult;
    opa: CheckResult;
  };
  uptime: number;
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  response_time?: number;
  last_check: string;
}

export interface HealthCheckService {
  check(): Promise<HealthStatus>;
}

export function createHealthCheck(env: any): HealthCheckService {
  const startTime = Date.now();

  return {
    async check(): Promise<HealthStatus> {
      const timestamp = new Date().toISOString();
      const uptime = Date.now() - startTime;

      // Run all health checks in parallel
      const [aiService, telegram, database, opa] = await Promise.all([
        checkAIService(env),
        checkTelegram(env),
        checkDatabase(env),
        checkOPA(env)
      ]);

      // Determine overall status
      const allChecks = [aiService, telegram, database, opa];
      const hasFailures = allChecks.some(check => check.status === 'fail');
      const hasWarnings = allChecks.some(check => check.status === 'warn');

      const overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 
        hasFailures ? 'unhealthy' : 
        hasWarnings ? 'degraded' : 'healthy';

      return {
        status: overallStatus,
        timestamp,
        version: '1.0.0',
        checks: {
          ai_service: aiService,
          telegram,
          database,
          opa
        },
        uptime
      };
    }
  };
}

async function checkAIService(env: any): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // Simple AI service health check - try to create AI instance
    const { Ai } = await import('@cloudflare/ai');
    const ai = new Ai(env.AI);
    
    // Test with a simple prompt
    await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt: 'test',
      max_tokens: 1
    });

    return {
      status: 'pass',
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `AI service unavailable: ${error.message}`,
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  }
}

async function checkTelegram(env: any): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // Check Telegram bot health
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const botInfo = await response.json();
      return {
        status: 'pass',
        message: `Bot: ${botInfo.result?.username || 'Unknown'}`,
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    } else {
      return {
        status: 'fail',
        message: `Telegram API error: ${response.status}`,
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Telegram check failed: ${error.message}`,
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  }
}

async function checkDatabase(env: any): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // Check D1 database connectivity
    if (!env.D12) {
      return {
        status: 'warn',
        message: 'D1 database not configured',
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    }

    // Simple database health check - try to prepare a statement
    const stmt = env.D12.prepare('SELECT 1 as test');
    await stmt.first();

    return {
      status: 'pass',
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${error.message}`,
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  }
}

async function checkOPA(env: any): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // Check OPA service health
    const response = await fetch(`${env.OPA}/v1/data/system/info`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return {
        status: 'pass',
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    } else {
      return {
        status: 'fail',
        message: `OPA service error: ${response.status}`,
        response_time: Date.now() - startTime,
        last_check: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `OPA check failed: ${error.message}`,
      response_time: Date.now() - startTime,
      last_check: new Date().toISOString()
    };
  }
}
