// ============================================================
// MCP Tools — Pinterest Search & User Profile
// ============================================================

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchPins, getUserAccount } from "../api.js";

export function registerSearchTools(server: McpServer): void {
  // --- search_pins ---
  server.tool(
    "search_pins",
    "Search your pins by keyword.",
    {
      query: z.string().describe("Search query"),
      bookmark: z.string().optional().describe("Pagination cursor from previous response"),
    },
    async ({ query, bookmark }) => {
      try {
        const result = await searchPins(query, bookmark);

        if (result.items.length === 0) {
          return {
            content: [{ type: "text" as const, text: `No pins found for query: "${query}"` }],
          };
        }

        const lines = result.items.map((pin) => {
          const title = pin.title || "(no title)";
          const desc = pin.description
            ? pin.description.length > 80
              ? pin.description.substring(0, 80) + "…"
              : pin.description
            : "(no description)";
          return `[${pin.id}] "${title}" — ${desc}`;
        });

        lines.unshift(`Search results for "${query}" (${result.items.length} pins):\n`);

        if (result.bookmark) {
          lines.push(`\n--- More results available. Use bookmark: "${result.bookmark}" ---`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error searching pins: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // --- get_user_profile ---
  server.tool(
    "get_user_profile",
    "Get the authenticated user's Pinterest profile information.",
    {},
    async () => {
      try {
        const user = await getUserAccount();

        const text = [
          "Pinterest User Profile:",
          `  Username: ${user.username}`,
          `  Account Type: ${user.account_type}`,
          `  Boards: ${user.board_count}`,
          `  Pins: ${user.pin_count}`,
          `  Followers: ${user.follower_count}`,
          `  Following: ${user.following_count}`,
          user.website_url ? `  Website: ${user.website_url}` : "",
        ].filter(Boolean).join("\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error getting user profile: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
