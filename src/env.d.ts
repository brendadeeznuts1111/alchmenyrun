import type { website } from "../alchemy.run";

// Export the environment type for type-safe bindings
export type WorkerEnv = typeof website.Env;

// Augment the global Cloudflare Workers Env interface
declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends WorkerEnv {}
  }
}
