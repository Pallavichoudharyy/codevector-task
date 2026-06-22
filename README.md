## What I chose and why
- Node.js + Express: simple and fast for a REST API
- PostgreSQL (Neon): great indexing, tuple comparison for cursor pagination
- Cursor-based pagination on (created_at, id): stable even when new products are inserted

## Why not OFFSET?
OFFSET shifts row positions when new data is inserted. A cursor uses a stable "bookmark"
so users never see duplicates or miss products mid-browse.

## What I'd improve with more time
- Encrypt cursors so users can't tamper with them
- Add search by name
- Cache /categories response
- Add rate limiting

## How I used AI
- Used Claude to understand cursor pagination concepts
- Used it to generate boilerplate for Express/pg setup
- Wrote and verified the cursor encode/decode logic myself
- Caught an issue where the tuple comparison needed explicit type casting (::timestamptz, ::uuid)
