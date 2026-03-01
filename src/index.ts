#!/usr/bin/env node
// ============================================================
// Pinterest MCP Server — Entry Point
// ============================================================

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getAvailableScopes } from "./auth.js";
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

// --------------- Resolve Scopes ---------------

let scopes: Set<string>;

if (hasDirectToken) {
  // Direct token: assume standard read-only scopes
  scopes = new Set([
    "pins:read",
    "boards:read",
    "user_accounts:read",
  ]);
  console.error("[init] Direct access token — read-only mode.");
} else {
  // OAuth: read scopes from stored token file
  scopes = getAvailableScopes();

  if (scopes.size === 0) {
    // No token yet — register all tools optimistically; they will fail gracefully
    // until the user runs pinterest_auth
    scopes = new Set([
      "pins:read", "pins:write",
      "boards:read", "boards:write",
      "user_accounts:read",
    ]);
    console.error("[init] OAuth mode — no token yet. Run pinterest_auth to authenticate.");
  } else {
    const hasWrite = scopes.has("boards:write") || scopes.has("pins:write");
    console.error(`[init] OAuth mode — ${hasWrite ? "read + write" : "read-only"} access.`);
    console.error(`[init] Active scopes: ${[...scopes].join(", ")}`);
  }
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
registerBoardTools(server, scopes);
registerPinTools(server, scopes);
registerSearchTools(server, scopes);

// --------------- Connect via STDIO ---------------

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Pinterest MCP Server v1.0.0 running on STDIO");
