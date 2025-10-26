import { getDb } from "../db";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
import { ChatRoom } from "./durable-object";
import type { WorkerEnv } from "../env.d.ts";

// Re-export ChatRoom to make it available to the worker
export { ChatRoom };

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/api/health") {
        return json(
          { status: "ok", timestamp: new Date().toISOString() },
          200,
          corsHeaders,
        );
      }

      // Users endpoints
      if (path === "/api/users" && request.method === "GET") {
        const db = getDb(env.DB);
        const users = await db.select().from(schema.users).limit(100);
        return json({ users }, 200, corsHeaders);
      }

      if (path === "/api/users" && request.method === "POST") {
        const data = (await request.json()) as any;
        const db = getDb(env.DB);
        const newUser = {
          id: crypto.randomUUID(),
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          createdAt: new Date(),
        };
        await db.insert(schema.users).values(newUser);

        // Trigger queue job for user creation
        await env.JOBS.send({ type: "user_created", userId: newUser.id });

        return json({ user: newUser }, 201, corsHeaders);
      }

      // Files endpoints
      if (path.startsWith("/api/files/") && request.method === "GET") {
        const fileId = path.split("/")[3];
        const db = getDb(env.DB);
        const file = await db
          .select()
          .from(schema.files)
          .where(eq(schema.files.id, fileId))
          .get();

        if (!file) {
          return json({ error: "File not found" }, 404, corsHeaders);
        }

        const object = await env.STORAGE.get(file.key);
        if (!object) {
          return json({ error: "File not found in storage" }, 404, corsHeaders);
        }

        return new Response(object.body, {
          headers: {
            "Content-Type": file.contentType || "application/octet-stream",
            ...corsHeaders,
          },
        });
      }

      if (path === "/api/upload" && request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file) {
          return json({ error: "No file provided" }, 400, corsHeaders);
        }

        const key = `uploads/${crypto.randomUUID()}-${file.name}`;
        await env.STORAGE.put(key, file);

        const db = getDb(env.DB);
        const newFile = {
          id: crypto.randomUUID(),
          userId,
          key,
          size: file.size,
          contentType: file.type,
          uploadedAt: new Date(),
        };
        await db.insert(schema.files).values(newFile);

        // Trigger queue job for file processing
        await env.JOBS.send({ type: "file_uploaded", fileId: newFile.id });

        return json({ file: newFile }, 201, corsHeaders);
      }

      // Cache endpoints
      if (path.startsWith("/api/cache/") && request.method === "GET") {
        const key = path.split("/")[3];
        const value = await env.CACHE.get(key);
        return json({ key, value, found: !!value }, 200, corsHeaders);
      }

      if (path.startsWith("/api/cache/") && request.method === "POST") {
        const key = path.split("/")[3];
        const data = await request.json();
        await env.CACHE.put(key, JSON.stringify(data));
        return json({ key, message: "cached" }, 201, corsHeaders);
      }

      // Chat WebSocket endpoint
      if (
        path === "/api/chat" &&
        request.headers.get("Upgrade") === "websocket"
      ) {
        const chatEnv = env as any;
        if (!chatEnv.CHAT) {
          return json({ error: "Chat not available" }, 503, corsHeaders);
        }
        const durableObjectId = chatEnv.CHAT.idFromName("main-room");
        const durableObject = chatEnv.CHAT.get(durableObjectId);
        return durableObject.fetch(request);
      }

      // Workflow trigger endpoint
      if (path === "/api/workflow/start" && request.method === "POST") {
        const workflowEnv = env as any;
        if (!workflowEnv.WORKFLOW) {
          return json({ error: "Workflow not available" }, 503, corsHeaders);
        }
        const data = (await request.json()) as any;
        const workflowId = workflowEnv.WORKFLOW.idFromName(
          data.userId || "default",
        );
        const workflow = workflowEnv.WORKFLOW.get(workflowId);

        const handle = await workflow.start(data);
        return json({ workflowId: handle.id }, 201, corsHeaders);
      }

      // GitHub webhook endpoint
      if (path === "/api/github/webhook" && request.method === "POST") {
        try {
          // Verify webhook signature
          const signature = request.headers.get("x-hub-signature-256");
          const event = request.headers.get("x-github-event");
          const delivery = request.headers.get("x-github-delivery");

          const payload = (await request.json()) as any;

          console.log("GitHub webhook received:", {
            event,
            delivery,
            repository: payload.repository?.full_name,
            action: payload.action,
          });

          // Handle different GitHub events
          if (event === "push") {
            const branch = payload.ref?.replace("refs/heads/", "");
            console.log(`Push to branch: ${branch}`);

            // Example: Trigger deployment workflow
            const workflowEnv = env as any;
            if (branch === "main" && workflowEnv.WORKFLOW) {
              const workflowId =
                workflowEnv.WORKFLOW.idFromName("github-deploy");
              const workflow = workflowEnv.WORKFLOW.get(workflowId);
              await workflow.start({
                event: "deploy",
                branch,
                commit: payload.head_commit?.id,
                repository: payload.repository?.full_name,
              });
            }
          } else if (event === "pull_request") {
            const action = payload.action;
            const prNumber = payload.pull_request?.number;
            console.log(`Pull request ${action}: #${prNumber}`);

            // Example: Run tests or preview deployment
            const workflowEnv = env as any;
            if (
              (action === "opened" || action === "synchronize") &&
              workflowEnv.WORKFLOW
            ) {
              const workflowId = workflowEnv.WORKFLOW.idFromName(
                `pr-${prNumber}`,
              );
              const workflow = workflowEnv.WORKFLOW.get(workflowId);
              await workflow.start({
                event: "preview",
                prNumber,
                branch: payload.pull_request?.head?.ref,
                repository: payload.repository?.full_name,
              });
            }
          }

          return json({ received: true, event, delivery }, 200, corsHeaders);
        } catch (error) {
          console.error("GitHub webhook error:", error);
          return json({ error: "Webhook processing failed" }, 500, corsHeaders);
        }
      }

      return json({ error: "Not found" }, 404, corsHeaders);
    } catch (error) {
      console.error("Error:", error);
      return json(
        { error: "Internal server error", message: String(error) },
        500,
        corsHeaders,
      );
    }
  },
};

// Type definitions from alchemy.run.ts
interface Env {
  DB: any; // D1Database
  STORAGE: any; // R2Bucket
  JOBS: any; // Queue
  CACHE: any; // KVNamespace
  CHAT?: any; // DurableObjectNamespace (optional)
  WORKFLOW?: any; // WorkflowNamespace (optional - temporarily disabled)
  API_KEY: string;
}

// Helper functions
function json(data: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// Import schema for type inference
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
