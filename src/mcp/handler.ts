/**
 * MCP Request Handler
 *
 * Handles incoming MCP protocol requests and routes to appropriate tools
 */

import type { Env } from "./index";
import type { AuthResult } from "./auth";
import * as tools from "./tools";

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Handle an MCP protocol request
 */
export async function handleMCPRequest(
  request: Request,
  env: Env,
  authResult: AuthResult,
): Promise<Response> {
  try {
    // Parse JSON-RPC request
    const mcpRequest: MCPRequest = await request.json();

    // Validate JSON-RPC structure
    if (mcpRequest.jsonrpc !== "2.0") {
      return createErrorResponse(
        mcpRequest.id,
        -32600,
        "Invalid Request: jsonrpc must be 2.0",
      );
    }

    if (!mcpRequest.method) {
      return createErrorResponse(
        mcpRequest.id,
        -32600,
        "Invalid Request: method is required",
      );
    }

    // Route to appropriate handler
    const response = await routeMethod(mcpRequest, env, authResult);
    return Response.json(response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse(null, -32700, "Parse error: Invalid JSON");
    }

    return createErrorResponse(
      null,
      -32603,
      `Internal error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Route method to appropriate tool
 */
async function routeMethod(
  request: MCPRequest,
  env: Env,
  authResult: AuthResult,
): Promise<MCPResponse> {
  const { method, params = {}, id } = request;

  try {
    // MCP Protocol methods
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "alchemy-mcp-worker",
            version: "1.0.0",
          },
        },
      };
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools.listTools(),
        },
      };
    }

    if (method === "tools/call") {
      const toolName = params.name as string;
      const toolArguments = (params.arguments as Record<string, unknown>) || {};

      if (!toolName) {
        return createErrorMCPResponse(
          id,
          -32602,
          "Invalid params: name is required",
        );
      }

      const result = await tools.executeTool(toolName, toolArguments, env);

      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    // Unknown method
    return createErrorMCPResponse(id, -32601, `Method not found: ${method}`);
  } catch (error) {
    return createErrorMCPResponse(
      id,
      -32603,
      `Tool execution error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Create an error MCPResponse object
 */
function createErrorMCPResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): MCPResponse {
  return {
    jsonrpc: "2.0",
    id: id || 0,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {}),
    },
  };
}

/**
 * Create an error response
 */
function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): Response {
  const response: MCPResponse = createErrorMCPResponse(id, code, message, data);
  return Response.json(response);
}
