/**
 * @template basic-tunnel
 * @description Basic Cloudflare Tunnel template
 * @category networking
 * @provider cloudflare
 * @phase foundation
 */

import { Tunnel } from "../src/index.js";
import alchemy from "alchemy";

/** Basic Tunnel Template */
export async function basicTunnel(name = "basic-tunnel") {
  const app = await alchemy("basic-tunnel-app");

  const tunnel = await Tunnel(name, {
    name: `${app.name}-${name}`,
  });

  return {
    tunnel,
    app,
    getRunCommand: () =>
      `cloudflared tunnel run --token ${tunnel.token.unencrypted}`,
    getTunnelUrl: () => `https://${tunnel.tunnelId}.trycloudflare.com`,
  };
}

/** Usage example */
export async function example() {
  const { tunnel, getRunCommand, getTunnelUrl } = await basicTunnel();

  console.log("🚀 Basic Tunnel Created:");
  console.log(`  Tunnel ID: ${tunnel.tunnelId}`);
  console.log(`  Run Command: ${getRunCommand()}`);
  console.log(`  Tunnel URL: ${getTunnelUrl()}`);

  return tunnel;
}
