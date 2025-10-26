/**
 * Real Cloudflare API client for Tunnel resource
 * Replaces mock implementations with actual API calls
 */

export interface CloudflareApiConfig {
  apiToken: string;
  accountId: string;
  baseUrl?: string;
}

export interface CloudflareTunnelResponse {
  id: string;
  name: string;
  account_tag: string;
  created_at: string;
  deleted_at: string | null;
  metadata?: Record<string, any>;
  credentials_file: {
    AccountTag: string;
    TunnelID: string;
    TunnelName: string;
    TunnelSecret: string;
  };
  token: string;
}

export interface CreateTunnelRequest {
  name: string;
  configSrc?: "cloudflare" | "local";
  tunnelSecret?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTunnelRequest {
  name?: string;
  metadata?: Record<string, any>;
  configSrc?: "cloudflare" | "local";
  ingress?: any[];
  warpRouting?: { enabled?: boolean };
  originRequest?: any;
}

export interface CloudflareApiResponse<T> {
  result: T;
  success: boolean;
  errors: any[];
  messages: any[];
}

/**
 * Real Cloudflare API client implementation
 */
export class CloudflareApiClient {
  private config: CloudflareApiConfig;
  private baseUrl: string;

  constructor(config: CloudflareApiConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://api.cloudflare.com/client/v4";
  }

  /**
   * Create a new tunnel
   */
  async createTunnel(request: CreateTunnelRequest): Promise<CloudflareTunnelResponse> {
    const response = await fetch(`${this.baseUrl}/accounts/${this.config.accountId}/cfd_tunnel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: request.name,
        config_src: request.configSrc || "cloudflare",
        tunnel_secret: request.tunnelSecret,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareApiResponse<CloudflareTunnelResponse> = await response.json();
    return data.result;
  }

  /**
   * Get tunnel by ID
   */
  async getTunnel(tunnelId: string): Promise<CloudflareTunnelResponse> {
    const response = await fetch(`${this.baseUrl}/accounts/${this.config.accountId}/cfd_tunnel/${tunnelId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareApiResponse<CloudflareTunnelResponse> = await response.json();
    return data.result;
  }

  /**
   * Update tunnel configuration
   */
  async updateTunnel(tunnelId: string, request: UpdateTunnelRequest): Promise<CloudflareTunnelResponse> {
    const response = await fetch(`${this.baseUrl}/accounts/${this.config.accountId}/cfd_tunnel/${tunnelId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: request.name,
        metadata: request.metadata,
        config: {
          config_src: request.configSrc || "cloudflare",
          ingress: request.ingress,
          warp_routing: request.warpRouting,
          origin_request: request.originRequest,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareApiResponse<CloudflareTunnelResponse> = await response.json();
    return data.result;
  }

  /**
   * Delete tunnel
   */
  async deleteTunnel(tunnelId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/accounts/${this.config.accountId}/cfd_tunnel/${tunnelId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * List all tunnels
   */
  async listTunnels(): Promise<CloudflareTunnelResponse[]> {
    const response = await fetch(`${this.baseUrl}/accounts/${this.config.accountId}/cfd_tunnel`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareApiResponse<CloudflareTunnelResponse[]> = await response.json();
    return data.result;
  }

  /**
   * Get tunnel token
   */
  async getTunnelToken(tunnelId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/accounts/${this.config.accountId}/cfd_tunnel/${tunnelId}/token`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareApiResponse<string> = await response.json();
    return data.result;
  }
}

/**
 * Create Cloudflare API client from environment variables
 */
export function createCloudflareClient(): CloudflareApiClient {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken) {
    throw new Error("CLOUDFLARE_API_TOKEN environment variable is required");
  }

  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is required");
  }

  return new CloudflareApiClient({
    apiToken,
    accountId,
  });
}
