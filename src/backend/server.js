import { getDb } from "../db";
import { ChatRoom } from "./durable-object";
import OnboardingWorkflow from "./workflow";
// Re-export Durable Object and Workflow classes
export { ChatRoom, OnboardingWorkflow };
export default {
  async fetch(request, env) {
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
        const data = await request.json();
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
        const file = formData.get("file");
        const userId = formData.get("userId");
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
        const chatEnv = env;
        if (!chatEnv.CHAT) {
          return json({ error: "Chat not available" }, 503, corsHeaders);
        }
        const durableObjectId = chatEnv.CHAT.idFromName("main-room");
        const durableObject = chatEnv.CHAT.get(durableObjectId);
        return durableObject.fetch(request);
      }
      // Workflow trigger endpoint
      if (path === "/api/workflow/start" && request.method === "POST") {
        const workflowEnv = env;
        if (!workflowEnv.WORKFLOW) {
          return json({ error: "Workflow not available" }, 503, corsHeaders);
        }
        const data = await request.json();
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
          const payload = await request.json();
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
            const workflowEnv = env;
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
            const workflowEnv = env;
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
      // Serve custom 404 page for HTML requests
      const acceptsHtml = request.headers.get("Accept")?.includes("text/html");
      if (acceptsHtml) {
        return new Response(get404Page(), {
          status: 404,
          headers: {
            "Content-Type": "text/html",
            ...corsHeaders,
          },
        });
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
// Helper functions
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
// Import schema for type inference
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
// Custom 404 page
function get404Page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | Alchemy.run</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        .error-code {
            font-size: 120px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
            margin-bottom: 20px;
        }
        h1 { font-size: 32px; color: #2d3748; margin-bottom: 16px; }
        p { font-size: 18px; color: #718096; margin-bottom: 32px; line-height: 1.6; }
        .buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn {
            padding: 14px 32px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            display: inline-block;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4); }
        .btn-secondary { background: #f7fafc; color: #4a5568; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { background: #edf2f7; transform: translateY(-2px); }
        .links { margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0; }
        .links h2 { font-size: 18px; color: #2d3748; margin-bottom: 16px; }
        .link-list { display: flex; flex-direction: column; gap: 12px; }
        .link-list a { color: #667eea; text-decoration: none; font-size: 16px; transition: color 0.3s ease; }
        .link-list a:hover { color: #764ba2; text-decoration: underline; }
        @media (max-width: 640px) {
            .container { padding: 40px 24px; }
            .error-code { font-size: 80px; }
            h1 { font-size: 24px; }
            p { font-size: 16px; }
            .buttons { flex-direction: column; }
            .btn { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>Oops! The page you're looking for doesn't exist. It might have been moved or deleted.</p>
        <div class="buttons">
            <a href="/" class="btn btn-primary">Go Home</a>
            <a href="https://github.com/brendadeeznuts1111/alchmenyrun" class="btn btn-secondary">View on GitHub</a>
        </div>
        <div class="links">
            <h2>Helpful Links</h2>
            <div class="link-list">
                <a href="https://github.com/brendadeeznuts1111/alchmenyrun/blob/main/QUICK_START.md">📚 Quick Start Guide</a>
                <a href="https://github.com/brendadeeznuts1111/alchmenyrun/blob/main/docs/">📖 Documentation</a>
                <a href="https://github.com/brendadeeznuts1111/alchmenyrun/issues">🐛 Report an Issue</a>
                <a href="https://alchemy.run">🚀 Alchemy Documentation</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}
