/**
 * Chat Room Durable Object Template
 * Copy this to your project: src/blocks/[name]/do.ts
 */

import { DurableObject } from "cloudflare:workers";

export class ChatRoom extends DurableObject {
  private sessions: Set<WebSocket>;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);
      this.sessions.add(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response("Chat room ready", { status: 200 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    // Broadcast to all connected clients
    for (const session of this.sessions) {
      if (session !== ws && session.readyState === WebSocket.OPEN) {
        session.send(message);
      }
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket, error: Error) {
    console.error("WebSocket error:", error);
    this.sessions.delete(ws);
  }
}
