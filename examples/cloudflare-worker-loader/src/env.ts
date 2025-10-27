import type { worker } from "../alchemy.run.ts";

declare global {
  export type CloudflareEnv = typeof worker.Env;
}

// Type augmentation for Cloudflare worker environment
export interface Env extends CloudflareEnv {}
