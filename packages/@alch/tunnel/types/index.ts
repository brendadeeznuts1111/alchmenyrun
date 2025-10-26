/**
 * @types Tunnel Resource Types
 * @description Comprehensive type definitions for Cloudflare Tunnel resource
 * @category networking
 * @provider cloudflare
 * @phase foundation
 */

// Re-export all types from the main module
export type {
  Tunnel,
  TunnelProps,
  TunnelConfig,
  IngressRule,
  OriginRequestConfig,
} from "../src/index.js";

// Import Tunnel type for use in interfaces
import type { Tunnel } from "../src/index.js";

/**
 * Template configuration types
 */
export interface BasicTunnelConfig {
  name?: string;
}

export interface WebAppTunnelConfig {
  hostname: string;
  frontendPort: number;
  apiPort: number;
  enableHttps?: boolean;
  apiPath?: string;
}

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
 * Template return types
 */
export interface BasicTunnelResult {
  tunnel: Tunnel;
  app: any;
  getRunCommand: () => string;
  getTunnelUrl: () => string;
}

export interface WebAppTunnelResult {
  tunnel: Tunnel;
  app: any;
  config: WebAppTunnelConfig;
  getRunCommand: () => string;
  getFrontendUrl: () => string;
  getApiUrl: (path?: string) => string;
  getLocalUrls: () => {
    frontend: string;
    api: string;
  };
}

export interface SecureTunnelResult {
  tunnel: Tunnel;
  app: any;
  config: SecureTunnelConfig;
  getRunCommand: () => string;
  getSecureUrl: () => string;
  getSecurityReport: () => {
    tlsVerification: string;
    connectTimeout: number;
    tlsTimeout: number;
    http2Enabled: boolean;
    customHeaders: {
      hostHeader: string;
    };
    accessIntegration: boolean;
  };
  validateSecurity: () => {
    isValid: boolean;
    issues: string[];
  };
}

export interface DevelopmentTunnelResult {
  tunnel: Tunnel;
  app: any;
  config: DevelopmentTunnelConfig;
  getRunCommand: () => string;
  getServiceUrls: () => Record<string, string>;
  getLocalServiceUrls: () => Record<string, string>;
  getDevelopmentInfo: () => {
    tunnelName: string;
    tunnelId: string;
    environment: string;
    services: Array<{
      name: string;
      port: number;
      path?: string;
      hostname?: string;
    }>;
    adoptionEnabled: boolean;
    warpEnabled: boolean;
    runCommand: string;
  };
  validateDevelopmentSetup: () => {
    isValid: boolean;
    issues: string[];
  };
}

/**
 * Utility types
 */
export type TunnelTemplate =
  | "basic-tunnel"
  | "web-app-tunnel"
  | "secure-tunnel"
  | "development-tunnel";

export type TunnelTemplateConfig<T extends TunnelTemplate> =
  T extends "basic-tunnel"
    ? BasicTunnelConfig
    : T extends "web-app-tunnel"
      ? WebAppTunnelConfig
      : T extends "secure-tunnel"
        ? SecureTunnelConfig
        : T extends "development-tunnel"
          ? DevelopmentTunnelConfig
          : never;

export type TunnelTemplateResult<T extends TunnelTemplate> =
  T extends "basic-tunnel"
    ? BasicTunnelResult
    : T extends "web-app-tunnel"
      ? WebAppTunnelResult
      : T extends "secure-tunnel"
        ? SecureTunnelResult
        : T extends "development-tunnel"
          ? DevelopmentTunnelResult
          : never;

/**
 * Resource metadata types
 */
export interface TunnelResourceMetadata {
  resource: "cloudflare::Tunnel";
  category: "networking";
  provider: "cloudflare";
  type: "infrastructure";
  phase: "foundation";
  templates: TunnelTemplate[];
  features: [
    "ingress-rules",
    "origin-configuration",
    "warp-routing",
    "tunnel-adoption",
    "dns-management",
    "lifecycle-management",
  ];
  compatibility: {
    alchemy: ">=0.76.1";
    cloudflare: ">=2024.1.0";
  };
}

/**
 * Validation types
 */
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface SecurityValidationResult extends ValidationResult {
  securityLevel: "low" | "medium" | "high";
  recommendations: string[];
}

export interface ConfigurationValidationResult extends ValidationResult {
  configurationType: "basic" | "web-app" | "secure" | "development";
  missingRequired: string[];
  optionalWarnings: string[];
}

/**
 * Event types
 */
export interface TunnelEvent {
  type: "created" | "updated" | "deleted" | "adopted" | "error";
  tunnelId: string;
  timestamp: Date;
  data?: any;
}

export interface TunnelMetrics {
  tunnelId: string;
  activeConnections: number;
  bytesTransferred: number;
  requestCount: number;
  errorCount: number;
  uptime: number;
  lastActivity: Date;
}

/**
 * Export all template functions
 */
export declare function basicTunnel(name?: string): Promise<BasicTunnelResult>;
export declare function webAppTunnel(
  config: WebAppTunnelConfig,
): Promise<WebAppTunnelResult>;
export declare function secureTunnel(
  config: SecureTunnelConfig,
): Promise<SecureTunnelResult>;
export declare function developmentTunnel(
  config: DevelopmentTunnelConfig,
): Promise<DevelopmentTunnelResult>;
