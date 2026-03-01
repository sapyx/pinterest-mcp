# Pinterest API v5 — Full Reference

> Source: developers.pinterest.com — March 2026

---

## Endpoints

### Pins

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| POST | `/pins` | Create pin | `pins:write` |
| GET | `/pins` | List pins | `pins:read` |
| GET | `/pins/{pin_id}` | Get pin | `pins:read` |
| PATCH | `/pins/{pin_id}` | Update pin (Beta) | `pins:write` |
| DELETE | `/pins/{pin_id}` | Delete pin | `pins:write` |
| POST | `/pins/{pin_id}/save` | Save pin to board | `pins:write` |
| GET | `/pins/{pin_id}/analytics` | Get pin analytics | `pins:read` |
| GET | `/pins/analytics` | Get multiple pins analytics (max 100, Beta) | `pins:read` |

### Boards

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| POST | `/boards` | Create board | `boards:write` |
| GET | `/boards` | List boards | `boards:read` |
| GET | `/boards/{board_id}` | Get board | `boards:read` |
| PATCH | `/boards/{board_id}` | Update board | `boards:write` |
| DELETE | `/boards/{board_id}` | Delete board | `boards:write` |
| GET | `/boards/{board_id}/pins` | List pins on board | `pins:read` |

### Board Sections

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| GET | `/boards/{board_id}/sections` | List board sections | `boards:read` |
| POST | `/boards/{board_id}/sections` | Create board section | `boards:write` |
| PATCH | `/boards/{board_id}/sections/{section_id}` | Update board section | `boards:write` |
| DELETE | `/boards/{board_id}/sections/{section_id}` | Delete board section | `boards:write` |
| GET | `/boards/{board_id}/sections/{section_id}/pins` | List pins in section | `pins:read` |

### Media

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| POST | `/media` | Register media upload (for direct file upload) | `pins:write` |
| GET | `/media` | List media uploads | `pins:read` |
| GET | `/media/{media_id}` | Get media upload details | `pins:read` |

### User Account

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| GET | `/user_account` | Get user account info | `user_accounts:read` |
| GET | `/user_account/analytics` | Get user analytics | `user_accounts:read` |
| GET | `/user_account/analytics/top_pins` | Get top pins (max 50) | `user_accounts:read` |
| GET | `/user_account/analytics/top_video_pins` | Get top video pins (max 50) | `user_accounts:read` |
| GET | `/user_account/businesses` | List linked business accounts | `user_accounts:read` |
| GET | `/user_account/followers` | List followers | `user_accounts:read` |
| GET | `/user_account/following` | List following | `user_accounts:read` |
| GET | `/user_account/followed_interests` | List followed interests | `user_accounts:read` |
| GET | `/user_account/websites` | Get user websites | `user_accounts:read` |

### Search

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| GET | `/search/pins` | Search pins | `pins:read` |
| GET | `/search/boards` | Search boards | `boards:read` |

### Ad Accounts (production only)

| Method | Path | Description | Scopes |
|--------|------|-------------|--------|
| GET | `/ad_accounts` | List ad accounts | `ads:read` |
| GET | `/ad_accounts/{id}` | Get ad account | `ads:read` |
| GET | `/ad_accounts/{id}/analytics` | Get ad account analytics | `ads:read` |
| POST | `/ad_accounts/{id}/reports` | Create analytics report | `ads:read` |

---

## OAuth 2.0 Scopes

| Scope | Access | Description |
|-------|--------|-------------|
| `pins:read` | read | See public pins |
| `pins:read_secret` | read | See secret pins |
| `pins:write` | write | Create, update, delete public pins |
| `pins:write_secret` | write | Create, update, delete secret pins |
| `boards:read` | read | See public boards |
| `boards:read_secret` | read | See secret boards |
| `boards:write` | write | Create, update, delete public boards |
| `boards:write_secret` | write | Create, update, delete secret boards |
| `user_accounts:read` | read | See user account info and analytics |
| `user_accounts:write` | write | Update user account info |
| `ads:read` | read | See ads data |
| `ads:write` | write | Manage ads |
| `catalogs:read` | read | See catalog data |
| `catalogs:write` | write | Manage catalogs |

---

## Trial vs Production Access

| Feature | Trial | Production |
|---------|-------|------------|
| Your own pins/boards | ✓ | ✓ |
| Secret pins/boards | ✓ | ✓ |
| Analytics (own account) | ✓ | ✓ |
| Other users' data | — | ✓ |
| Ad account management | — | ✓ |
| Higher rate limits | — | ✓ |
| Webhooks | — | ✓ |

---

## Rate Limits

- **MMM Reports**: max 5 requests/min per advertiser
- **Analytics**: max 90-day range per request
  - Hourly granularity: max 8-day lookback
  - Daily/Weekly/Monthly: max 90-day lookback
- General rate limits: not publicly documented; trial tier is more restricted

---

## Analytics Metrics

### Pin / User metrics
`IMPRESSION`, `ENGAGEMENTS`, `ENGAGEMENT_RATE`, `CLOSEUP`, `CLOSEUP_RATE`,
`CLICK_THROUGH`, `CLICK_THROUGH_RATE`, `SAVE`, `SAVE_RATE`, `TOTAL_COMMENTS`,
`VIDEO_START`, `VIDEO_10S_VIEW`, `VIDEO_MRC_VIEW`, `VIDEO_AVG_WATCH_TIME`,
`VIDEO_V50_WATCH_TIME`

### Demographic segments
`AGE`, `GENDER`, `LOCATION`, `HOUSEHOLD_INCOME`, `INTEREST`

---

## Pin Creative Types

`CAROUSEL`, `COLLAGE`, `COLLECTION`, `IDEA`, `MAX_VIDEO`,
`REGULAR`, `SHOPPING`, `SHOWCASE`, `VIDEO`, `IMAGE`

---

## Media Upload (direct file)

1. `POST /media` → returns `media_id` + upload URL (S3)
2. Upload file directly to S3 URL
3. Use `media_id` in `POST /pins` as `media_source.source_type: "video_id"` or `"image_id"`

---

## Pagination

All list endpoints use **bookmark-based pagination**:
- Pass `bookmark` from previous response to get next page
- `bookmark: null` means last page
- `page_size`: max 250 for most endpoints

---

## Board Privacy Levels

| Value | Description |
|-------|-------------|
| `PUBLIC` | Visible to everyone |
| `PROTECTED` | Visible to followers only |
| `SECRET` | Visible only to owner |
