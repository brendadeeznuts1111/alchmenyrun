/**
 * WebSocket Chat Worker Template
 * Copy this to your project: src/blocks/[name]/worker.ts
 */

export { ChatRoom } from "./do";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket upgrade for chat
    if (request.headers.get("Upgrade") === "websocket") {
      const id = env.ROOM.idFromName("main-room");
      const room = env.ROOM.get(id);
      return room.fetch(request);
    }
    
    return new Response("Chat worker ready", { status: 200 });
  },
};
