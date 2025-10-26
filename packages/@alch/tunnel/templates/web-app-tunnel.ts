/**
 * @template web-app-tunnel
 * @description Web application tunnel with DNS automation and multiple services
 * @category networking
 * @provider cloudflare
 * @phase foundation
 */

import { Tunnel } from "../src/index.js";
import alchemy from "alchemy";

/**
 * Web Application Tunnel Template
 * 
 * Creates a production-ready tunnel with:
 * - Custom hostname with DNS automation
 * - Multiple service routing
 * - API and frontend separation
 * - Fallback handling
 * 
 * @example
 * ```typescript
 * const tunnel = await webAppTunnel({
 *   hostname: "app.example.com",
 *   frontendPort: 3000,
 *   apiPort: 8080
 * });
 * ```
 */
export interface WebAppTunnelConfig {
  hostname: string;
  frontendPort: number;
  apiPort: number;
  enableHttps?: boolean;
  apiPath?: string;
}

export async function webAppTunnel(config: WebAppTunnelConfig) {
  const app = await alchemy("web-app-tunnel");

  const tunnel = await Tunnel("web-app", {
    name: `${app.name}-web-app`,
    ingress: [
      // API routes
      {
        hostname: config.hostname,
        path: config.apiPath || "/api/*",
        service: `${config.enableHttps ? "https" : "http"}://localhost:${config.apiPort}`,
      },
      // Frontend routes
      {
        hostname: config.hostname,
        service: `${config.enableHttps ? "https" : "http"}://localhost:${config.frontendPort}`,
      },
      // Fallback for unmatched routes
      {
        service: "http_status:404",
      },
    ],
  });

  return {
    tunnel,
    app,
    config,
    // Helper methods
    getRunCommand: () => `cloudflared tunnel run --token ${tunnel.token.unencrypted}`,
    getFrontendUrl: () => `https://${config.hostname}`,
    getApiUrl: (path = "") => `https://${config.hostname}${config.apiPath || "/api"}${path}`,
    getLocalUrls: () => ({
      frontend: `${config.enableHttps ? "https" : "http"}://localhost:${config.frontendPort}`,
      api: `${config.enableHttps ? "https" : "http"}://localhost:${config.apiPort}`,
    }),
  };
}

/**
 * Usage example
 */
export async function example() {
  const { tunnel, getRunCommand, getFrontendUrl, getApiUrl, getLocalUrls } = await webAppTunnel({
    hostname: "app.example.com",
    frontendPort: 3000,
    apiPort: 8080,
    enableHttps: false,
    apiPath: "/api",
  });
  
  console.log("🌐 Web App Tunnel Created:");
  console.log(`  Tunnel ID: ${tunnel.tunnelId}`);
  console.log(`  Frontend URL: ${getFrontendUrl()}`);
  console.log(`  API URL: ${getApiUrl()}`);
  console.log(`  Local Frontend: ${getLocalUrls().frontend}`);
  console.log(`  Local API: ${getLocalUrls().api}`);
  console.log(`  Run Command: ${getRunCommand()}`);
  
  return tunnel;
}
