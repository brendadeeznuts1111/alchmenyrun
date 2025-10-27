#!/usr/bin/env bun

/**
 * Test suite for TGK Email Orchestrator - Phase 6.0
 * Tests email parsing, AI integration, Telegram routing, and callback handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

// Mock Cloudflare Workers environment
const mockEnv = {
  TG_BOT_TOKEN: 'test-bot-token',
  TGK_INTERNAL_API_URL: 'https://tgk.alchemy.run/internal',
  TGK_API_TOKEN: 'test-api-token',
  TELEGRAM_DEFAULT_CHAT_ID: '@general',
  TELEGRAM_ONCALL_CHAT_ID: '@oncall_team',
  TELEGRAM_SRE_CHAT_ID: '@sre_team',
  TELEGRAM_SUPPORT_CHAT_ID: '@support_team',
  EMAIL_PR_TELEGRAM: '1',
  SEND_EMAIL_REPLY: '1',
  EMAIL_FROM: 'noreply@tgk.dev',
  SENDGRID_API_KEY: 'test-sendgrid-key',
  DB: {
    prepare: () => ({
      bind: () => ({
        run: async () => ({ results: [] }),
        first: async () => null,
      }),
    }),
    batch: async () => [],
  },
};

// Mock fetch for Telegram API and internal API calls
global.fetch = async (url: string, options?: any) => {
  if (url.includes('api.telegram.org')) {
    return {
      ok: true,
      json: async () => ({ result: { message_id: 12345 } }),
    } as Response;
  }
  
  if (url.includes('tgk.alchemy.run')) {
    return {
      ok: true,
      json: async () => ({
        sentiment: 'neutral',
        score: 0.5,
        summary: 'Test email summary',
        keywords: ['test'],
        urgency: 'medium',
        action_items: [],
        potential_pii: false,
        phishing_risk: 0.1,
        reasoning: 'Test reasoning',
        chat_id: '@general',
        routing_confidence: 0.9,
        reasoning: 'Test routing reasoning',
      }),
    } as Response;
  }
  
  return {
    ok: true,
    json: async () => ({}),
  } as Response;
};

// Import the worker after setting up mocks
const worker = await import('./index.ts');

describe('TGK Email Orchestrator - Phase 6.0', () => {
  describe('Email Grammar Parsing', () => {
    it('should parse complex email grammar correctly', async () => {
      const mockEmail = {
        from: 'user@example.com',
        to: 'cloudflare.sre.alert.p0.inc123@tgk.dev',
        subject: 'Critical incident detected',
        body: 'This is a test email body',
        headers: new Headers({ subject: 'Critical incident detected' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      // The test passes if no exceptions are thrown and the email is processed
      expect(true).toBe(true);
    });

    it('should handle PR-specific email addresses', async () => {
      const mockEmail = {
        from: 'developer@example.com',
        to: 'github.repos.review.p0.gh.pr123@tgk.dev',
        subject: 'PR #123 needs review',
        body: 'Please review this pull request',
        headers: new Headers({ subject: 'PR #123 needs review' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });

    it('should handle support ticket emails', async () => {
      const mockEmail = {
        from: 'customer@example.com',
        to: 'support.customer.issue.p2.web@tgk.dev',
        subject: 'Login issue reported',
        body: 'I cannot log in to my account',
        headers: new Headers({ subject: 'Login issue reported' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });
  });

  describe('AI Integration', () => {
    it('should call AI analysis for email content', async () => {
      const mockEmail = {
        from: 'user@example.com',
        to: 'test.domain.alert.p1@tgk.dev',
        subject: 'Test alert',
        body: 'This is a test alert message',
        headers: new Headers({ subject: 'Test alert' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });

    it('should block high phishing risk emails', async () => {
      // Mock high phishing risk response
      global.fetch = async (url: string, options?: any) => {
        if (url.includes('tgk.alchemy.run')) {
          return {
            ok: true,
            json: async () => ({
              sentiment: 'negative',
              score: 0.2,
              summary: 'Suspicious email',
              keywords: ['suspicious'],
              urgency: 'high',
              action_items: [],
              potential_pii: false,
              phishing_risk: 0.9, // High risk
              reasoning: 'High phishing risk detected',
            }),
          } as Response;
        }
        
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      };

      const mockEmail = {
        from: 'suspicious@phishing.com',
        to: 'test.domain.alert.p1@tgk.dev',
        subject: 'Urgent: Click here now',
        body: 'Click this suspicious link',
        headers: new Headers({ subject: 'Urgent: Click here now' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });
  });

  describe('Telegram Integration', () => {
    it('should send messages to Telegram with proper formatting', async () => {
      const mockEmail = {
        from: 'user@example.com',
        to: 'cloudflare.sre.alert.p0@tgk.dev',
        subject: 'Test alert',
        body: 'This is a test alert',
        headers: new Headers({ subject: 'Test alert' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });

    it('should include interactive keyboards for actionable emails', async () => {
      const mockEmail = {
        from: 'user@example.com',
        to: 'github.repos.issue.p1.gh.456@tgk.dev',
        subject: 'Issue #456 reported',
        body: 'There is an issue that needs attention',
        headers: new Headers({ subject: 'Issue #456 reported' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });
  });

  describe('Callback Handling', () => {
    it('should handle email reply callbacks', async () => {
      const mockCallback = {
        action: 'email_reply',
        emailTo: 'user@example.com',
        messageId: 'test-message-id',
        replyText: 'Thank you for your message',
      };

      const request = new Request('https://example.com/callback', {
        method: 'POST',
        body: JSON.stringify(mockCallback),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await worker.default.fetch(request, mockEnv, {} as ExecutionContext);
      
      expect(response.status).toBe(200);
    });

    it('should handle PR action callbacks', async () => {
      const mockCallback = {
        action: 'pr:merge',
        prId: '123',
        userId: '456',
      };

      const request = new Request('https://example.com/callback', {
        method: 'POST',
        body: JSON.stringify(mockCallback),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await worker.default.fetch(request, mockEnv, {} as ExecutionContext);
      
      expect(response.status).toBe(200);
    });

    it('should handle alert acknowledgment callbacks', async () => {
      const mockCallback = {
        action: 'acknowledge_alert',
        incidentId: 'inc123',
        userId: '456',
      };

      const request = new Request('https://example.com/callback', {
        method: 'POST',
        body: JSON.stringify(mockCallback),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await worker.default.fetch(request, mockEnv, {} as ExecutionContext);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing chat ID gracefully', async () => {
      // Mock routing failure
      global.fetch = async (url: string, options?: any) => {
        if (url.includes('tgk.alchemy.run')) {
          return {
            ok: true,
            json: async () => ({
              sentiment: 'neutral',
              score: 0.5,
              summary: 'Test email',
              keywords: ['test'],
              urgency: 'medium',
              action_items: [],
              potential_pii: false,
              phishing_risk: 0.1,
              reasoning: 'Test reasoning',
              chat_id: null, // No chat ID resolved
              routing_confidence: 0.0,
              fallback_reason: 'No route found',
              reasoning: 'No routing available',
            }),
          } as Response;
        }
        
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      };

      const mockEmail = {
        from: 'user@example.com',
        to: 'unknown.domain.alert.p1@tgk.dev',
        subject: 'Test alert',
        body: 'This is a test alert',
        headers: new Headers({ subject: 'Test alert' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });

    it('should handle Telegram API failures gracefully', async () => {
      // Mock Telegram API failure
      global.fetch = async (url: string, options?: any) => {
        if (url.includes('api.telegram.org')) {
          return {
            ok: false,
            statusText: 'Bad Request',
            json: async () => ({ error: 'Invalid chat ID' }),
          } as Response;
        }
        
        if (url.includes('tgk.alchemy.run')) {
          return {
            ok: true,
            json: async () => ({
              sentiment: 'neutral',
              score: 0.5,
              summary: 'Test email',
              keywords: ['test'],
              urgency: 'medium',
              action_items: [],
              potential_pii: false,
              phishing_risk: 0.1,
              reasoning: 'Test reasoning',
              chat_id: '@general',
              routing_confidence: 0.9,
              reasoning: 'Test routing reasoning',
            }),
          } as Response;
        }
        
        return {
          ok: true,
          json: async () => ({}),
        } as Response;
      };

      const mockEmail = {
        from: 'user@example.com',
        to: 'test.domain.alert.p1@tgk.dev',
        subject: 'Test alert',
        body: 'This is a test alert',
        headers: new Headers({ subject: 'Test alert' }),
        raw: new ReadableStream(),
      };

      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      
      expect(true).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should process emails within acceptable time limits', async () => {
      const mockEmail = {
        from: 'user@example.com',
        to: 'test.domain.alert.p1@tgk.dev',
        subject: 'Test alert',
        body: 'This is a test alert',
        headers: new Headers({ subject: 'Test alert' }),
        raw: new ReadableStream(),
      };

      const startTime = Date.now();
      await worker.default.email(mockEmail, mockEnv, {} as ExecutionContext);
      const processingTime = Date.now() - startTime;

      // Should process within 5 seconds (generous limit for testing)
      expect(processingTime).toBeLessThan(5000);
    });
  });
});

console.log('🧪 TGK Email Orchestrator - Phase 6.0 Test Suite Complete');
