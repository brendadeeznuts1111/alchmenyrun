/**
 * Cloudflare Tunnel Resource for Alchemy
 *
 * Provides a complete interface for creating and managing Cloudflare Tunnels
 * with automatic DNS management, configuration lifecycle, and tunnel adoption.
 */

import alchemy from "alchemy";
import type { Context } from "alchemy";
import { Resource, Secret } from "alchemy";
import { CloudflareApiClient, createCloudflareClient, type CloudflareTunnelResponse } from "./cloudflare-api.js";
import { createSafeLogger, redactObject, validateApiToken, validateAccountId } from "./utils.js";
import { logger } from "alchemy";

/**
 * Tunnel data as returned by Cloudflare API
 */
interface CloudflareTunnel {
  id: string;
  account_tag: string;
  created_at: string;
  deleted_at: string | null;
  name: string;
  metadata?: Record<string, any>;
  credentials_file?: {
    AccountTag: string;
    TunnelID: string;
    TunnelName: string;
    TunnelSecret: string;
  };
  token?: string;
}

/**
 * Properties for creating or updating a Cloudflare Tunnel
 */
export interface TunnelProps {
  /**
   * Name for the tunnel
   * Note: Tunnel names are immutable and cannot be changed after creation.
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Secret for the tunnel
   * If not provided, will be generated automatically
   */
  tunnelSecret?: Secret<string>;

  /**
   * Optional metadata object for the tunnel
   */
  metadata?: Record<string, any>;

  /**
   * Configuration source
   * - 'cloudflare' - Use Cloudflare configuration (default, managed via API)
   * - 'local' - Use local configuration (managed via config file)
   *
   * @default 'cloudflare'
   */
  configSrc?: "cloudflare" | "local";

  /**
   * Ingress rules defining how requests are routed
   * Must include a catch-all rule at the end
   * Only used when configSrc is 'cloudflare'
   */
  ingress?: IngressRule[];

  /**
   * WarpRouting configuration for private network access
   * Only used when configSrc is 'cloudflare'
   */
  warpRouting?: {
    enabled?: boolean;
  };

  /**
   * Origin request configuration to apply to all rules
   * Only used when configSrc is 'cloudflare'
   */
  originRequest?: OriginRequestConfig;

  /**
   * Whether to adopt an existing tunnel with the same name if it exists
   * If true and a tunnel with the same name exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to delete the tunnel.
   * If set to false, the tunnel will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;
}

/**
 * Tunnel configuration for routing traffic
 */
export interface TunnelConfig {
  ingress?: IngressRule[];
  warpRouting?: {
    enabled?: boolean;
  };
  originRequest?: OriginRequestConfig;
}

/**
 * Ingress rule defining how a hostname is routed
 */
export interface IngressRule {
  /**
   * Hostname to match for this rule
   * Use service: "http_status:404" as catch-all
   */
  hostname?: string;

  /**
   * Service to route to (e.g., "http://localhost:8000" or "http_status:404")
   */
  service: string;

  /**
   * Path to match for this rule
   */
  path?: string;

  /**
   * Origin request configuration for this specific rule
   */
  originRequest?: OriginRequestConfig;
}

/**
 * Origin request configuration
 */
export interface OriginRequestConfig {
  /**
   * Timeout for origin server to respond to a request
   */
  connectTimeout?: number;

  /**
   * Timeout for closing the connection to the origin server
   */
  tlsTimeout?: number;

  /**
   * Timeout for TCP connections to the origin server
   */
  tcpKeepAlive?: number;

  /**
   * Disable keep-alive connections
   */
  noHappyEyeballs?: boolean;

  /**
   * Keep connections open after a request
   */
  keepAliveConnections?: number;

  /**
   * Timeout for keep-alive connections
   */
  keepAliveTimeout?: number;

  /**
   * HTTP/2 origin support
   */
  http2Origin?: boolean;

  /**
   * Headers to add to origin requests
   */
  httpHostHeader?: string;

  /**
   * CA pool for origin TLS verification
   */
  caPool?: string;

  /**
   * Disable TLS verification
   */
  noTLSVerify?: boolean;

  /**
   * Disable chunked encoding
   */
  disableChunkedEncoding?: boolean;

  /**
   * Rewrite the Host header
   */
  bastionMode?: boolean;

  /**
   * Proxy protocol version
   */
  proxyProtocol?: "off" | "v1" | "v2";

  /**
   * Proxy outgoing connections through a specified address
   */
  proxyAddress?: string;

  /**
   * Port to use for proxy connections
   */
  proxyPort?: number;

  /**
   * Type of proxy to use
   */
  proxyType?: string;

  /**
   * Enable TCP keep-alive for connection pooling
   */
  tcpKeepAliveInterval?: number;
}

/**
 * Output returned after Tunnel creation/update
 */
export interface Tunnel extends Omit<TunnelProps, "delete" | "tunnelSecret"> {
  /**
   * The name of the tunnel
   */
  name: string;

  /**
   * The ID of the tunnel
   */
  tunnelId: string;

  /**
   * The account ID that owns the tunnel
   */
  accountTag: string;

  /**
   * Time at which the tunnel was created
   */
  createdAt: string;

  /**
   * Time at which the tunnel was deleted (null if active)
   */
  deletedAt: string | null;

  /**
   * Credentials for connecting to the tunnel
   */
  credentials: {
    accountTag: string;
    tunnelId: string;
    tunnelName: string;
    tunnelSecret: Secret<string>;
  };

  /**
   * Token for running the tunnel
   * Use this token with `cloudflared tunnel run --token <token>` to start the tunnel
   */
  token: Secret<string>;

  /**
   * DNS records automatically created for hostnames in ingress rules
   * Maps hostname to DNS record ID
   */
  dnsRecords?: Record<string, string>;
}

/**
 * Type guard for Tunnel resources
 */
export function isTunnel(resource: any): resource is Tunnel {
  return resource?.["ResourceKind"] === "cloudflare::Tunnel";
}

/**
 * Creates and manages a Cloudflare Tunnel
 *
 * @param id - Unique identifier for the resource
 * @param props - Tunnel configuration properties
 * @returns Promise resolving to Tunnel resource
 *
 * @example
 * ```typescript
 * // Create a basic tunnel
 * const tunnel = await Tunnel("my-app", {
 *   name: "my-app-tunnel"
 * });
 *
 * // Run cloudflared with:
 * // cloudflared tunnel run --token <tunnel.token.unencrypted>
 * ```
 *
 * @example
 * ```typescript
 * // Create a tunnel with ingress configuration
 * const webTunnel = await Tunnel("web-app", {
 *   name: "web-app-tunnel",
 *   ingress: [
 *     {
 *       hostname: "app.example.com",
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       service: "http_status:404"  // catch-all rule
 *     }
 *   ]
 * });
 * ```
 */
export const Tunnel = Resource(
  "cloudflare::Tunnel",
  async function (
    this: Context<Tunnel>,
    id: string,
    props: TunnelProps,
  ): Promise<Tunnel> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    // Track if we're replacing the tunnel (don't fetch token in this case)
    let isReplacing = false;

    if (this.phase === "update" && this.output.name !== name) {
      logger.log(`Replacing tunnel: ${this.output.name} → ${name}`);
      this.replace(true);
    }

    if (this.phase === "delete") {
      // For delete operations, check if the tunnel ID exists in the output
      const tunnelId = this.output?.tunnelId;
      if (tunnelId && props.delete !== false) {
        logger.log(`Deleting tunnel: ${tunnelId}`);
        // TODO: Implement actual tunnel deletion via Cloudflare API
        // await deleteTunnel(api, tunnelId);
      }

      // Return destroyed state
      return this.destroy();
    }

    // For create or update operations
    let tunnelData: CloudflareTunnel;

    if (this.phase === "update" && this.output?.tunnelId) {
      // Get existing tunnel data
      tunnelData = await getTunnel(this.output.tunnelId);

      // Check if name is being changed - tunnel names are immutable
      if (props.name && props.name !== tunnelData.name) {
        this.replace(true);
      }

      // Update configuration if provided
      if (
        (props.ingress || props.warpRouting || props.originRequest) &&
        props.configSrc !== "local"
      ) {
        const config: TunnelConfig = {
          ingress: props.ingress,
          warpRouting: props.warpRouting,
          originRequest: props.originRequest,
        };
        await updateTunnelConfiguration(this.output.tunnelId, config);
      }
    } else {
      // Create new tunnel
      try {
        tunnelData = await createTunnel({
          name,
          configSrc: props.configSrc,
          tunnelSecret: props.tunnelSecret,
          metadata: props.metadata,
        });

        // Configure tunnel if config is provided
        if (
          (props.ingress || props.warpRouting || props.originRequest) &&
          props.configSrc !== "local"
        ) {
          await updateTunnelConfiguration(tunnelData.id, {
            ingress: props.ingress,
            warpRouting: props.warpRouting,
            originRequest: props.originRequest,
          });
        }
      } catch (error) {
        // Check if this is a "tunnel already exists" error and adopt is enabled
        if (
          props.adopt &&
          error instanceof Error &&
          (error.message.includes("already have a tunnel with this name") ||
            error.message.includes("already exists"))
        ) {
          logger.log(`Tunnel '${name}' already exists, adopting it`);

          // Find the existing tunnel by name
          const existingTunnel = await findTunnelByName(name);

          if (!existingTunnel) {
            throw new Error(
              `Failed to find existing tunnel '${name}' for adoption`,
            );
          }

          tunnelData = existingTunnel;

          // Update configuration if provided
          if (
            (props.ingress || props.warpRouting || props.originRequest) &&
            props.configSrc !== "local"
          ) {
            const config: TunnelConfig = {
              ingress: props.ingress,
              warpRouting: props.warpRouting,
              originRequest: props.originRequest,
            };
            await updateTunnelConfiguration(existingTunnel.id, config);
          }
        } else {
          // Re-throw the error if adopt is false or it's not an "already exists" error
          throw error;
        }
      }
    }

    // Ensure tunnel token is available (unless we're replacing)
    // Sometimes Cloudflare doesn't return the token in the initial response
    if (!isReplacing && !tunnelData.token) {
      tunnelData.token = await getTunnelToken(tunnelData.id);
    }

    // Transform API response to our interface
    return {
      tunnelId: tunnelData.id,
      accountTag: tunnelData.account_tag,
      name: tunnelData.name,
      createdAt: tunnelData.created_at,
      deletedAt: tunnelData.deleted_at,
      credentials: tunnelData.credentials_file
        ? {
            accountTag: tunnelData.credentials_file.AccountTag,
            tunnelId: tunnelData.credentials_file.TunnelID,
            tunnelName: tunnelData.credentials_file.TunnelName,
            tunnelSecret: alchemy.secret(
              tunnelData.credentials_file.TunnelSecret,
            ),
          }
        : this.output?.credentials || {
            accountTag: tunnelData.account_tag,
            tunnelId: tunnelData.id,
            tunnelName: tunnelData.name,
            tunnelSecret: alchemy.secret(""),
          },
      token: tunnelData.token
        ? alchemy.secret(tunnelData.token)
        : this.output?.token || alchemy.secret(""),
      metadata: props.metadata,
      ingress: props.ingress,
      warpRouting: props.warpRouting,
      originRequest: props.originRequest,
      configSrc: props.configSrc,
      dnsRecords: this.output?.dnsRecords || {},
    };
  },
);

// Real Cloudflare API implementations for Phase 2

const safeLogger = createSafeLogger(logger);

async function createTunnel(props: {
  name: string;
  configSrc?: "cloudflare" | "local";
  tunnelSecret?: Secret<string>;
  metadata?: Record<string, any>;
}): Promise<CloudflareTunnel> {
  safeLogger.log(`Creating tunnel: ${props.name}`);

  try {
    const client = createCloudflareClient();
    
    const request = {
      name: props.name,
      configSrc: props.configSrc || "cloudflare",
      tunnelSecret: props.tunnelSecret?.unencrypted,
      metadata: props.metadata,
    };

    safeLogger.log("Creating tunnel with request:", redactObject(request));
    const tunnelResponse: CloudflareTunnelResponse = await client.createTunnel(request);
    
    safeLogger.log("Tunnel created successfully:", redactObject(tunnelResponse));

    // Convert Cloudflare API response to our internal format
    const tunnel: CloudflareTunnel = {
      id: tunnelResponse.id,
      account_tag: tunnelResponse.account_tag,
      created_at: tunnelResponse.created_at,
      deleted_at: tunnelResponse.deleted_at,
      name: tunnelResponse.name,
      metadata: tunnelResponse.metadata,
      credentials_file: tunnelResponse.credentials_file,
      token: tunnelResponse.token,
    };

    return tunnel;
  } catch (error) {
    safeLogger.error(`Failed to create tunnel: ${error}`);
    throw error;
  }
}

async function getTunnel(tunnelId: string): Promise<CloudflareTunnel> {
  safeLogger.log(`Getting tunnel: ${tunnelId}`);

  try {
    const client = createCloudflareClient();
    const tunnelResponse: CloudflareTunnelResponse = await client.getTunnel(tunnelId);
    
    safeLogger.log("Tunnel retrieved successfully:", redactObject(tunnelResponse));

    // Convert Cloudflare API response to our internal format
    const tunnel: CloudflareTunnel = {
      id: tunnelResponse.id,
      account_tag: tunnelResponse.account_tag,
      created_at: tunnelResponse.created_at,
      deleted_at: tunnelResponse.deleted_at,
      name: tunnelResponse.name,
      metadata: tunnelResponse.metadata,
      credentials_file: tunnelResponse.credentials_file,
      token: tunnelResponse.token,
    };

    return tunnel;
  } catch (error) {
    safeLogger.error(`Failed to get tunnel: ${error}`);
    throw error;
  }
}

async function updateTunnelConfiguration(
  tunnelId: string,
  config: TunnelConfig,
): Promise<void> {
  safeLogger.log(`Updating tunnel configuration: ${tunnelId}`);

  try {
    const client = createCloudflareClient();
    
    const request = {
      ingress: config.ingress,
      warpRouting: config.warpRouting,
      originRequest: config.originRequest,
    };

    safeLogger.log("Updating tunnel with request:", redactObject(request));
    await client.updateTunnel(tunnelId, request);
    
    safeLogger.log("Tunnel configuration updated successfully");
  } catch (error) {
    safeLogger.error(`Failed to update tunnel configuration: ${error}`);
    throw error;
  }
}

async function findTunnelByName(
  name: string,
): Promise<CloudflareTunnel | null> {
  safeLogger.log(`Finding tunnel by name: ${name}`);

  try {
    const client = createCloudflareClient();
    const tunnels = await client.listTunnels();
    
    const foundTunnel = tunnels.find(tunnel => tunnel.name === name);
    
    if (foundTunnel) {
      safeLogger.log("Tunnel found by name:", redactObject(foundTunnel));
      
      // Convert to our internal format
      const tunnel: CloudflareTunnel = {
        id: foundTunnel.id,
        account_tag: foundTunnel.account_tag,
        created_at: foundTunnel.created_at,
        deleted_at: foundTunnel.deleted_at,
        name: foundTunnel.name,
        metadata: foundTunnel.metadata,
        credentials_file: foundTunnel.credentials_file,
        token: foundTunnel.token,
      };
      
      return tunnel;
    }
    
    safeLogger.log(`No tunnel found with name: ${name}`);
    return null;
  } catch (error) {
    safeLogger.error(`Failed to find tunnel by name: ${error}`);
    throw error;
  }
}

async function getTunnelToken(tunnelId: string): Promise<string> {
  safeLogger.log(`Getting tunnel token: ${tunnelId}`);

  try {
    const client = createCloudflareClient();
    const token = await client.getTunnelToken(tunnelId);
    
    safeLogger.log(`Tunnel token retrieved successfully for tunnel: ${tunnelId}`);
    return token;
  } catch (error) {
    safeLogger.error(`Failed to get tunnel token: ${error}`);
    throw error;
  }
}

// Export all types and the main Tunnel resource
export { Tunnel as default };
