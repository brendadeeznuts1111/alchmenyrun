/**
 * @template development-tunnel
 * @description Development tunnel with adoption support and local workflow optimization
 * @category networking
 * @provider cloudflare
 * @phase foundation
 */

import { Tunnel } from "../src/index.js";
import alchemy from "alchemy";

/**
 * Development Tunnel Configuration
 */
export interface DevelopmentTunnelConfig {
  tunnelName: string;
  localServices: Array<{
    name: string;
    port: number;
    path?: string;
    hostname?: string;
  }>;
  enableAdoption?: boolean;
  enableWarp?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Development Tunnel Template
 *
 * Creates a development-optimized tunnel with:
 * - Tunnel adoption for team collaboration
 * - Multiple local service routing
 * - Development metadata
 * - WARP routing for private services
 * - Easy service discovery
 *
 * @example
 * ```typescript
 * const tunnel = await developmentTunnel({
 *   tunnelName: "my-app-dev",
 *   localServices: [
 *     { name: "frontend", port: 3000 },
 *     { name: "api", port: 8080, path: "/api/*" }
 *   ],
 *   enableAdoption: true
 * });
 * ```
 */
export async function developmentTunnel(config: DevelopmentTunnelConfig) {
  const app = await alchemy("development-tunnel-app");

  // Build ingress rules from local services
  const ingressRules = config.localServices.map((service) => ({
    hostname: service.hostname,
    path: service.path,
    service: `http://localhost:${service.port}`,
  }));

  // Add catch-all rule
  ingressRules.push({
    hostname: undefined,
    path: undefined,
    service: "http_status:404",
  });

  const tunnel = await Tunnel("development", {
    name: config.tunnelName,
    adopt: config.enableAdoption || false,
    warpRouting: {
      enabled: config.enableWarp || false,
    },
    ingress: ingressRules,
    metadata: {
      environment: "development",
      services: config.localServices.map((s) => s.name),
      createdAt: new Date().toISOString(),
      ...config.metadata,
    },
  });

  return {
    tunnel,
    app,
    config,
    // Development helper methods
    getRunCommand: () =>
      `cloudflared tunnel run --token ${tunnel.token.unencrypted}`,
    getServiceUrls: () =>
      config.localServices.reduce(
        (urls, service) => {
          const baseUrl = service.hostname
            ? `https://${service.hostname}`
            : `https://${tunnel.tunnelId}.trycloudflare.com`;

          urls[service.name] = service.path
            ? `${baseUrl}${service.path}`
            : baseUrl;

          return urls;
        },
        {} as Record<string, string>,
      ),
    getLocalServiceUrls: () =>
      config.localServices.reduce(
        (urls, service) => {
          urls[service.name] = `http://localhost:${service.port}`;
          return urls;
        },
        {} as Record<string, string>,
      ),
    getDevelopmentInfo: () => ({
      tunnelName: config.tunnelName,
      tunnelId: tunnel.tunnelId,
      environment: "development",
      services: config.localServices,
      adoptionEnabled: config.enableAdoption || false,
      warpEnabled: config.enableWarp || false,
      runCommand: `cloudflared tunnel run --token ${tunnel.token.unencrypted}`,
    }),
    validateDevelopmentSetup: () => {
      const issues: string[] = [];

      if (!config.tunnelName || config.tunnelName.trim() === "") {
        issues.push("Tunnel name is required");
      }

      if (!config.localServices || config.localServices.length === 0) {
        issues.push("At least one local service must be configured");
      }

      config.localServices.forEach((service, index) => {
        if (!service.name || service.name.trim() === "") {
          issues.push(`Service ${index + 1}: Name is required`);
        }
        if (!service.port || service.port < 1 || service.port > 65535) {
          issues.push(`Service ${index + 1}: Invalid port number`);
        }
      });

      return {
        isValid: issues.length === 0,
        issues,
      };
    },
  };
}

/**
 * Usage example
 */
export async function example() {
  const {
    tunnel,
    getRunCommand,
    getServiceUrls,
    getLocalServiceUrls,
    getDevelopmentInfo,
    validateDevelopmentSetup,
  } = await developmentTunnel({
    tunnelName: "my-app-dev",
    localServices: [
      { name: "frontend", port: 3000 },
      { name: "api", port: 8080, path: "/api/*" },
      { name: "admin", port: 3001, hostname: "admin.dev.example.com" },
    ],
    enableAdoption: true,
    enableWarp: false,
    metadata: {
      developer: "team@example.com",
      project: "my-app",
    },
  });

  console.log("🛠️ Development Tunnel Created:");
  console.log(`  Tunnel ID: ${tunnel.tunnelId}`);
  console.log(`  Run Command: ${getRunCommand()}`);
  console.log("  Service URLs:", getServiceUrls());
  console.log("  Local URLs:", getLocalServiceUrls());
  console.log(
    "  Development Info:",
    JSON.stringify(getDevelopmentInfo(), null, 2),
  );

  const validation = validateDevelopmentSetup();
  console.log(
    `  Setup Validation: ${
      validation.isValid ? "✅ Valid" : "❌ Issues found"
    }`,
  );
  if (!validation.isValid) {
    console.log("  Issues:", validation.issues);
  }

  return tunnel;
}
