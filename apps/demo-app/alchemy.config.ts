// Alchemy configuration for your app
// Documentation: https://github.com/brendadeeznuts1111/alchmenyrun

export default {
  name: "demo-app",

  // Define your Cloudflare resources
  resources: {
    // Example: Worker for API endpoints
    api: {
      type: "worker",
      script: "./src/api.ts",
    },

    // Example: KV for caching
    cache: {
      type: "kv",
    },

    // Example: D1 database
    db: {
      type: "d1",
    },

    // Example: R2 bucket for storage
    storage: {
      type: "r2",
    },
  },

  // Environment-specific configuration
  profiles: {
    dev: {
      // Development settings
    },
    prod: {
      // Production settings
    },
  },
};
