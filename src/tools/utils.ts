// ============================================================
// Tool Utilities — shared helpers for MCP tool handlers
// ============================================================

import { AuthRequiredError } from "../auth.js";

const AUTH_REQUIRED_MESSAGE = `
⚠️  Authentication required.

Run the pinterest_auth tool to connect your Pinterest account.
`.trim();

/**
 * Wraps a tool handler to catch AuthRequiredError and return a
 * clear, actionable message instead of a raw error.
 */
export function handleToolError(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  if (error instanceof AuthRequiredError) {
    return {
      content: [{ type: "text" as const, text: AUTH_REQUIRED_MESSAGE }],
      isError: true,
    };
  }
  const msg = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: msg }],
    isError: true,
  };
}
