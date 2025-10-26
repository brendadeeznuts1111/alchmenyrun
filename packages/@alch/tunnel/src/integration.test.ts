/**
 * Integration tests for Cloudflare Tunnel resource
 * Tests real Cloudflare API calls
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { CloudflareApiClient, createCloudflareClient } from "./cloudflare-api.js";
import { validateApiToken, validateAccountId } from "./utils.js";

// Skip integration tests if credentials are not available
const hasCredentials = !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);

describe.skipIf(!hasCredentials)("Cloudflare API Integration", () => {
  let client: CloudflareApiClient;
  let testTunnelId: string | null = null;

  beforeAll(() => {
    // Validate environment variables
    const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;

    expect(validateApiToken(apiToken)).toBe(true);
    expect(validateAccountId(accountId)).toBe(true);

    client = createCloudflareClient();
  });

  test("should create a real tunnel", async () => {
    const tunnelName = `test-tunnel-${Date.now()}`;
    
    const tunnel = await client.createTunnel({
      name: tunnelName,
      configSrc: "cloudflare",
      metadata: {
        environment: "test",
        created_by: "integration-test",
      },
    });

    expect(tunnel).toBeDefined();
    expect(tunnel.id).toBeDefined();
    expect(tunnel.name).toBe(tunnelName);
    expect(tunnel.account_tag).toBe(process.env.CLOUDFLARE_ACCOUNT_ID);
    expect(tunnel.created_at).toBeDefined();
    expect(tunnel.credentials_file).toBeDefined();
    expect(tunnel.token).toBeDefined();

    testTunnelId = tunnel.id;
  });

  test("should get the created tunnel", async () => {
    if (!testTunnelId) {
      throw new Error("Test tunnel not created");
    }

    const tunnel = await client.getTunnel(testTunnelId);

    expect(tunnel).toBeDefined();
    expect(tunnel.id).toBe(testTunnelId);
    expect(tunnel.name).toContain("test-tunnel-");
  });

  test("should list tunnels and find our test tunnel", async () => {
    const tunnels = await client.listTunnels();

    expect(Array.isArray(tunnels)).toBe(true);
    expect(tunnels.length).toBeGreaterThan(0);

    const testTunnel = tunnels.find(t => t.id === testTunnelId);
    expect(testTunnel).toBeDefined();
    expect(testTunnel?.name).toContain("test-tunnel-");
  });

  test("should get tunnel token", async () => {
    if (!testTunnelId) {
      throw new Error("Test tunnel not created");
    }

    const token = await client.getTunnelToken(testTunnelId);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  test("should update tunnel configuration", async () => {
    if (!testTunnelId) {
      throw new Error("Test tunnel not created");
    }

    const updatedTunnel = await client.updateTunnel(testTunnelId, {
      metadata: {
        environment: "test",
        created_by: "integration-test",
        updated: true,
      },
      ingress: [
        {
          hostname: "test.example.com",
          service: "http://localhost:8080",
        },
        {
          service: "http_status:404",
        },
      ],
    });

    expect(updatedTunnel).toBeDefined();
    expect(updatedTunnel.id).toBe(testTunnelId);
    expect(updatedTunnel.metadata?.updated).toBe(true);
  });

  afterAll(async () => {
    // Clean up: delete the test tunnel
    if (testTunnelId && client) {
      try {
        await client.deleteTunnel(testTunnelId);
        console.log(`Test tunnel ${testTunnelId} deleted successfully`);
      } catch (error) {
        console.error(`Failed to delete test tunnel: ${error}`);
      }
    }
  });
});

describe("Cloudflare API Client Validation", () => {
  test("should validate API token format", () => {
    expect(validateApiToken("valid_token_1234567890123456789012345678901234567890")).toBe(true);
    expect(validateApiToken("short")).toBe(false);
    expect(validateApiToken("")).toBe(false);
  });

  test("should validate account ID format", () => {
    expect(validateAccountId("1234567890abcdef1234567890abcdef")).toBe(true);
    expect(validateAccountId("invalid")).toBe(false);
    expect(validateAccountId("")).toBe(false);
  });

  test("should throw error when credentials are missing", () => {
    // Temporarily clear environment variables
    const originalToken = process.env.CLOUDFLARE_API_TOKEN;
    const originalAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;

    expect(() => createCloudflareClient()).toThrow("CLOUDFLARE_API_TOKEN environment variable is required");

    // Restore environment variables
    process.env.CLOUDFLARE_API_TOKEN = originalToken;
    process.env.CLOUDFLARE_ACCOUNT_ID = originalAccount;
  });
});
