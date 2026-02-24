// ============================================================
// MCP Tools — Pinterest Authentication
// ============================================================

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startOAuthFlow, getAuthStatus } from "../auth.js";

export function registerAuthTools(server: McpServer): void {
  // --- pinterest_auth ---
  server.tool(
    "pinterest_auth",
    "Initiate Pinterest OAuth authentication flow. Opens a browser for you to authorize the app.",
    {},
    async () => {
      try {
        const message = await startOAuthFlow();
        return {
          content: [{ type: "text" as const, text: message }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[pinterest_auth] Error:", msg);
        return {
          content: [{ type: "text" as const, text: `Authentication failed: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // --- pinterest_auth_status ---
  server.tool(
    "pinterest_auth_status",
    "Check current Pinterest authentication status.",
    {},
    async () => {
      try {
        const status = getAuthStatus();

        if (!status.authenticated) {
          return {
            content: [{
              type: "text" as const,
              text: "Not authenticated. Use the pinterest_auth tool to connect your Pinterest account.",
            }],
          };
        }

        const lines = [
          "Pinterest Authentication Status:",
          `  Authenticated: ✓`,
          `  Access Token Valid: ${status.accessTokenValid ? "✓" : "✗ (expired)"}`,
          `  Refresh Token Valid: ${status.refreshTokenValid ? "✓" : "✗ (expired)"}`,
          `  Access Token Expires: ${status.expiresAt}`,
          `  Refresh Token Expires: ${status.refreshExpiresAt}`,
          `  Scopes: ${status.scopes}`,
        ];

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error checking auth status: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
