# Alchemy MCP Server

> **Model Context Protocol (MCP) integration for Alchemy infrastructure operations**

This is a Bun-native MCP server that exposes Alchemy infrastructure operations as tools that can be called by Claude, Cursor, or other MCP-compatible clients.

## What is MCP?

[Model Context Protocol (MCP)](https://bun.com/docs/mcp) is Bun's official protocol for exposing runtime functionality to AI assistants and other tools. It provides:

- **Type-safe tool definitions** - Tools are defined in TypeScript with full type inference
- **Automatic client generation** - Types are generated for clients automatically
- **Secure sandboxing** - Built-in capability-based permission system
- **Zero configuration** - Works out of the box with Bun

## Quick Start

### 1. Install Dependencies

```bash
cd examples/mcp
bun install
```

### 2. Start the MCP Server

```bash
bun run dev
```

The server will start on `http://localhost:3000` with two endpoints:
- HTTP: `http://localhost:3000/mcp`
- SSE: `http://localhost:3000/sse`

### 3. Configure Your MCP Client

#### Claude Desktop

Edit `~/.config/claude/config.json`:

```json
{
  "mcpServers": {
    "alchemy": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

#### Cursor

Add to your Cursor settings:

```json
{
  "mcp.servers": [
    {
      "name": "alchemy",
      "url": "http://localhost:3000/mcp"
    }
  ]
}
```

## Available Tools

### Infrastructure Management

#### `get_resource_status`
Get the current status of all deployed Alchemy resources.

**Parameters:**
- `stage` (optional): Deployment stage (prod, staging, dev) - default: "prod"

**Returns:** Status of all resources including health, type, and URLs

**Example:**
```typescript
{
  stage: "prod",
  resources: {
    database: { status: "healthy", type: "D1Database" },
    storage: { status: "healthy", type: "R2Bucket" },
    website: { status: "deployed", url: "https://example.workers.dev" }
  }
}
```

#### `deploy_infrastructure`
Deploy Alchemy infrastructure to a specific stage.

**Parameters:**
- `stage` (required): Deployment stage (prod, staging, preview)
- `dryRun` (optional): Preview changes without deploying - default: false

**Returns:** Deployment result with URLs and resource IDs

**Example:**
```typescript
{
  stage: "staging",
  deployed: true,
  urls: {
    website: "https://website-staging.example.workers.dev"
  }
}
```

#### `destroy_infrastructure`
Destroy all resources for a specific stage.

**Parameters:**
- `stage` (required): Deployment stage to destroy
- `confirm` (required): Confirmation flag (prevents accidental deletion)

**Returns:** Destruction result with list of removed resources

**Example:**
```typescript
{
  stage: "preview-123",
  destroyed: true,
  resourcesRemoved: ["D1Database: demo-db", "Worker: website"]
}
```

### Database Operations

#### `query_database`
Execute a SQL query against the D1 database (SELECT only for safety).

**Parameters:**
- `query` (required): SQL query (must start with SELECT)
- `stage` (optional): Deployment stage - default: "prod"

**Returns:** Query results with row data

**Example:**
```typescript
{
  stage: "prod",
  query: "SELECT * FROM users LIMIT 10",
  results: [{ id: "1", name: "User" }],
  rowCount: 1
}
```

### Storage Operations

#### `list_bucket_objects`
List objects in the R2 storage bucket.

**Parameters:**
- `prefix` (optional): Filter by prefix - default: ""
- `limit` (optional): Maximum objects to return - default: 100
- `stage` (optional): Deployment stage - default: "prod"

**Returns:** List of objects with keys, sizes, and upload dates

**Example:**
```typescript
{
  stage: "prod",
  objects: [
    { key: "uploads/file1.pdf", size: 1024000, uploaded: "2025-01-01T00:00:00Z" }
  ],
  count: 1
}
```

### Workflow Operations

#### `trigger_workflow`
Start a Cloudflare Workflow execution.

**Parameters:**
- `workflowName` (required): Name of the workflow
- `params` (optional): Parameters to pass - default: {}
- `stage` (optional): Deployment stage - default: "prod"

**Returns:** Workflow execution details with ID and status

**Example:**
```typescript
{
  workflowName: "OnboardingWorkflow",
  executionId: "uuid-here",
  status: "running",
  startedAt: "2025-01-01T00:00:00Z"
}
```

### Cache Operations

#### `get_cache_stats`
Get statistics about KV namespace usage.

**Parameters:**
- `stage` (optional): Deployment stage - default: "prod"

**Returns:** Cache statistics including key count and hit rate

**Example:**
```typescript
{
  stage: "prod",
  keyCount: 42,
  sizeBytes: 10240000,
  hitRate: 0.85
}
```

### Durable Object Operations

#### `send_durable_object_message`
Send a message to a Durable Object instance.

**Parameters:**
- `objectName` (required): Name of the Durable Object
- `message` (required): Message to send
- `stage` (optional): Deployment stage - default: "prod"

**Returns:** Response from the Durable Object

**Example:**
```typescript
{
  objectName: "ChatDO",
  messageSent: true,
  response: "Message received"
}
```

## Architecture

```
┌─────────────────┐
│ Claude / Cursor │
│   MCP Client    │
└────────┬────────┘
         │ HTTP/SSE
         │
┌────────▼────────┐
│   Bun MCP       │
│   Server        │
│  (port 3000)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Alchemy Tools  │
│  - deploy       │
│  - query        │
│  - list         │
│  - trigger      │
└────────┬────────┘
         │
┌────────▼────────┐
│   Cloudflare    │
│   Resources     │
│ D1/R2/KV/DO/WF  │
└─────────────────┘
```

## Key Differences from Core Alchemy

This MCP server is an **optional extension** that:

1. **Runs in Bun** (not in Cloudflare Workers)
2. **Uses MCP protocol** (not the Fetch API)
3. **Exposes operations as tools** (not HTTP endpoints)
4. **Is for AI assistants** (not for end users)

The core Alchemy patterns remain 100% compliant with the official guide - this MCP server is purely additive.

## Integration with Main Project

To use this MCP server with your main Alchemy project:

1. **Keep running in parallel:**
   ```bash
   # Terminal 1: Main Alchemy app
   cd ../..
   bun run dev

   # Terminal 2: MCP server
   cd examples/mcp
   bun run dev
   ```

2. **Configure your AI assistant** to use the MCP endpoint

3. **Ask Claude/Cursor to:**
   - "Get the status of all resources"
   - "Deploy to staging"
   - "Query the database for recent users"
   - "List files in the R2 bucket"
   - "Trigger the onboarding workflow"

## Security Considerations

- **Read-only operations** are safe (status, list, query SELECT)
- **Write operations** require confirmation parameters
- **Production safeguards** prevent accidental destruction
- **SQL injection protection** - only SELECT queries allowed
- **Stage isolation** - operations are scoped to specific stages

## Extending the MCP Server

To add new tools, edit `tools.ts`:

```typescript
import { tool } from "bun-mcp";

export const myNewTool = tool({
  name: "my_new_tool",
  description: "Description of what this tool does",
  input: {
    param1: {
      type: "string",
      description: "Parameter description",
      optional: false
    }
  },
  output: {
    type: "object",
    description: "What this tool returns"
  },
  async run({ param1 }) {
    // Implementation here
    return { result: "success" };
  }
});
```

The tool will automatically be available to MCP clients without restarting.

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Connection Refused
- Make sure the MCP server is running: `bun run dev`
- Check the URL in your MCP client config
- Verify port 3000 is accessible

### Tools Not Showing Up
- Restart your MCP client (Claude Desktop, Cursor, etc.)
- Check the server logs for errors
- Verify the config.json syntax

## References

- [Bun MCP Documentation](https://bun.com/docs/mcp)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Alchemy Documentation](https://alchemy.run)
- [Main Project README](../../README.md)

---

**Status**: Optional extension - not required for core Alchemy compliance

