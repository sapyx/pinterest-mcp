# API Client (`src/api.ts`)

The API client centralises all HTTP communication with the Pinterest REST API v5. It is not a public interface — all access goes through the MCP tools.

**Base URL:** `https://api.pinterest.com/v5`

---

## Core Helpers

### `pinterestRequest<T>(method, path, body?, queryParams?)`

Low-level HTTP helper used by all endpoint functions.

- Calls `getValidAccessToken()` on every request (triggers refresh if needed).
- Sets `Authorization: Bearer <token>` and `Content-Type: application/json`.
- Appends `queryParams` to the URL, skipping `undefined` and empty strings.
- On non-2xx responses, parses the Pinterest error body and throws:
  ```
  Pinterest API error 403: Not authorized (code: 4)
  ```
- Logs `[api] METHOD /path?query` to stderr.

---

### `paginatedRequest<T>(path, queryParams?, pageSize?, bookmark?)`

Wraps `pinterestRequest` for paginated endpoints.

- Merges `page_size` and `bookmark` into query params when provided.
- Returns `PaginatedResponse<T>`:
  ```ts
  { items: T[]; bookmark: string | null }
  ```

---

## Boards

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `listBoards(pageSize?, bookmark?)` | GET | `/boards` | `PaginatedResponse<Board>` |
| `createBoard(name, description?, privacy?)` | POST | `/boards` | `Board` |
| `listBoardSections(boardId, pageSize?, bookmark?)` | GET | `/boards/:id/sections` | `PaginatedResponse<BoardSection>` |
| `createBoardSection(boardId, name)` | POST | `/boards/:id/sections` | `BoardSection` |

---

## Pins

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `listBoardPins(boardId, pageSize?, bookmark?)` | GET | `/boards/:id/pins` | `PaginatedResponse<Pin>` |
| `listSectionPins(boardId, sectionId, pageSize?, bookmark?)` | GET | `/boards/:id/sections/:sid/pins` | `PaginatedResponse<Pin>` |
| `getPin(pinId)` | GET | `/pins/:id` | `Pin` |
| `updatePin(pinId, update)` | PATCH | `/pins/:id` | `Pin` |
| `createPin(data)` | POST | `/pins` | `Pin` |

---

## Search & User

| Function | Method | Endpoint | Returns |
|----------|--------|----------|---------|
| `searchPins(query, bookmark?)` | GET | `/search/pins` | `PaginatedResponse<Pin>` |
| `getUserAccount()` | GET | `/user_account` | `UserAccount` |

---

## Image Fetching

### `fetchImageAsBase64(imageUrl)`

Downloads an image from any public URL (no auth header) and converts it to base64.

- Detects MIME type from the `content-type` response header (falls back to `image/jpeg`).
- Returns `{ data: string; mimeType: string }`.
- Logs download size and MIME type to stderr.
- Used by `get_pin_image` to return an MCP image content block.

---

## Pagination

All list endpoints use **bookmark-based pagination** (not page numbers).

To iterate through results:

1. Call a list function without `bookmark` to get the first page.
2. If the response contains a non-null `bookmark`, pass it in the next call.
3. Repeat until `bookmark` is `null`.

```
list_boards → bookmark: "xyz"
list_boards bookmark="xyz" → bookmark: "abc"
list_boards bookmark="abc" → bookmark: null  ← last page
```
