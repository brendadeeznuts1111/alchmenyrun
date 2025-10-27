export interface GrammarParseResult {
  valid: boolean;
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
  meta: string;
  stateId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  severity: 'critical' | 'high' | 'medium' | 'low';
  error?: string;
}

export interface GrammarConfig {
  domain: string;
  scope: string;
  type: string;
  hierarchy: string;
  meta: string;
  stateId?: string;
}

// Grammar parsing: [DOMAIN].[SCOPE].[TYPE].[HIERARCHY].[META].[STATE_ID_OPTIONAL]
export function parseEmailGrammar(emailAddress: string): GrammarParseResult {
  try {
    // Validate basic email format
    const emailRegex = /^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    const match = emailAddress.match(emailRegex);
    
    if (!match) {
      return { valid: false, domain: '', scope: '', type: '', hierarchy: '', meta: '', stateId: '', priority: 'medium', severity: 'medium', error: 'Invalid email format' };
    }

    const localPart = match[1].toLowerCase();
    const parts = localPart.split('.');
    
    if (parts.length < 3) {
      return { valid: false, domain: '', scope: '', type: '', hierarchy: '', meta: '', stateId: '', priority: 'medium', severity: 'medium', error: 'Insufficient grammar parts' };
    }

    const [domain, scope, type, hierarchy = 'general', meta = 'normal', stateId = ''] = parts;

    // Validate each component
    const validation = validateGrammarComponents({ domain, scope, type, hierarchy, meta });
    if (!validation.valid) {
      return { valid: false, domain, scope, type, hierarchy, meta, stateId, priority: 'medium', severity: 'medium', error: validation.error };
    }

    return {
      valid: true,
      domain,
      scope,
      type,
      hierarchy,
      meta,
      stateId,
      priority: extractPriority(meta),
      severity: extractSeverity(hierarchy)
    };
  } catch (error: any) {
    return { valid: false, domain: '', scope: '', type: '', hierarchy: '', meta: '', stateId: '', priority: 'medium', severity: 'medium', error: error.message };
  }
}

export function generateEmailGrammar(config: GrammarConfig): string {
  const validation = validateGrammarComponents(config);
  if (!validation.valid) {
    throw new Error(`Invalid grammar config: ${validation.error}`);
  }

  const localPart = `${config.domain}.${config.scope}.${config.type}.${config.hierarchy}.${config.meta}`;
  const withStateId = config.stateId ? `${localPart}.${config.stateId}` : localPart;
  
  return `${withStateId}@cloudflare.com`;
}

export function validateGrammarComponents(components: Partial<GrammarConfig>): ValidationResult {
  const errors: string[] = [];

  // Validate domain
  if (components.domain && !GRAMMAR_RULES.domains.includes(components.domain)) {
    errors.push(`Invalid domain '${components.domain}'. Must be one of: ${GRAMMAR_RULES.domains.join(', ')}`);
  }

  // Validate scope
  if (components.scope && !GRAMMAR_RULES.scopes.includes(components.scope)) {
    errors.push(`Invalid scope '${components.scope}'. Must be one of: ${GRAMMAR_RULES.scopes.join(', ')}`);
  }

  // Validate type
  if (components.type && !GRAMMAR_RULES.types.includes(components.type)) {
    errors.push(`Invalid type '${components.type}'. Must be one of: ${GRAMMAR_RULES.types.join(', ')}`);
  }

  // Validate hierarchy
  if (components.hierarchy && !GRAMMAR_RULES.hierarchies.includes(components.hierarchy)) {
    errors.push(`Invalid hierarchy '${components.hierarchy}'. Must be one of: ${GRAMMAR_RULES.hierarchies.join(', ')}`);
  }

  // Validate meta
  if (components.meta && !isValidMeta(components.meta)) {
    errors.push(`Invalid meta '${components.meta}'. Must match pattern: ${GRAMMAR_RULES.metaPatterns.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : undefined,
    errors,
    suggestions: errors.length > 0 ? generateSuggestions(components) : []
  };
}

// Grammar rules and constants
export const GRAMMAR_RULES = {
  domains: ['support', 'ops', 'dev', 'security', 'customer', 'partner', 'vendor'],
  scopes: ['internal', 'customer', 'partner', 'vendor', 'public', 'private'],
  types: ['issue', 'request', 'alert', 'incident', 'question', 'update', 'notification'],
  hierarchies: ['critical', 'urgent', 'high', 'normal', 'low', 'info', 'general'],
  metaPatterns: ['p0', 'p1', 'p2', 'p3', 'urgent', 'normal', 'batch', 'immediate']
} as const;

// Helper functions
function extractPriority(meta: string): GrammarParseResult['priority'] {
  if (meta.includes('p0') || meta.includes('critical') || meta.includes('urgent')) return 'critical';
  if (meta.includes('p1') || meta.includes('high')) return 'high';
  if (meta.includes('p2') || meta.includes('normal')) return 'medium';
  if (meta.includes('p3') || meta.includes('low')) return 'low';
  return 'medium';
}

function extractSeverity(hierarchy: string): GrammarParseResult['severity'] {
  if (hierarchy === 'critical') return 'critical';
  if (hierarchy === 'urgent' || hierarchy === 'high') return 'high';
  if (hierarchy === 'normal') return 'medium';
  if (hierarchy === 'low' || hierarchy === 'info') return 'low';
  return 'medium';
}

function isValidMeta(meta: string): boolean {
  return GRAMMAR_RULES.metaPatterns.some(pattern => meta.includes(pattern));
}

function generateSuggestions(components: Partial<GrammarConfig>): string[] {
  const suggestions: string[] = [];
  
  if (components.domain && !GRAMMAR_RULES.domains.includes(components.domain)) {
    suggestions.push(`Did you mean: ${findClosestMatch(components.domain, GRAMMAR_RULES.domains)}?`);
  }
  
  if (components.scope && !GRAMMAR_RULES.scopes.includes(components.scope)) {
    suggestions.push(`Did you mean: ${findClosestMatch(components.scope, GRAMMAR_RULES.scopes)}?`);
  }
  
  return suggestions;
}

function findClosestMatch(input: string, options: readonly string[]): string {
  // Simple Levenshtein distance implementation
  let closest = options[0];
  let minDistance = calculateLevenshteinDistance(input, options[0]);
  
  for (const option of options) {
    const distance = calculateLevenshteinDistance(input, option);
    if (distance < minDistance) {
      minDistance = distance;
      closest = option;
    }
  }
  
  return closest;
}

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors: string[];
  suggestions: string[];
}
