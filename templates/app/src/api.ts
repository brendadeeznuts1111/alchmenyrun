// Example Cloudflare Worker API
// Learn more: https://developers.cloudflare.com/workers/

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Example routes
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', timestamp: Date.now() });
    }
    
    if (url.pathname === '/api/hello') {
      return Response.json({ message: 'Hello from Alchemy!' });
    }
    
    // Default response
    return Response.json(
      { error: 'Not found' },
      { status: 404 }
    );
  },
};
