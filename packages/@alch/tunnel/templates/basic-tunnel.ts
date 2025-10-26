/**
 * @template basic-tunnel
 * @description Basic Cloudflare Tunnel template for simple local development
 * @category networking
 * @provider cloudflare
 * @phase foundation
 */

import { Tunnel } from "../src/index.js";
import alchemy from "alchemy";

/**
 * Basic Tunnel Template
 *
 * Creates a simple Cloudflare Tunnel for local development
 * with minimal configuration and automatic token generation.
 *
 * @example
 * ```typescript
 * const tunnel = await basicTunnel();
 * console.log(`Tunnel ID: ${tunnel.tunnelId}`);
 * console.log(`Run: cloudflared tunnel run --token ${tunnel.token.unencrypted}`);
 * ```
 */
export async function basicTunnel(name = "basic-tunnel") {
  const app = await alchemy("basic-tunnel-app");

  const tunnel = await Tunnel(name, {
    name: `${app.name}-${name}`,
    // Basic tunnel with no ingress rules - uses cloudflared proxy
  });

  return {
    tunnel,
    app,
    // Helper method to get the run command
    getRunCommand: () =>
      `cloudflared tunnel run --token ${tunnel.token.unencrypted}`,
    // Helper method to get tunnel URL
    getTunnelUrl: () => `https://${tunnel.tunnelId}.trycloudflare.com`,
  };
}

/**
 * Usage example
 */
export async function example() {
  const { tunnel, getRunCommand, getTunnelUrl } = await basicTunnel();

  console.log("🚀 Basic Tunnel Created:");
  console.log(`  Tunnel ID: ${tunnel.tunnelId}`);
  console.log(`  Run Command: ${getRunCommand()}`);
  console.log(`  Tunnel URL: ${getTunnelUrl()}`);

  return tunnel;
}
