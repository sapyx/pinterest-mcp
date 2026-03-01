// ============================================================
// MCP Tools — Pinterest Pins
// ============================================================

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listBoardPins,
  listSectionPins,
  getPin,
  updatePin,
  deletePin,
  savePin,
  createPin,
  getPinAnalytics,
  fetchImageAsBase64,
} from "../api.js";
import type { ImageSizeKey, Pin } from "../types.js";

/** Format a pin summary for listing */
function formatPinSummary(pin: Pin): string {
  const title = pin.title || "(no title)";
  const desc = pin.description
    ? pin.description.length > 80
      ? pin.description.substring(0, 80) + "…"
      : pin.description
    : "(no description)";
  const type = pin.creative_type ?? "unknown";
  return `[${pin.id}] "${title}" — ${desc} [${type}]`;
}

/** Format full pin details */
function formatPinDetails(pin: Pin): string {
  const lines: string[] = [
    `Pin Details:`,
    `  ID: ${pin.id}`,
    `  Title: ${pin.title ?? "(none)"}`,
    `  Description: ${pin.description ?? "(none)"}`,
    `  Alt Text: ${pin.alt_text ?? "(none)"}`,
    `  Link: ${pin.link ?? "(none)"}`,
    `  Board ID: ${pin.board_id}`,
    `  Section ID: ${pin.board_section_id ?? "(none)"}`,
    `  Type: ${pin.creative_type ?? "unknown"}`,
    `  Created: ${pin.created_at}`,
    `  Dominant Color: ${pin.dominant_color ?? "unknown"}`,
  ];

  if (pin.media) {
    lines.push(`  Media Type: ${pin.media.media_type}`);
    if (pin.media.images) {
      lines.push(`  Image URLs:`);
      for (const [size, img] of Object.entries(pin.media.images)) {
        if (img) {
          lines.push(`    ${size}: ${img.url} (${img.width}x${img.height})`);
        }
      }
    }
  }

  return lines.join("\n");
}

export function registerPinTools(server: McpServer, scopes: Set<string>): void {
  const canRead = scopes.has("pins:read") || scopes.has("pins:read_secret");
  const canWrite = scopes.has("pins:write") || scopes.has("pins:write_secret");

  // --- list_pins ---
  if (canRead) {
    server.tool(
      "list_pins",
      "List pins on a board or board section.",
      {
        board_id: z.string().describe("Board ID"),
        section_id: z.string().optional().describe("Section ID (omit for all board pins)"),
        page_size: z.number().min(1).max(100).optional().describe("Items per page (1-100, default 25)"),
        bookmark: z.string().optional().describe("Pagination cursor from previous response"),
      },
      async ({ board_id, section_id, page_size, bookmark }) => {
        try {
          const result = section_id
            ? await listSectionPins(board_id, section_id, page_size, bookmark)
            : await listBoardPins(board_id, page_size, bookmark);

          if (result.items.length === 0) {
            return { content: [{ type: "text" as const, text: "No pins found." }] };
          }

          const lines = result.items.map(formatPinSummary);
          if (result.bookmark) lines.push(`\n--- More results. bookmark: "${result.bookmark}" ---`);

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error listing pins: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- get_pin ---
  if (canRead) {
    server.tool(
      "get_pin",
      "Get full details of a specific pin including image URLs.",
      {
        pin_id: z.string().describe("Pin ID"),
      },
      async ({ pin_id }) => {
        try {
          const pin = await getPin(pin_id);
          return { content: [{ type: "text" as const, text: formatPinDetails(pin) }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error getting pin: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- get_pin_image ---
  if (canRead) {
    server.tool(
      "get_pin_image",
      "Fetch a pin's image so it can be analyzed visually. Returns the image as viewable content.",
      {
        pin_id: z.string().describe("Pin ID"),
        size: z
          .enum(["150x150", "400x300", "600x", "1200x", "originals"])
          .optional()
          .describe("Image size variant (default: 600x)"),
      },
      async ({ pin_id, size }) => {
        try {
          const selectedSize: ImageSizeKey = (size as ImageSizeKey) ?? "600x";
          const pin = await getPin(pin_id);

          if (!pin.media?.images) {
            return { content: [{ type: "text" as const, text: "This pin has no image media." }], isError: true };
          }

          const imageInfo = pin.media.images[selectedSize] ?? pin.media.images["600x"] ?? pin.media.images.originals;
          if (!imageInfo) {
            return {
              content: [{ type: "text" as const, text: `No image available in size "${selectedSize}". Available: ${Object.keys(pin.media.images).join(", ")}` }],
              isError: true,
            };
          }

          const { data, mimeType } = await fetchImageAsBase64(imageInfo.url);

          return {
            content: [
              { type: "image" as const, data, mimeType },
              {
                type: "text" as const,
                text: [
                  `Pin: ${pin.title ?? "(no title)"} [${pin.id}]`,
                  `Description: ${pin.description ?? "(none)"}`,
                  `Alt text: ${pin.alt_text ?? "(none)"}`,
                  `Board ID: ${pin.board_id}`,
                  `Section ID: ${pin.board_section_id ?? "(none)"}`,
                  `Link: ${pin.link ?? "(none)"}`,
                  `Image size: ${imageInfo.width}x${imageInfo.height}`,
                  `Type: ${pin.creative_type ?? "unknown"}`,
                ].join("\n"),
              },
            ],
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error fetching pin image: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- update_pin ---
  if (canWrite) {
    server.tool(
      "update_pin",
      "Update a pin's title, description, alt text, link, or board placement.",
      {
        pin_id: z.string().describe("Pin ID"),
        title: z.string().max(100).optional().describe("New title (max 100 chars)"),
        description: z.string().max(800).optional().describe("New description (max 800 chars)"),
        alt_text: z.string().max(500).optional().describe("New alt text for accessibility (max 500 chars)"),
        link: z.string().optional().describe("New link URL"),
        board_id: z.string().optional().describe("Move to different board"),
        board_section_id: z.string().optional().describe("Move to different section"),
      },
      async ({ pin_id, title, description, alt_text, link, board_id, board_section_id }) => {
        try {
          const update: Record<string, string> = {};
          if (title !== undefined) update.title = title;
          if (description !== undefined) update.description = description;
          if (alt_text !== undefined) update.alt_text = alt_text;
          if (link !== undefined) update.link = link;
          if (board_id !== undefined) update.board_id = board_id;
          if (board_section_id !== undefined) update.board_section_id = board_section_id;

          if (Object.keys(update).length === 0) {
            return { content: [{ type: "text" as const, text: "No fields provided to update." }], isError: true };
          }

          const pin = await updatePin(pin_id, update);
          return { content: [{ type: "text" as const, text: `Pin updated successfully:\n${formatPinDetails(pin)}` }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error updating pin: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- move_pin ---
  if (canWrite) {
    server.tool(
      "move_pin",
      "Move a pin to a different board and/or section.",
      {
        pin_id: z.string().describe("Pin ID"),
        board_id: z.string().describe("Target board ID"),
        section_id: z.string().optional().describe("Target section ID within the board"),
      },
      async ({ pin_id, board_id, section_id }) => {
        try {
          const update: Record<string, string> = { board_id };
          if (section_id) update.board_section_id = section_id;

          const pin = await updatePin(pin_id, update);
          return {
            content: [{ type: "text" as const, text: `Pin moved to board ${pin.board_id}${pin.board_section_id ? ` / section ${pin.board_section_id}` : ""}.` }],
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error moving pin: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- delete_pin ---
  if (canWrite) {
    server.tool(
      "delete_pin",
      "Permanently delete a pin.",
      {
        pin_id: z.string().describe("Pin ID to delete"),
      },
      async ({ pin_id }) => {
        try {
          await deletePin(pin_id);
          return { content: [{ type: "text" as const, text: `Pin ${pin_id} deleted successfully.` }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error deleting pin: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- save_pin ---
  if (canWrite) {
    server.tool(
      "save_pin",
      "Save an existing pin to one of your boards.",
      {
        pin_id: z.string().describe("Pin ID to save"),
        board_id: z.string().describe("Target board ID"),
        board_section_id: z.string().optional().describe("Target section ID (optional)"),
      },
      async ({ pin_id, board_id, board_section_id }) => {
        try {
          const pin = await savePin(pin_id, board_id, board_section_id);
          return { content: [{ type: "text" as const, text: `Pin saved successfully:\n${formatPinDetails(pin)}` }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error saving pin: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- create_pin ---
  if (canWrite) {
    server.tool(
      "create_pin",
      "Create a new pin from an image URL.",
      {
        board_id: z.string().describe("Board ID to pin to"),
        image_url: z.string().describe("Source image URL"),
        title: z.string().max(100).optional().describe("Pin title (max 100 chars)"),
        description: z.string().max(800).optional().describe("Pin description (max 800 chars)"),
        alt_text: z.string().max(500).optional().describe("Alt text for accessibility (max 500 chars)"),
        link: z.string().optional().describe("Destination link URL"),
        board_section_id: z.string().optional().describe("Board section ID"),
      },
      async ({ board_id, image_url, title, description, alt_text, link, board_section_id }) => {
        try {
          const data: Record<string, unknown> = {
            board_id,
            media_source: { source_type: "image_url", url: image_url },
          };
          if (title) data.title = title;
          if (description) data.description = description;
          if (alt_text) data.alt_text = alt_text;
          if (link) data.link = link;
          if (board_section_id) data.board_section_id = board_section_id;

          const pin = await createPin(data as any);
          return { content: [{ type: "text" as const, text: `Pin created successfully:\n${formatPinDetails(pin)}` }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error creating pin: ${msg}` }], isError: true };
        }
      },
    );
  }

  // --- get_pin_analytics ---
  if (canRead) {
    server.tool(
      "get_pin_analytics",
      "Get analytics for a pin (impressions, clicks, saves, etc.).",
      {
        pin_id: z.string().describe("Pin ID"),
        start_date: z.string().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().describe("End date (YYYY-MM-DD)"),
        metric_types: z
          .array(z.enum(["IMPRESSION", "ENGAGEMENTS", "CLICK_THROUGH", "SAVE", "VIDEO_START", "VIDEO_10S_VIEW", "VIDEO_MRC_VIEW"]))
          .optional()
          .describe("Metrics to retrieve (default: all basic metrics)"),
      },
      async ({ pin_id, start_date, end_date, metric_types }) => {
        try {
          const metrics = metric_types ?? ["IMPRESSION", "ENGAGEMENTS", "CLICK_THROUGH", "SAVE"];
          const data = await getPinAnalytics(pin_id, start_date, end_date, metrics);

          const lines: string[] = [`Pin Analytics [${pin_id}] — ${start_date} to ${end_date}:`];

          for (const [metric, value] of Object.entries(data)) {
            lines.push(`\n${metric}:`);
            if (value.summary_metrics && Object.keys(value.summary_metrics).length > 0) {
              lines.push(`  Summary:`);
              for (const [k, v] of Object.entries(value.summary_metrics)) {
                lines.push(`    ${k}: ${v}`);
              }
            }
          }

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          return { content: [{ type: "text" as const, text: `Error getting pin analytics: ${msg}` }], isError: true };
        }
      },
    );
  }
}
