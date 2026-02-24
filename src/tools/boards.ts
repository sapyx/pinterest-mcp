// ============================================================
// MCP Tools — Pinterest Boards
// ============================================================

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listBoards,
  createBoard,
  listBoardSections,
  createBoardSection,
} from "../api.js";

export function registerBoardTools(server: McpServer): void {
  // --- list_boards ---
  server.tool(
    "list_boards",
    "List all boards for the authenticated Pinterest user.",
    {
      page_size: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 25)"),
      bookmark: z.string().optional().describe("Pagination cursor from previous response"),
    },
    async ({ page_size, bookmark }) => {
      try {
        const result = await listBoards(page_size, bookmark);

        if (result.items.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No boards found." }],
          };
        }

        const lines = result.items.map((board) => {
          const sections = board.pin_count > 0 ? ` — ${board.pin_count} pins` : "";
          return `[${board.id}] ${board.name} (${board.privacy})${sections}`;
        });

        if (result.bookmark) {
          lines.push(`\n--- More results available. Use bookmark: "${result.bookmark}" ---`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error listing boards: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // --- create_board ---
  server.tool(
    "create_board",
    "Create a new Pinterest board.",
    {
      name: z.string().describe("Board name"),
      description: z.string().optional().describe("Board description"),
      privacy: z.enum(["PUBLIC", "SECRET"]).optional().describe("Board privacy (default PUBLIC)"),
    },
    async ({ name, description, privacy }) => {
      try {
        const board = await createBoard(name, description, privacy);
        const text = [
          "Board created successfully:",
          `  ID: ${board.id}`,
          `  Name: ${board.name}`,
          `  Privacy: ${board.privacy}`,
          board.description ? `  Description: ${board.description}` : "",
        ].filter(Boolean).join("\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error creating board: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // --- list_board_sections ---
  server.tool(
    "list_board_sections",
    "List all sections of a Pinterest board.",
    {
      board_id: z.string().describe("Board ID"),
      page_size: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 25)"),
      bookmark: z.string().optional().describe("Pagination cursor from previous response"),
    },
    async ({ board_id, page_size, bookmark }) => {
      try {
        const result = await listBoardSections(board_id, page_size, bookmark);

        if (result.items.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No sections found in this board." }],
          };
        }

        const lines = result.items.map((section) => `[${section.id}] ${section.name}`);

        if (result.bookmark) {
          lines.push(`\n--- More results available. Use bookmark: "${result.bookmark}" ---`);
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error listing sections: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  // --- create_board_section ---
  server.tool(
    "create_board_section",
    "Create a new section in a Pinterest board.",
    {
      board_id: z.string().describe("Board ID"),
      name: z.string().describe("Section name"),
    },
    async ({ board_id, name }) => {
      try {
        const section = await createBoardSection(board_id, name);
        return {
          content: [{
            type: "text" as const,
            text: `Section created successfully:\n  ID: ${section.id}\n  Name: ${section.name}`,
          }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error creating section: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
