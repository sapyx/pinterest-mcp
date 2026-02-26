# Boards & Pins MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets Claude interact with Pinterest — browsing, creating, and managing boards, pins, sections, and user profiles via the Pinterest API v5.

## Features

- Browse boards and pins with bookmark-based pagination
- Create boards, sections, and pins from image URLs
- Update and move pins across boards and sections
- Search pins by keyword
- View pin images directly inside Claude (base64 image blocks)
- OAuth 2.0 with automatic token refresh, or direct access token

## Requirements

- Node.js >= 20
- A Pinterest account and app (see [Configuration](docs/configuration.md))

## Quick Start

```bash
git clone https://github.com/sapyx/sapyx-mcp.git
cd sapyx-mcp
npm install
npm run build
```

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

Then add the server to your MCP client (see [Configuration](docs/configuration.md)).

## Authentication

Two modes are supported:

| Mode | Env vars | Access |
|------|----------|--------|
| Direct token | `PINTEREST_ACCESS_TOKEN` | Read-only |
| OAuth 2.0 | `PINTEREST_APP_ID` + `PINTEREST_APP_SECRET` | Full read + write |

For OAuth, trigger the flow via the `pinterest_auth` tool. Tokens are stored in `~/.mcp-credentials/pinterest-tokens.json` and refreshed automatically.

Full details: [docs/authentication.md](docs/authentication.md)

## Tools

14 tools across four groups:

| Group | Tools |
|-------|-------|
| **Auth** | `pinterest_auth`, `pinterest_auth_status` |
| **Boards** | `list_boards`, `create_board`, `list_board_sections`, `create_board_section` |
| **Pins** | `list_pins`, `get_pin`, `get_pin_image`, `update_pin`, `move_pin`, `create_pin` |
| **Search** | `search_pins`, `get_user_profile` |

Full reference: [docs/tools.md](docs/tools.md)

## Project Structure

```
src/
  index.ts          # Entry point — env validation, server setup, STDIO transport
  auth.ts           # OAuth 2.0 flow, token storage, refresh logic
  api.ts            # Typed HTTP client wrapping Pinterest API v5
  types.ts          # TypeScript interfaces (Pin, Board, tokens, etc.)
  tools/
    auth.ts         # pinterest_auth, pinterest_auth_status
    boards.ts       # list_boards, create_board, list_board_sections, create_board_section
    pins.ts         # list_pins, get_pin, get_pin_image, update_pin, move_pin, create_pin
    search.ts       # search_pins, get_user_profile
docs/
  authentication.md # OAuth flow, token storage, refresh logic
  tools.md          # Full tool reference with parameters
  api-client.md     # Internal API client documentation
  configuration.md  # Env vars, MCP client setup, Pinterest app setup
```

## Tech Stack

- **Language:** TypeScript (ES2022, Node16 modules)
- **Runtime:** Node.js >= 20
- **MCP Framework:** `@modelcontextprotocol/sdk`
- **Validation:** Zod
- **Transport:** STDIO

## Documentation

- [Authentication](docs/authentication.md)
- [Tools Reference](docs/tools.md)
- [API Client](docs/api-client.md)
- [Configuration](docs/configuration.md)
