# MCP Tools Reference

The server exposes **14 tools** grouped into four categories. Parameters marked with `*` are required.

---

## Auth

### `pinterest_auth`

Starts the Pinterest OAuth 2.0 flow. Opens the browser and waits up to 2 minutes for authorisation. Only available in OAuth mode (requires `PINTEREST_APP_ID` + `PINTEREST_APP_SECRET`).

**Parameters:** none

---

### `pinterest_auth_status`

Returns the current authentication state: token validity, expiry dates, and granted scopes.

**Parameters:** none

---

## Boards

### `list_boards`

Lists all boards belonging to the authenticated user.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page_size` | `number` (1–100) | 25 | Items per page |
| `bookmark` | `string` | — | Pagination cursor from a previous response |

**Output example:**
```
[123456789] Travel (PUBLIC) — 42 pins
[987654321] Recipes (SECRET) — 7 pins

--- More results available. Use bookmark: "abc123..." ---
```

---

### `create_board`

Creates a new Pinterest board.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` * | `string` | — | Board name |
| `description` | `string` | — | Board description |
| `privacy` | `"PUBLIC"` \| `"SECRET"` | `PUBLIC` | Visibility |

---

### `list_board_sections`

Lists all sections within a board.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `board_id` * | `string` | — | Target board ID |
| `page_size` | `number` (1–100) | 25 | Items per page |
| `bookmark` | `string` | — | Pagination cursor |

---

### `create_board_section`

Creates a new section inside an existing board.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `board_id` * | `string` | — | Target board ID |
| `name` * | `string` | — | Section name |

---

## Pins

### `list_pins`

Lists pins on a board, or on a specific section within a board.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `board_id` * | `string` | — | Board ID |
| `section_id` | `string` | — | Omit to list all board pins |
| `page_size` | `number` (1–100) | 25 | Items per page |
| `bookmark` | `string` | — | Pagination cursor |

---

### `get_pin`

Returns full details for a single pin including all available image URLs.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pin_id` * | `string` | Pin ID |

**Output includes:** title, description, alt text, link, board/section IDs, creative type, dominant color, and all image size URLs.

---

### `get_pin_image`

Fetches a pin's image and returns it as a base64 image content block, making it directly viewable and analysable by Claude.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pin_id` * | `string` | — | Pin ID |
| `size` | `"150x150"` \| `"400x300"` \| `"600x"` \| `"1200x"` \| `"originals"` | `600x` | Image size variant |

---

### `update_pin`

Updates one or more fields on an existing pin. At least one optional field must be provided.

| Parameter | Type | Limit | Description |
|-----------|------|-------|-------------|
| `pin_id` * | `string` | — | Pin ID |
| `title` | `string` | 100 chars | New title |
| `description` | `string` | 800 chars | New description |
| `alt_text` | `string` | 500 chars | Accessibility text |
| `link` | `string` | — | Destination URL |
| `board_id` | `string` | — | Move to a different board |
| `board_section_id` | `string` | — | Move to a different section |

---

### `move_pin`

Moves a pin to a different board and/or section. Shorthand for `update_pin` with board targeting.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pin_id` * | `string` | Pin ID |
| `board_id` * | `string` | Target board ID |
| `section_id` | `string` | Target section ID (optional) |

---

### `create_pin`

Creates a new pin from a public image URL.

| Parameter | Type | Limit | Description |
|-----------|------|-------|-------------|
| `board_id` * | `string` | — | Target board ID |
| `image_url` * | `string` | — | Publicly accessible image URL |
| `title` | `string` | 100 chars | Pin title |
| `description` | `string` | 800 chars | Pin description |
| `alt_text` | `string` | 500 chars | Accessibility text |
| `link` | `string` | — | Destination URL |
| `board_section_id` | `string` | — | Target section ID |

---

## Search & User

### `search_pins`

Searches the authenticated user's pins by keyword.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` * | `string` | Search query |
| `bookmark` | `string` | Pagination cursor |

---

### `get_user_profile`

Returns profile information for the currently authenticated user.

**Parameters:** none

**Output example:**
```
Pinterest User Profile:
  Username:   john_doe
  Account Type: business
  Boards:     24
  Pins:       1432
  Followers:  980
  Following:  310
  Website:    https://johndoe.com
```

---

## Access Mode Summary

| Tool | Direct Token | OAuth |
|------|:---:|:---:|
| `pinterest_auth` | — | write |
| `pinterest_auth_status` | read | read |
| `list_boards` | read | read |
| `create_board` | — | write |
| `list_board_sections` | read | read |
| `create_board_section` | — | write |
| `list_pins` | read | read |
| `get_pin` | read | read |
| `get_pin_image` | read | read |
| `update_pin` | — | write |
| `move_pin` | — | write |
| `create_pin` | — | write |
| `search_pins` | read | read |
| `get_user_profile` | read | read |
