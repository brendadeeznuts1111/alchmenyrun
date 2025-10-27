import { describe, it, expect } from 'vitest';
import {
  parseEmailGrammar,
  generateEmailGrammar,
  validateGrammarComponents,
  GRAMMAR_RULES,
  GrammarParseResult,
  GrammarConfig
} from '../grammar-parser';

describe('Grammar Parser', () => {
  describe('parseEmailGrammar', () => {
    it('should parse a valid email address correctly', () => {
      const email = 'support.customer.issue.high.p2.web@cloudflare.com';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(true);
      expect(result.domain).toBe('support');
      expect(result.scope).toBe('customer');
      expect(result.type).toBe('issue');
      expect(result.hierarchy).toBe('high');
      expect(result.meta).toBe('p2');
      expect(result.stateId).toBe('web');
      expect(result.priority).toBe('medium');
      expect(result.severity).toBe('high');
    });

    it('should parse email with all components including state ID', () => {
      const email = 'ops.internal.incident.critical.p0.abc123@cloudflare.com';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(true);
      expect(result.domain).toBe('ops');
      expect(result.scope).toBe('internal');
      expect(result.type).toBe('incident');
      expect(result.hierarchy).toBe('critical');
      expect(result.meta).toBe('p0');
      expect(result.stateId).toBe('abc123');
      expect(result.priority).toBe('critical');
      expect(result.severity).toBe('critical');
    });

    it('should handle default values for missing components', () => {
      const email = 'dev.internal.question@cloudflare.com';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(true);
      expect(result.domain).toBe('dev');
      expect(result.scope).toBe('internal');
      expect(result.type).toBe('question');
      expect(result.hierarchy).toBe('general');
      expect(result.meta).toBe('normal');
      expect(result.stateId).toBe('');
    });

    it('should reject invalid email format', () => {
      const email = 'invalid-email';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject email with insufficient parts', () => {
      const email = 'support.customer@cloudflare.com';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient grammar parts');
    });

    it('should reject email with invalid domain', () => {
      const email = 'invalid.customer.issue.high.p2.web@cloudflare.com';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid domain');
    });

    it('should be case insensitive', () => {
      const email = 'SUPPORT.CUSTOMER.ISSUE.HIGH.P2.WEB@CLOUDFLARE.COM';
      const result = parseEmailGrammar(email);

      expect(result.valid).toBe(true);
      expect(result.domain).toBe('support');
      expect(result.scope).toBe('customer');
    });
  });

  describe('generateEmailGrammar', () => {
    it('should generate a valid email address', () => {
      const config: GrammarConfig = {
        domain: 'support',
        scope: 'customer',
        type: 'issue',
        hierarchy: 'high',
        meta: 'p1'
      };

      const email = generateEmailGrammar(config);
      expect(email).toBe('support.customer.issue.high.p1@cloudflare.com');
    });

    it('should generate email with state ID', () => {
      const config: GrammarConfig = {
        domain: 'ops',
        scope: 'internal',
        type: 'incident',
        hierarchy: 'critical',
        meta: 'p0',
        stateId: 'abc123'
      };

      const email = generateEmailGrammar(config);
      expect(email).toBe('ops.internal.incident.critical.p0.abc123@cloudflare.com');
    });

    it('should throw error for invalid config', () => {
      const config = {
        domain: 'invalid',
        scope: 'customer',
        type: 'issue',
        hierarchy: 'high',
        meta: 'p1'
      };

      expect(() => generateEmailGrammar(config)).toThrow('Invalid grammar config');
    });
  });

  describe('validateGrammarComponents', () => {
    it('should validate all valid components', () => {
      const components = {
        domain: 'support',
        scope: 'customer',
        type: 'issue',
        hierarchy: 'critical',
        meta: 'p0'
      };

      const result = validateGrammarComponents(components);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should detect invalid domain', () => {
      const components = {
        domain: 'invalid',
        scope: 'customer',
        type: 'issue',
        hierarchy: 'high',
        meta: 'p1'
      };

      const result = validateGrammarComponents(components);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid domain');
      expect(result.suggestions).toHaveLength(1);
    });

    it('should detect multiple invalid components', () => {
      const components = {
        domain: 'invalid',
        scope: 'wrong',
        type: 'bad',
        hierarchy: 'terrible',
        meta: 'awful'
      };

      const result = validateGrammarComponents(components);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.suggestions.length).toBeGreaterThan(1);
    });

    it('should validate partial components', () => {
      const components = {
        domain: 'support',
        scope: 'customer'
      };

      const result = validateGrammarComponents(components);
      expect(result.valid).toBe(true);
    });
  });

  describe('Priority and Severity extraction', () => {
    it('should extract critical priority from p0', () => {
      const email = 'support.customer.issue.high.p0@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.priority).toBe('critical');
    });

    it('should extract high priority from p1', () => {
      const email = 'support.customer.issue.high.p1@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.priority).toBe('high');
    });

    it('should extract medium priority from p2', () => {
      const email = 'support.customer.issue.high.p2@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.priority).toBe('medium');
    });

    it('should extract low priority from p3', () => {
      const email = 'support.customer.issue.high.p3@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.priority).toBe('low');
    });

    it('should extract critical severity from critical hierarchy', () => {
      const email = 'support.customer.issue.critical.p0@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.severity).toBe('critical');
    });

    it('should extract high severity from urgent hierarchy', () => {
      const email = 'support.customer.issue.urgent.p1@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.severity).toBe('high');
    });
  });

  describe('Grammar Rules', () => {
    it('should contain all required rule categories', () => {
      expect(GRAMMAR_RULES.domains).toBeDefined();
      expect(GRAMMAR_RULES.scopes).toBeDefined();
      expect(GRAMMAR_RULES.types).toBeDefined();
      expect(GRAMMAR_RULES.hierarchies).toBeDefined();
      expect(GRAMMAR_RULES.metaPatterns).toBeDefined();
    });

    it('should contain expected domain values', () => {
      expect(GRAMMAR_RULES.domains).toContain('support');
      expect(GRAMMAR_RULES.domains).toContain('ops');
      expect(GRAMMAR_RULES.domains).toContain('dev');
      expect(GRAMMAR_RULES.domains).toContain('security');
      expect(GRAMMAR_RULES.domains).toContain('customer');
      expect(GRAMMAR_RULES.domains).toContain('partner');
      expect(GRAMMAR_RULES.domains).toContain('vendor');
    });

    it('should contain expected scope values', () => {
      expect(GRAMMAR_RULES.scopes).toContain('internal');
      expect(GRAMMAR_RULES.scopes).toContain('customer');
      expect(GRAMMAR_RULES.scopes).toContain('partner');
      expect(GRAMMAR_RULES.scopes).toContain('vendor');
      expect(GRAMMAR_RULES.scopes).toContain('public');
      expect(GRAMMAR_RULES.scopes).toContain('private');
    });

    it('should contain expected type values', () => {
      expect(GRAMMAR_RULES.types).toContain('issue');
      expect(GRAMMAR_RULES.types).toContain('request');
      expect(GRAMMAR_RULES.types).toContain('alert');
      expect(GRAMMAR_RULES.types).toContain('incident');
      expect(GRAMMAR_RULES.types).toContain('question');
      expect(GRAMMAR_RULES.types).toContain('update');
      expect(GRAMMAR_RULES.types).toContain('notification');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string input', () => {
      const result = parseEmailGrammar('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should handle null input', () => {
      const result = parseEmailGrammar(null as any);
      expect(result.valid).toBe(false);
    });

    it('should handle email with dots in domain', () => {
      const email = 'support.customer.issue.high.p2.web@sub.cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.valid).toBe(true);
    });

    it('should handle email with special characters in local part', () => {
      const email = 'support+test.customer.issue.high.p2.web@cloudflare.com';
      const result = parseEmailGrammar(email);
      expect(result.valid).toBe(false); // Special characters not allowed in grammar parts
    });
  });
});
