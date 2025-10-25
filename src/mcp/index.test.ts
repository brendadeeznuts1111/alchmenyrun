/**
 * MCP Worker Tests
 * 
 * Comprehensive test suite for production MCP server
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import worker from './index';
import type { Env } from './index';
import { generateJWT } from './auth';
import { Miniflare } from 'miniflare';

// Start Miniflare for testing
let mf: Miniflare;

beforeAll(async () => {
  mf = new Miniflare({
    scriptPath: './src/mcp/index.ts',
    modules: true,
    bindings: {
      MCP_SHARED_SECRET: 'test-secret-123',
      MCP_JWT_SECRET: 'jwt-secret-456',
      ENVIRONMENT: 'development',
    },
  });
});

afterAll(async () => {
  await mf?.dispose();
});

// Mock environment
const mockEnv: Env = {
  MCP_SHARED_SECRET: 'test-secret-123',
  MCP_JWT_SECRET: 'jwt-secret-456',
  ENVIRONMENT: 'development',
  DB: {} as D1Database,
  STORAGE: {} as R2Bucket,
  JOBS: {} as Queue,
  CACHE: {} as KVNamespace,
  CHAT: {} as DurableObjectNamespace,
  WORKFLOW: {} as WorkflowNamespace,
  MCP_KV: {
    get: async (key: string) => null,
    put: async (key: string, value: string, options?: any) => {},
    delete: async (key: string) => {},
    list: async (options?: any) => ({ keys: [], list_complete: true, cursor: '' })
  } as unknown as KVNamespace
};

const mockCtx = {} as ExecutionContext;

describe('MCP Worker', () => {
  describe('Health Check', () => {
    it('should return 200 OK for /health', async () => {
      const request = new Request('https://mcp.example.com/health');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('mcp-worker');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'OPTIONS'
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should include CORS headers in all responses', async () => {
      const request = new Request('https://mcp.example.com/health');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept valid shared secret', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
    });

    it('should reject invalid shared secret', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'wrong-secret'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(401);
    });

    it('should accept valid JWT token', async () => {
      const token = await generateJWT(
        { sub: 'test-user', client_id: 'test-client' },
        mockEnv.MCP_JWT_SECRET
      );

      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });
  });

  describe('MCP Protocol', () => {
    it('should handle initialize request', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(1);
      expect(data.result.protocolVersion).toBeTruthy();
      expect(data.result.serverInfo.name).toBe('alchemy-mcp-worker');
    });

    it('should handle tools/list request', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.tools).toBeInstanceOf(Array);
      expect(data.result.tools.length).toBe(8);
    });

    it('should validate JSON-RPC version', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: 1,
          method: 'initialize'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error.code).toBe(-32600);
      expect(data.error.message).toContain('jsonrpc must be 2.0');
    });

    it('should handle invalid JSON', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: 'invalid json'
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error.code).toBe(-32700);
      expect(data.error.message).toContain('Parse error');
    });

    it('should handle unknown method', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'unknown_method'
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error.code).toBe(-32601);
      expect(data.error.message).toContain('Method not found');
    });
  });

  describe('Tools', () => {
    it('should execute get_resource_status tool', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'get_resource_status',
            arguments: { stage: 'prod' }
          }
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result.content[0].type).toBe('text');
      const result = JSON.parse(data.result.content[0].text);
      expect(result.stage).toBe('prod');
      expect(result.resources).toBeDefined();
    });

    it('should execute deploy_infrastructure tool with dryRun', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'deploy_infrastructure',
            arguments: { stage: 'staging', dryRun: true }
          }
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      const result = JSON.parse(data.result.content[0].text);
      expect(result.dryRun).toBe(true);
      expect(result.changes).toBeInstanceOf(Array);
    });

    it('should reject destroy_infrastructure without confirmation', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'destroy_infrastructure',
            arguments: { stage: 'staging', confirm: false }
          }
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      const result = JSON.parse(data.result.content[0].text);
      expect(result.error).toContain('confirmation required');
    });

    it('should reject destroy_infrastructure for production', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 6,
          method: 'tools/call',
          params: {
            name: 'destroy_infrastructure',
            arguments: { stage: 'prod', confirm: true }
          }
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      const result = JSON.parse(data.result.content[0].text);
      expect(result.error).toContain('Cannot destroy production');
    });

    it('should reject non-SELECT SQL queries', async () => {
      const request = new Request('https://mcp.example.com/mcp', {
        method: 'POST',
        headers: {
          'X-MCP-Secret': 'test-secret-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 7,
          method: 'tools/call',
          params: {
            name: 'query_database',
            arguments: { query: 'DROP TABLE users', stage: 'prod' }
          }
        })
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      const result = JSON.parse(data.result.content[0].text);
      expect(result.error).toContain('Only SELECT queries are allowed');
    });
  });

  describe('404 Routes', () => {
    it('should return 404 for unknown routes', async () => {
      const request = new Request('https://mcp.example.com/unknown');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Not found');
    });
  });
});

