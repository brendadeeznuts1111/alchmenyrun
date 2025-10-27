export default {
  async fetch(req: Request, env: any): Promise<Response> {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await req.json()) as {
        type: string;
        payload: unknown;
        delaySeconds?: number;
      };

      if (!body.type || !body.payload) {
        return new Response(
          JSON.stringify({ error: "type and payload required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await env.QUEUE.send({
        body,
        delaySeconds: body.delaySeconds ?? 0,
      });

      return new Response(
        JSON.stringify({
          enqueued: true,
          id: crypto.randomUUID(),
          type: body.type,
          delaySeconds: body.delaySeconds ?? 0,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
