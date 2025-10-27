// Alchemy configuration for GitHub webhook worker
export default {
  name: "github-webhook-worker",

  // Define your Cloudflare resources
  resources: {
    // Worker for GitHub webhook handling
    webhook: {
      type: "worker",
      script: "./index.js",
      environment: {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        COUNCIL_ID: process.env.COUNCIL_ID,
        STREAM_TOPIC_ID: process.env.STREAM_TOPIC_ID,
        STREAM_EMOJI: process.env.STREAM_EMOJI,
        STREAM_SHORT: process.env.STREAM_SHORT
      }
    }
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
