#!/usr/bin/env node
// ============================================================
// Pinterest MCP Server — Entry Point
// ============================================================

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerAuthTools } from "./tools/auth.js";
import { registerBoardTools } from "./tools/boards.js";
import { registerPinTools } from "./tools/pins.js";
import { registerSearchTools } from "./tools/search.js";

// --------------- Validate Environment ---------------

const hasDirectToken = !!process.env.PINTEREST_ACCESS_TOKEN;
const hasOAuthCredentials = !!process.env.PINTEREST_APP_ID && !!process.env.PINTEREST_APP_SECRET;

if (!hasDirectToken && !hasOAuthCredentials) {
  console.error("╔═══════════════════════════════════════════════════════════╗");
  console.error("║  Set PINTEREST_ACCESS_TOKEN for direct token access,       ║");
  console.error("║  or PINTEREST_APP_ID + PINTEREST_APP_SECRET for OAuth.     ║");
  console.error("╚═══════════════════════════════════════════════════════════╝");
  process.exit(1);
}

if (hasDirectToken) {
  console.error("[init] Using direct access token (read-only mode).");
} else {
  console.error("[init] Using OAuth credentials (full access mode).");
}

// --------------- Create Server ---------------

const server = new McpServer(
  {
    name: "pinterest-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// --------------- Register Tools ---------------

registerAuthTools(server);
registerBoardTools(server);
registerPinTools(server);
registerSearchTools(server);

// --------------- Connect via STDIO ---------------

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Pinterest MCP Server v1.0.0 running on STDIO");
