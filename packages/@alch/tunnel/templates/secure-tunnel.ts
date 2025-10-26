/**
 * @template secure-tunnel
 * @description Secure tunnel with advanced origin configuration and TLS settings
 * @category networking
 * @provider cloudflare
 * @phase foundation
 */

import { Tunnel } from "../src/index.js";
import alchemy from "alchemy";

/**
 * Secure Tunnel Configuration
 */
export interface SecureTunnelConfig {
  hostname: string;
  originService: string;
  tlsVerification?: "full" | "no-verification";
  connectTimeout?: number;
  tlsTimeout?: number;
  httpHostHeader?: string;
  http2Origin?: boolean;
  access?: {
    teamName: string;
    appUUID: string;
  };
}

/**
 * Secure Tunnel Template
 * 
 * Creates a production tunnel with:
 * - Advanced TLS configuration
 * - Custom timeouts and headers
 * - HTTP/2 support
 * - Optional Cloudflare Access integration
 * - Enhanced security settings
 * 
 * @example
 * ```typescript
 * const tunnel = await secureTunnel({
 *   hostname: "secure.example.com",
 *   originService: "https://internal.service:8443",
 *   tlsVerification: "full",
 *   connectTimeout: 30
 * });
 * ```
 */
export async function secureTunnel(config: SecureTunnelConfig) {
  const app = await alchemy("secure-tunnel-app");

  const tunnel = await Tunnel("secure", {
    name: `${app.name}-secure`,
    originRequest: {
      connectTimeout: config.connectTimeout || 30,
      tlsTimeout: config.tlsTimeout || 10,
      httpHostHeader: config.httpHostHeader,
      http2Origin: config.http2Origin || false,
      noTLSVerify: config.tlsVerification === "no-verification",
    },
    ingress: [
      {
        hostname: config.hostname,
        service: config.originService,
      },
      {
        service: "http_status:404",
      },
    ],
  });

  return {
    tunnel,
    app,
    config,
    // Security helper methods
    getRunCommand: () => `cloudflared tunnel run --token ${tunnel.token.unencrypted}`,
    getSecureUrl: () => `https://${config.hostname}`,
    getSecurityReport: () => ({
      tlsVerification: config.tlsVerification || "full",
      connectTimeout: config.connectTimeout || 30,
      tlsTimeout: config.tlsTimeout || 10,
      http2Enabled: config.http2Origin || false,
      customHeaders: {
        hostHeader: config.httpHostHeader || "default",
      },
      accessIntegration: !!config.access,
    }),
    validateSecurity: () => {
      const issues: string[] = [];
      
      if (!config.hostname || !config.hostname.includes(".")) {
        issues.push("Invalid hostname format");
      }
      
      if (!config.originService.startsWith("https://") && config.tlsVerification === "full") {
        issues.push("TLS verification requires HTTPS origin service");
      }
      
      if (config.connectTimeout && config.connectTimeout > 60) {
        issues.push("Connect timeout should not exceed 60 seconds");
      }
      
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
  const { tunnel, getRunCommand, getSecureUrl, getSecurityReport, validateSecurity } = await secureTunnel({
    hostname: "secure.example.com",
    originService: "https://internal.service:8443",
    tlsVerification: "full",
    connectTimeout: 30,
    http2Origin: true,
    httpHostHeader: "internal.service",
  });
  
  console.log("🔒 Secure Tunnel Created:");
  console.log(`  Tunnel ID: ${tunnel.tunnelId}`);
  console.log(`  Secure URL: ${getSecureUrl()}`);
  console.log(`  Run Command: ${getRunCommand()}`);
  console.log("  Security Report:", JSON.stringify(getSecurityReport(), null, 2));
  
  const validation = validateSecurity();
  console.log(`  Security Validation: ${validation.isValid ? "✅ Valid" : "❌ Issues found"}`);
  if (!validation.isValid) {
    console.log("  Issues:", validation.issues);
  }
  
  return tunnel;
}
