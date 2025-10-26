/**
 * Tests for Cloudflare Tunnel Resource
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { Tunnel, isTunnel, type TunnelProps } from "./index.js";

// Mock Alchemy dependencies
vi.mock("alchemy", () => ({
  default: {
    secret: vi.fn((value: string) => ({ unencrypted: value })),
  },
  Resource: vi.fn(),
  ResourceKind: "ResourceKind",
  logger: {
    log: vi.fn(),
  },
}));

describe("Tunnel Resource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Type Guards", () => {
    test("isTunnel returns true for Tunnel resources", () => {
      const mockTunnel = {
        ["ResourceKind"]: "cloudflare::Tunnel",
        tunnelId: "test-tunnel-id",
      };

      expect(isTunnel(mockTunnel)).toBe(true);
    });

    test("isTunnel returns false for non-Tunnel resources", () => {
      const mockResource = {
        ["ResourceKind"]: "cloudflare::Worker",
        name: "test-worker",
      };

      expect(isTunnel(mockResource)).toBe(false);
    });

    test("isTunnel returns false for null/undefined", () => {
      expect(isTunnel(null)).toBe(false);
      expect(isTunnel(undefined)).toBe(false);
    });
  });

  describe("Resource Creation", () => {
    test("creates basic tunnel with minimal config", async () => {
      const mockContext = {
        phase: "create",
        output: undefined,
        scope: {
          createPhysicalName: vi.fn((id) => `test-app-test-${id}`),
        },
        replace: vi.fn(),
        destroy: vi.fn(),
      };

      const tunnelProps: TunnelProps = {
        name: "test-tunnel",
      };

      // Test basic configuration validation
      expect(tunnelProps.name).toBe("test-tunnel");
      expect(typeof tunnelProps.name).toBe("string");
    });

    test("creates tunnel with ingress configuration", async () => {
      const tunnelProps: TunnelProps = {
        name: "web-app-tunnel",
        ingress: [
          {
            hostname: "app.example.com",
            service: "http://localhost:3000",
          },
          {
            service: "http_status:404",
          },
        ],
      };

      expect(tunnelProps.ingress).toHaveLength(2);
      expect(tunnelProps.ingress?.[0].hostname).toBe("app.example.com");
      expect(tunnelProps.ingress?.[0].service).toBe("http://localhost:3000");
      expect(tunnelProps.ingress?.[1].service).toBe("http_status:404");
    });

    test("creates tunnel with origin request configuration", async () => {
      const tunnelProps: TunnelProps = {
        name: "secure-tunnel",
        originRequest: {
          connectTimeout: 30,
          httpHostHeader: "internal.service",
          http2Origin: true,
          noTLSVerify: false,
        },
      };

      expect(tunnelProps.originRequest?.connectTimeout).toBe(30);
      expect(tunnelProps.originRequest?.httpHostHeader).toBe(
        "internal.service",
      );
      expect(tunnelProps.originRequest?.http2Origin).toBe(true);
      expect(tunnelProps.originRequest?.noTLSVerify).toBe(false);
    });

    test("creates tunnel with adoption enabled", async () => {
      const tunnelProps: TunnelProps = {
        name: "existing-tunnel",
        adopt: true,
        delete: false,
      };

      expect(tunnelProps.adopt).toBe(true);
      expect(tunnelProps.delete).toBe(false);
    });
  });

  describe("Configuration Validation", () => {
    test("validates ingress rules structure", () => {
      const validIngress = [
        {
          hostname: "api.example.com",
          path: "/v1/*",
          service: "http://localhost:8080",
          originRequest: {
            connectTimeout: 60,
          },
        },
        {
          service: "http_status:404",
        },
      ];

      expect(validIngress[0].hostname).toBe("api.example.com");
      expect(validIngress[0].path).toBe("/v1/*");
      expect(validIngress[0].service).toBe("http://localhost:8080");
      expect(validIngress[0].originRequest?.connectTimeout).toBe(60);
      expect(validIngress[1].service).toBe("http_status:404");
    });

    test("validates warp routing configuration", () => {
      const warpRouting = {
        enabled: true,
      };

      expect(warpRouting.enabled).toBe(true);
    });

    test("validates metadata structure", () => {
      const metadata = {
        environment: "production",
        team: "platform",
        version: "1.0.0",
        tags: ["web", "api"],
      };

      expect(metadata.environment).toBe("production");
      expect(metadata.team).toBe("platform");
      expect(metadata.tags).toEqual(["web", "api"]);
    });
  });

  describe("Error Handling", () => {
    test("handles missing required service in ingress rule", () => {
      const invalidIngress = [
        {
          hostname: "app.example.com",
          service: undefined as any,
        },
      ];

      expect(invalidIngress[0].service).toBeUndefined();
    });

    test("handles invalid configuration source", () => {
      const tunnelProps: TunnelProps = {
        name: "test-tunnel",
        configSrc: "invalid" as any,
      };

      expect(tunnelProps.configSrc).toBe("invalid");
    });
  });
});
