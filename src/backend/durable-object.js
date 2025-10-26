/**
 * Durable Object for real-time chat
 * Handles WebSocket connections and shared state
 */
import { DurableObject } from "cloudflare:workers";
export class ChatRoom extends DurableObject {
  sessions;
  constructor(ctx, env) {
    super(ctx, env);
    this.sessions = new Map();
  }
  async fetch(request) {
    const url = new URL(request.url);
    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.handleSession(server);
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    // Handle HTTP request
    return new Response(
      JSON.stringify({
        connected: this.sessions.size,
        room: "main-room",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  handleSession(websocket) {
    websocket.accept();
    const session = { websocket, userId: "unknown" };
    this.sessions.set(websocket, session);
    websocket.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "join":
            session.userId = data.userId;
            await this.broadcast({
              type: "user_joined",
              userId: data.userId,
              timestamp: new Date().toISOString(),
            });
            break;
          case "message":
            await this.broadcast({
              type: "message",
              userId: session.userId,
              text: data.text,
              timestamp: new Date().toISOString(),
            });
            break;
          case "ping":
            websocket.send(JSON.stringify({ type: "pong" }));
            break;
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });
    websocket.addEventListener("close", async () => {
      this.sessions.delete(websocket);
      await this.broadcast({
        type: "user_left",
        userId: session.userId,
        timestamp: new Date().toISOString(),
      });
    });
  }
  async broadcast(message) {
    const data = JSON.stringify(message);
    this.sessions.forEach((session) => {
      try {
        session.websocket.send(data);
      } catch (error) {
        console.error("Error broadcasting:", error);
      }
    });
  }
}
