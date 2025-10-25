/**
 * MCP Request Handler
 *
 * Handles incoming MCP protocol requests and routes to appropriate tools
 */
import * as tools from "./tools";
/**
 * Handle an MCP protocol request
 */
export async function handleMCPRequest(request, env, authResult) {
    try {
        // Parse JSON-RPC request
        const mcpRequest = await request.json();
        // Validate JSON-RPC structure
        if (mcpRequest.jsonrpc !== "2.0") {
            return createErrorResponse(mcpRequest.id, -32600, "Invalid Request: jsonrpc must be 2.0");
        }
        if (!mcpRequest.method) {
            return createErrorResponse(mcpRequest.id, -32600, "Invalid Request: method is required");
        }
        // Route to appropriate handler
        const response = await routeMethod(mcpRequest, env, authResult);
        return Response.json(response);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            return createErrorResponse(null, -32700, "Parse error: Invalid JSON");
        }
        return createErrorResponse(null, -32603, `Internal error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
/**
 * Route method to appropriate tool
 */
async function routeMethod(request, env, authResult) {
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
            const toolName = params.name;
            const toolArguments = params.arguments || {};
            if (!toolName) {
                return createErrorResponse(id, -32602, "Invalid params: name is required");
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
        return createErrorResponse(id, -32601, `Method not found: ${method}`);
    }
    catch (error) {
        return createErrorResponse(id, -32603, `Tool execution error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
/**
 * Create an error response
 */
function createErrorResponse(id, code, message, data) {
    const response = {
        jsonrpc: "2.0",
        id: id || 0,
        error: {
            code,
            message,
            ...(data && { data }),
        },
    };
    return Response.json(response);
}
