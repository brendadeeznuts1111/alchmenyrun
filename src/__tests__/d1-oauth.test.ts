/**
 * Unit tests for D1 OAuth profile override functionality
 * Tests the fix for D1 database creation with OAuth profiles
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";

describe("D1 OAuth Profile Override", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
  });

  describe("getD1ApiToken function", () => {
    test("should return secret token when CLOUDFLARE_API_TOKEN is set", async () => {
      // Arrange
      process.env.CLOUDFLARE_API_TOKEN = "test-api-token-123";
      
      // Import the function after setting env
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act & Assert
      expect(() => getD1ApiToken()).not.toThrow();
      const token = getD1ApiToken();
      expect(token).toBeDefined();
      expect(token.toString()).toContain("Secret"); // Alchemy secret wrapper
      expect(typeof token).toBe("object"); // Should be a Secret object
    });

    test("should throw detailed error when CLOUDFLARE_API_TOKEN is missing", async () => {
      // Arrange
      delete process.env.CLOUDFLARE_API_TOKEN;
      
      // Import the function after removing env
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act & Assert
      expect(() => getD1ApiToken()).toThrow(/🚨 D1 DATABASE CREATION REQUIRES API TOKEN/);
      expect(() => getD1ApiToken()).toThrow(/OAuth authentication from 'wrangler login'/);
      expect(() => getD1ApiToken()).toThrow(/CLOUDFLARE_API_TOKEN/);
      expect(() => getD1ApiToken()).toThrow(/https:\/\/dash.cloudflare.com\/profile\/api-tokens/);
    });

    test("should throw error when CLOUDFLARE_API_TOKEN is empty string", async () => {
      // Arrange
      process.env.CLOUDFLARE_API_TOKEN = "";
      
      // Import the function after setting empty env
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act & Assert
      expect(() => getD1ApiToken()).toThrow();
    });

    test("should work with different token formats", async () => {
      // Arrange
      const testTokens = [
        "v1.0.0-1234567890abcdef1234567890abcdef12345678",
        "test_token_with_underscores",
        "token-with-hyphens",
        "simpletoken123"
      ];

      for (const token of testTokens) {
        process.env.CLOUDFLARE_API_TOKEN = token;
        
        // Import fresh for each test
        const { getD1ApiToken } = await import("../utils/d1-oauth.js");
        
        // Act & Assert
        expect(() => getD1ApiToken()).not.toThrow();
        const result = getD1ApiToken();
        expect(result).toBeDefined();
      }
    });
  });

  describe("D1 Database Creation", () => {
    test("should use API token for D1 creation even with OAuth profile", async () => {
      // Arrange
      process.env.CLOUDFLARE_API_TOKEN = "test-d1-token";
      process.env.ALCHEMY_PROFILE = "default"; // OAuth profile
      
      // This test verifies the D1 database creation logic
      // In a real scenario, this would be tested with integration tests
      // For now, we verify the helper function works correctly
      
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act & Assert
      expect(() => getD1ApiToken()).not.toThrow();
      const token = getD1ApiToken();
      expect(token).toBeDefined();
    });

    test("should fail gracefully when OAuth profile used without API token", async () => {
      // Arrange
      process.env.ALCHEMY_PROFILE = "default"; // OAuth profile
      delete process.env.CLOUDFLARE_API_TOKEN;
      
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act & Assert
      expect(() => getD1ApiToken()).toThrow(/D1 DATABASE CREATION REQUIRES API TOKEN/);
    });
  });

  describe("Error Message Quality", () => {
    test("should provide comprehensive error message with solutions", async () => {
      // Arrange
      delete process.env.CLOUDFLARE_API_TOKEN;
      
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act
      let error: Error | undefined;
      try {
        getD1ApiToken();
      } catch (e) {
        error = e as Error;
      }

      // Assert - Check error message contains all required information
      expect(error?.message).toContain("🚨 D1 DATABASE CREATION REQUIRES API TOKEN");
      expect(error?.message).toContain("OAuth authentication from 'wrangler login'");
      expect(error?.message).toContain("export CLOUDFLARE_API_TOKEN");
      expect(error?.message).toContain("echo \"CLOUDFLARE_API_TOKEN=");
      expect(error?.message).toContain("Zone:Zone:Read");
      expect(error?.message).toContain("Account:Cloudflare D1:Edit");
      expect(error?.message).toContain("Account:Account Settings:Read");
      expect(error?.message).toContain("https://dash.cloudflare.com/profile/api-tokens");
    });
  });

  describe("Environment Isolation", () => {
    test("should not affect other environment variables", async () => {
      // Arrange
      process.env.CLOUDFLARE_API_TOKEN = "test-token";
      process.env.OTHER_VAR = "should-remain";
      process.env.ANOTHER_VAR = "unchanged";
      
      const { getD1ApiToken } = await import("../utils/d1-oauth.js");
      
      // Act
      const token = getD1ApiToken();
      
      // Assert
      expect(token).toBeDefined();
      expect(process.env.OTHER_VAR).toBe("should-remain");
      expect(process.env.ANOTHER_VAR).toBe("unchanged");
    });
  });

  describe("Utility Functions", () => {
    test("isD1Configured should return correct status", async () => {
      const { isD1Configured } = await import("../utils/d1-oauth.js");
      
      // Test without token
      delete process.env.CLOUDFLARE_API_TOKEN;
      expect(isD1Configured()).toBe(false);
      
      // Test with token
      process.env.CLOUDFLARE_API_TOKEN = "test-token";
      expect(isD1Configured()).toBe(true);
    });

    test("getD1ConfigurationStatus should provide detailed status", async () => {
      const { getD1ConfigurationStatus } = await import("../utils/d1-oauth.js");
      
      // Test without token
      delete process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.ALCHEMY_PROFILE;
      
      let status = getD1ConfigurationStatus();
      expect(status.isConfigured).toBe(false);
      expect(status.usingOAuth).toBe(false);
      expect(status.recommendations).toContain("Set CLOUDFLARE_API_TOKEN environment variable");
      
      // Test with OAuth profile but no token
      process.env.ALCHEMY_PROFILE = "default";
      status = getD1ConfigurationStatus();
      expect(status.isConfigured).toBe(false);
      expect(status.usingOAuth).toBe(true);
      expect(status.recommendations).toContain("OAuth profile detected - API token still required for D1");
      
      // Test with token
      process.env.CLOUDFLARE_API_TOKEN = "test-token";
      status = getD1ConfigurationStatus();
      expect(status.isConfigured).toBe(true);
      expect(status.usingOAuth).toBe(false);
      expect(status.recommendations).toContain("✅ D1 operations properly configured");
    });
  });
});
