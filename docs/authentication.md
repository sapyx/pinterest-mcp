# Authentication

Pinterest MCP Server supports two authentication modes. Exactly one must be configured before the server starts.

---

## Mode 1 — Direct Access Token (read-only)

Set a static token obtained from the [Pinterest Developer Portal](https://developers.pinterest.com/).

```env
PINTEREST_ACCESS_TOKEN=pina_...
```

- No browser interaction required
- Token is used as-is; no refresh is attempted
- Assumed scopes: `pins:read`, `boards:read`, `user_accounts:read`
- Write tools (`create_board`, `create_pin`, `update_pin`, `move_pin`, etc.) will fail with a 403

---

## Mode 2 — OAuth 2.0 (full access)

Set your app credentials from the Pinterest Developer Portal.

```env
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_app_secret
```

The server will use OAuth 2.0 Authorization Code flow. Trigger it via the `pinterest_auth` tool.

### Flow

1. The server generates a random `state` token for CSRF protection.
2. An authorisation URL is constructed pointing to `https://www.pinterest.com/oauth/`.
3. Your default browser opens automatically to that URL.
4. A temporary HTTP server listens on `http://localhost:3333/callback` for the redirect.
5. After you approve the app, Pinterest redirects back with a `code` parameter.
6. The server exchanges the code for tokens via `POST https://api.pinterest.com/v5/oauth/token`.
7. Tokens are saved to disk (see [Token Storage](#token-storage)).

The browser must complete the flow within **2 minutes**, after which the callback server closes.

Requested scopes:
```
boards:read  boards:write  pins:read  pins:write  user_accounts:read
```

---

## Token Storage

OAuth tokens are persisted to:

```
~/.mcp-credentials/pinterest-tokens.json
```

The file is created with **`0o600` permissions** (owner read/write only).

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": 1700000000000,
  "refresh_token_expires_at": 1700000000000,
  "scope": "boards:read boards:write pins:read pins:write user_accounts:read"
}
```

Both timestamps are Unix milliseconds.

---

## Automatic Token Refresh

On every API call, `getValidAccessToken()` runs the following logic:

1. If `PINTEREST_ACCESS_TOKEN` is set → use it directly (no refresh).
2. Load tokens from `~/.mcp-credentials/pinterest-tokens.json`.
3. If the access token is still valid (with a 60-second buffer) → return it.
4. If the access token is expired:
   - If no refresh token exists → throw `"Access token expired and no refresh token available"`.
   - If the refresh token is expired → throw `"Refresh token has expired. Re-run pinterest_auth."`.
   - Otherwise → call `POST /oauth/token` with `grant_type=refresh_token`, save the new token, return it.

---

## Checking Status

Use the `pinterest_auth_status` tool at any time to inspect the current state:

```
Pinterest Authentication Status:
  Authenticated:          ✓
  Access Token Valid:     ✓
  Refresh Token Valid:    ✓
  Access Token Expires:   2025-03-01T12:00:00.000Z
  Refresh Token Expires:  2025-08-01T12:00:00.000Z
  Scopes:                 boards:read boards:write pins:read pins:write user_accounts:read
```
