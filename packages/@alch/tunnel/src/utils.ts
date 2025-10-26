/**
 * Utility functions for Tunnel resource
 * Includes secret redaction and logging helpers
 */

/**
 * Redact sensitive information from strings for logging
 */
export function redactSecrets(input: string): string {
  if (!input) return input;
  
  // Redact potential API tokens
  let redacted = input.replace(/([A-Za-z0-9_-]{40,})/g, '[REDACTED_TOKEN]');
  
  // Redact potential tunnel secrets
  redacted = redacted.replace(/([A-Za-z0-9+/]{32,}={0,2})/g, '[REDACTED_SECRET]');
  
  // Redact potential account IDs
  redacted = redacted.replace(/\b[a-f0-9]{32}\b/g, '[REDACTED_ACCOUNT]');
  
  return redacted;
}

/**
 * Redact secrets from objects for logging
 */
export function redactObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in redacted) {
    if (typeof redacted[key] === 'string') {
      redacted[key] = redactSecrets(redacted[key]);
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactObject(redacted[key]);
    }
  }
  
  return redacted;
}

/**
 * Create a safe logger that redacts secrets
 */
export function createSafeLogger(baseLogger: any) {
  return {
    log: (message: string, ...args: any[]) => {
      const safeArgs = args.map(arg => 
        typeof arg === 'string' ? redactSecrets(arg) : redactObject(arg)
      );
      baseLogger.log(redactSecrets(message), ...safeArgs);
    },
    error: (message: string, ...args: any[]) => {
      const safeArgs = args.map(arg => 
        typeof arg === 'string' ? redactSecrets(arg) : redactObject(arg)
      );
      baseLogger.error(redactSecrets(message), ...safeArgs);
    },
    warn: (message: string, ...args: any[]) => {
      const safeArgs = args.map(arg => 
        typeof arg === 'string' ? redactSecrets(arg) : redactObject(arg)
      );
      baseLogger.warn(redactSecrets(message), ...safeArgs);
    },
    debug: (message: string, ...args: any[]) => {
      const safeArgs = args.map(arg => 
        typeof arg === 'string' ? redactSecrets(arg) : redactObject(arg)
      );
      baseLogger.debug(redactSecrets(message), ...safeArgs);
    }
  };
}

/**
 * Validate Cloudflare API token format
 */
export function validateApiToken(token: string): boolean {
  // Cloudflare API tokens are typically 40+ characters alphanumeric
  return /^[A-Za-z0-9_-]{40,}$/.test(token);
}

/**
 * Validate Cloudflare account ID format
 */
export function validateAccountId(accountId: string): boolean {
  // Cloudflare account IDs are 32 character hex strings
  return /^[a-f0-9]{32}$/.test(accountId);
}

/**
 * Generate a safe tunnel name
 */
export function generateSafeTunnelName(baseName: string): string {
  // Remove invalid characters and ensure length limits
  const safe = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  return safe || 'tunnel';
}

/**
 * Create tunnel credentials file with redacted logging
 */
export function createTunnelCredentials(tunnelId: string, accountTag: string, tunnelName: string, tunnelSecret: string) {
  const credentials = {
    AccountTag: accountTag,
    TunnelID: tunnelId,
    TunnelName: tunnelName,
    TunnelSecret: tunnelSecret
  };
  
  return {
    credentials,
    // Safe version for logging
    safeCredentials: redactObject(credentials)
  };
}
