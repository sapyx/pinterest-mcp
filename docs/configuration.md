# Configuration

---

## Environment Variables

Copy `.env.example` to `.env` and fill in one of the two authentication options.

```env
# Option A — Direct access token (read-only)
PINTEREST_ACCESS_TOKEN=pina_...

# Option B — OAuth credentials (full read + write)
# PINTEREST_APP_ID=your_app_id
# PINTEREST_APP_SECRET=your_app_secret
```

Both options cannot coexist: if `PINTEREST_ACCESS_TOKEN` is present it takes priority and OAuth credentials are ignored.

The server exits immediately at startup with a formatted error if neither option is configured.

---

## MCP Client Configuration

### Claude Desktop

Add the following block to your Claude Desktop config (usually `~/.config/claude/claude_desktop_config.json` on Linux/macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "pinterest": {
      "command": "node",
      "args": ["/absolute/path/to/pinterest-mcp/build/index.js"],
      "env": {
        "PINTEREST_ACCESS_TOKEN": "pina_..."
      }
    }
  }
}
```

For OAuth mode, replace the `env` block with:

```json
"env": {
  "PINTEREST_APP_ID": "your_app_id",
  "PINTEREST_APP_SECRET": "your_app_secret"
}
```

### Generic MCP Client (`.mcp.json`)

The repository includes a `.mcp.json` file for local development use:

```json
{
  "mcpServers": {
    "pinterest": {
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "PINTEREST_ACCESS_TOKEN": "pina_..."
      }
    }
  }
}
```

---

## Pinterest App Setup

To obtain credentials, create an app at [developers.pinterest.com](https://developers.pinterest.com/):

1. Go to **My Apps** → **Create App**.
2. Add the redirect URI: `http://localhost:3333/callback`.
3. Request the required scopes:
   - `boards:read`, `boards:write`
   - `pins:read`, `pins:write`
   - `user_accounts:read`
4. Copy **App ID** and **App Secret** into your `.env`.

For a direct access token, go to **App** → **Generate Access Token** and copy the value.

---

## Build

```bash
npm install
npm run build     # compiles TypeScript → build/
```

For development with live recompilation:

```bash
npm run dev
```

To run the server manually:

```bash
npm start
# or
node build/index.js
```

The server communicates exclusively over **STDIO** — it does not bind to any port during normal operation (port 3333 is used only transiently during the OAuth callback).
