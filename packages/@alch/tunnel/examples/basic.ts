/**
 * Basic Cloudflare Tunnel Usage Examples
 */

import { Tunnel } from "../src/index.js";
import alchemy from "alchemy";

// Example 1: Basic tunnel creation
export async function basicTunnel() {
  const app = await alchemy("my-app");

  const tunnel = await Tunnel("my-tunnel", {
    name: "my-app-tunnel"
  });

  console.log("Tunnel created:", tunnel.tunnelId);
  console.log("Run with: cloudflared tunnel run --token", tunnel.token.unencrypted);

  return app.finalize();
}

// Example 2: Tunnel with ingress configuration
export async function webAppTunnel() {
  const app = await alchemy("web-app");

  const tunnel = await Tunnel("web-tunnel", {
    name: "web-app-tunnel",
    ingress: [
      {
        hostname: "app.example.com",
        service: "http://localhost:3000"
      },
      {
        hostname: "api.example.com",
        service: "http://localhost:8080"
      },
      {
        service: "http_status:404"  // catch-all rule
      }
    ]
  });

  console.log("Web app tunnel created:", tunnel.tunnelId);
  console.log("DNS records:", tunnel.dnsRecords);

  return app.finalize();
}

// Example 3: Tunnel with path-based routing
export async function pathBasedTunnel() {
  const app = await alchemy("api-app");

  const tunnel = await Tunnel("api-tunnel", {
    name: "api-app-tunnel",
    ingress: [
      {
        hostname: "api.example.com",
        path: "/v1/*",
        service: "http://localhost:8080"
      },
      {
        hostname: "api.example.com",
        path: "/v2/*",
        service: "http://localhost:8081"
      },
      {
        hostname: "api.example.com",
        service: "http://localhost:8080"  // default
      },
      {
        service: "http_status:404"
      }
    ]
  });

  console.log("API tunnel with path routing created:", tunnel.tunnelId);

  return app.finalize();
}

// Example 4: Tunnel with origin request configuration
export async function secureTunnel() {
  const app = await alchemy("secure-app");

  const tunnel = await Tunnel("secure-tunnel", {
    name: "secure-app-tunnel",
    originRequest: {
      connectTimeout: 30,
      tlsTimeout: 10,
      httpHostHeader: "internal.service",
      http2Origin: true,
      noTLSVerify: false,
      keepAliveConnections: 100
    },
    ingress: [
      {
        hostname: "secure.example.com",
        service: "https://localhost:8443"
      },
      {
        service: "http_status:404"
      }
    ]
  });

  console.log("Secure tunnel created:", tunnel.tunnelId);

  return app.finalize();
}

// Example 5: Tunnel with adoption (for development)
export async function developmentTunnel() {
  const app = await alchemy("dev-app");

  const tunnel = await Tunnel("dev-tunnel", {
    name: "development-tunnel",
    adopt: true,  // Adopt if exists
    delete: false,  // Keep tunnel when resource is deleted
    ingress: [
      {
        hostname: "dev.example.com",
        service: "http://localhost:3000"
      },
      {
        service: "http_status:404"
      }
    ]
  });

  console.log("Development tunnel ready:", tunnel.tunnelId);

  return app.finalize();
}

// Example 6: Tunnel with metadata
export async function metadataTunnel() {
  const app = await alchemy("metadata-app");

  const tunnel = await Tunnel("metadata-tunnel", {
    name: "metadata-app-tunnel",
    metadata: {
      environment: "production",
      team: "platform",
      version: "1.0.0",
      tags: ["web", "api", "production"],
      created_by: "automation"
    },
    ingress: [
      {
        hostname: "app.example.com",
        service: "http://localhost:3000"
      },
      {
        service: "http_status:404"
      }
    ]
  });

  console.log("Metadata tunnel created:", tunnel.tunnelId);
  console.log("Metadata:", tunnel.metadata);

  return app.finalize();
}
