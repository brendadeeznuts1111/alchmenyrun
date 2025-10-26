import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";

// Demo app showcasing all Worker production features
const app = await alchemy("worker-prod-demo", {
  phase: (process.env.PHASE as "up" | "destroy" | "read") || "up",
  password: process.env.ALCHEMY_PASSWORD || "demo-password-change-in-production",
});

export const worker = await Worker("worker-prod-demo", {
  entrypoint: "src/index.ts",
  // All production features enabled
  crons: ["*/5 * * * *"], // Health check every 5 minutes
  placement: {
    mode: "smart", // Enable smart placement for optimal performance
  },
  observability: {
    enabled: true,
    logs: {
      enabled: true,
      headSamplingRate: 1.0, // Log all requests
    },
    traces: {
      enabled: true,
      headSamplingRate: 0.1, // Sample 10% of traces
    },
  },
  limits: {
    cpu_ms: 50000, // 50 second CPU limit
  },
});

console.log({
  url: worker.url,
  features: [
    "observability: ✅ auto-injected metrics",
    "smart_placement: ✅ respect cf.colo",
    "cron_triggers: ✅ every 5 min health-check",
    "cpu_limits: ✅ 50 second timeout",
    "distributed_tracing: ✅ 10% sampling",
  ],
});

// Finalize the app
await app.finalize();
