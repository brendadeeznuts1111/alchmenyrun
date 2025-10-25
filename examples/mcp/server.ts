/**
 * Alchemy MCP Server
 * 
 * Exposes Alchemy infrastructure operations as Model Context Protocol tools.
 * Can be consumed by Claude, Cursor, or any MCP-compatible client.
 * 
 * Usage:
 *   bun run server.ts
 * 
 * Then configure your MCP client to point at:
 *   http://localhost:3000/mcp (for HTTP)
 *   http://localhost:3000/sse (for SSE)
 */

import { serve } from "bun-mcp";
import * as tools from "./tools";

console.log("🧪 Starting Alchemy MCP Server...");

// Start the MCP server with all tools
serve({
  tools,
  server: {
    name: "alchemy-mcp",
    version: "1.0.0",
    description: "MCP server for Alchemy infrastructure operations",
  },
  port: 3000,
});

console.log(`
✅ Alchemy MCP Server running!

Endpoints:
  - HTTP: http://localhost:3000/mcp
  - SSE:  http://localhost:3000/sse

Available tools:
  - get_resource_status       Get status of all deployed resources
  - deploy_infrastructure     Deploy to a specific stage
  - destroy_infrastructure    Destroy resources for a stage
  - query_database           Execute SQL queries (SELECT only)
  - list_bucket_objects      List R2 bucket contents
  - trigger_workflow         Start a Cloudflare Workflow
  - get_cache_stats          Get KV namespace statistics
  - send_durable_object_message  Send message to Durable Object

Configure your MCP client (Claude Desktop, Cursor, etc.) to connect to:
  http://localhost:3000/mcp

Example Claude Desktop config (~/.config/claude/config.json):
{
  "mcpServers": {
    "alchemy": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
`);

