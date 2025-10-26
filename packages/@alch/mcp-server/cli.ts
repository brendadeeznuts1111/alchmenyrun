#!/usr/bin/env bun
/**
 * MCP CLI - Start MCP server with infrastructure resources
 */

import { startMCPServer } from "./src/index.ts";
import { BunShell, BunTest, BunBuild } from "../bun-runtime/src/index.ts";

// Define available resources
const resources = {
  build: BunBuild("./src/index.ts", "./dist"),
  test: BunTest(),
  lint: BunShell("lint", "bun run format:check"),
  format: BunShell("format", "bun run format"),
  check: BunShell("check", "bun run check"),
};

// Start MCP server
await startMCPServer(resources);
