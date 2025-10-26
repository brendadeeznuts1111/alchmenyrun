/**
 * Model Context Protocol (MCP) server for Alchemy infrastructure
 * Exposes infrastructure resources as MCP tools for AI assistants
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export interface Resource {
  name: string;
  run: () => Promise<Response>;
}

/**
 * Create an MCP server that exposes infrastructure resources as tools
 */
export function createMCPServer(resources: Record<string, Resource>) {
  const server = new Server(
    {
      name: "alchemy-infra",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.entries(resources).map(([id, resource]) => ({
      name: id,
      description: `Execute ${resource.name || id}`,
      inputSchema: {
        type: "object",
        properties: {},
      },
    })),
  }));

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const resource = resources[req.params.name];

    if (!resource) {
      return {
        content: [
          {
            type: "text",
            text: `Resource '${req.params.name}' not found`,
          },
        ],
        isError: true,
      };
    }

    try {
      const res = await resource.run();
      const text = await res.text();

      return {
        content: [
          {
            type: "text",
            text: `${resource.name} result:\n${text}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${resource.name}: ${error}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start MCP server with stdio transport
 */
export async function startMCPServer(resources: Record<string, Resource>) {
  const server = createMCPServer(resources);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP server started");
}
