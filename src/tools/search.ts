// ============================================================
// MCP Tools — Pinterest Search, User Profile & Analytics
// ============================================================

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  searchPins,
  searchBoards,
  getUserAccount,
  listFollowers,
  listFollowing,
  getUserAnalytics,
} from "../api.js";

export function registerSearchTools(server: McpServer, scopes: Set<string>): void {
  const canReadPins = scopes.has("pins:read") || scopes.has("pins:read_secret");
  const canReadBoards = scopes.has("boards:read") || scopes.has("boards:read_secret");
  const canReadUser = scopes.has("user_accounts:read");

  // --- search_pins ---
  if (canReadPins) {
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
            return { content: [{ type: "text" as const, text: `No pins found for query: "${query}"` }] };
          }

          const lines = result.items.map((pin) => {
            const title = pin.title || "(no title)";
            const desc = pin.description
              ? pin.description.length > 80 ? pin.description.substring(0, 80) + "…" : pin.description
              : "(no description)";
            return `[${pin.id}] "${title}" — ${desc}`;
          });

          lines.unshift(`Search results for "${query}" (${result.items.length} pins):\n`);
          if (result.bookmark) lines.push(`\n--- More results. bookmark: "${result.bookmark}" ---`);

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error searching pins: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- search_boards ---
  if (canReadBoards) {
    server.tool(
      "search_boards",
      "Search your boards by keyword.",
      {
        query: z.string().describe("Search query"),
        bookmark: z.string().optional().describe("Pagination cursor from previous response"),
      },
      async ({ query, bookmark }) => {
        try {
          const result = await searchBoards(query, bookmark);

          if (result.items.length === 0) {
            return { content: [{ type: "text" as const, text: `No boards found for query: "${query}"` }] };
          }

          const lines = result.items.map((b) =>
            `[${b.id}] ${b.name} (${b.privacy}) — ${b.pin_count} pins`,
          );

          lines.unshift(`Search results for "${query}" (${result.items.length} boards):\n`);
          if (result.bookmark) lines.push(`\n--- More results. bookmark: "${result.bookmark}" ---`);

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error searching boards: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- get_user_profile ---
  if (canReadUser) {
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

          return { content: [{ type: "text" as const, text }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error getting user profile: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- list_followers ---
  if (canReadUser) {
    server.tool(
      "list_followers",
      "List your Pinterest followers.",
      {
        page_size: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 25)"),
        bookmark: z.string().optional().describe("Pagination cursor from previous response"),
      },
      async ({ page_size, bookmark }) => {
        try {
          const result = await listFollowers(page_size, bookmark);

          if (result.items.length === 0) {
            return { content: [{ type: "text" as const, text: "No followers found." }] };
          }

          const lines = result.items.map((u) =>
            `@${u.username} — ${u.follower_count} followers, ${u.pin_count} pins`,
          );
          if (result.bookmark) lines.push(`\n--- More results. bookmark: "${result.bookmark}" ---`);

          return { content: [{ type: "text" as const, text: `Followers (${result.items.length}):\n\n${lines.join("\n")}` }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error listing followers: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- list_following ---
  if (canReadUser) {
    server.tool(
      "list_following",
      "List the accounts you follow on Pinterest.",
      {
        page_size: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 25)"),
        bookmark: z.string().optional().describe("Pagination cursor from previous response"),
      },
      async ({ page_size, bookmark }) => {
        try {
          const result = await listFollowing(page_size, bookmark);

          if (result.items.length === 0) {
            return { content: [{ type: "text" as const, text: "Not following anyone." }] };
          }

          const lines = result.items.map((u) =>
            `@${u.username} — ${u.follower_count} followers, ${u.pin_count} pins`,
          );
          if (result.bookmark) lines.push(`\n--- More results. bookmark: "${result.bookmark}" ---`);

          return { content: [{ type: "text" as const, text: `Following (${result.items.length}):\n\n${lines.join("\n")}` }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error listing following: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- get_user_analytics ---
  if (canReadUser) {
    server.tool(
      "get_user_analytics",
      "Get analytics for your Pinterest account (impressions, engagement, saves, etc.).",
      {
        start_date: z.string().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().describe("End date (YYYY-MM-DD)"),
        metric_types: z
          .array(z.enum(["IMPRESSION", "ENGAGEMENTS", "ENGAGEMENT_RATE", "CLICK_THROUGH", "CLICK_THROUGH_RATE", "SAVE", "SAVE_RATE"]))
          .optional()
          .describe("Metrics to retrieve (default: all basic metrics)"),
      },
      async ({ start_date, end_date, metric_types }) => {
        try {
          const metrics = metric_types ?? ["IMPRESSION", "ENGAGEMENTS", "ENGAGEMENT_RATE", "CLICK_THROUGH", "SAVE"];
          const data = await getUserAnalytics(start_date, end_date, metrics);

          const lines: string[] = [`User Analytics — ${start_date} to ${end_date}:`];

          const allData = data.all;
          if (allData?.summary_metrics && Object.keys(allData.summary_metrics).length > 0) {
            lines.push(`\nSummary:`);
            for (const [k, v] of Object.entries(allData.summary_metrics)) {
              lines.push(`  ${k}: ${v}`);
            }
          }

          if (allData?.daily_metrics?.length > 0) {
            lines.push(`\nDaily breakdown (${allData.daily_metrics.length} days):`);
            for (const day of allData.daily_metrics.slice(0, 7)) {
              const vals = Object.entries(day)
                .filter(([k]) => k !== "date" && k !== "data_status")
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
              lines.push(`  ${day.date}: ${vals}`);
            }
            if (allData.daily_metrics.length > 7) {
              lines.push(`  ... and ${allData.daily_metrics.length - 7} more days`);
            }
          }

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error getting user analytics: ${msg}` }], isError: true };
        }
      },
    );
  }
}
