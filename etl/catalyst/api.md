# Catalyst Explorer API (LIDO Nation)

Source: https://www.lidonation.com/catalyst-explorer/api#/
OpenAPI: https://www.lidonation.com/docs?api-docs.json

Base URL (relative): `/api/catalyst-explorer`

## Endpoints

### Ledger Snapshots
- `GET /ledger-snapshots`
  - Returns a list of ledger snapshots.
- `GET /ledger-snapshots/{snapshot_id}`
  - Returns a single ledger snapshot by ID.

### Funds
- `GET /funds`
  - Returns all funds.
- `GET /funds/{fund_id}`
  - Returns a single fund by ID.

### Challenges
- `GET /challenges`
  - Query params: `fund_id` (integer, optional)
  - Returns challenges (fund-specific when filtered).
- `GET /challenges/{challenge_id}`
  - Returns a single challenge by ID.

### Groups
- `GET /groups`
  - Returns all groups.
- `GET /groups/{group_id}`
  - Returns a single group by ID.

### People
- `GET /people`
  - Query params: `ideascale_username` (string, optional)
  - Returns all people (optionally filtered).
- `GET /people/{person_id}`
  - Returns a single person by ID.

### Proposals
- `GET /proposals`
  - Query params:
    - `user_id` (integer, optional)
    - `challenge_id` (integer, optional)
    - `fund_id` (integer, optional)
    - `search` (string, optional; filters by title)
    - `per_page` (integer, optional, default 24, min 1, max 60)
    - `page` (integer, optional, default 1)
  - Returns proposals with filtering + pagination.
- `GET /proposals/{proposal_id}`
  - Returns a single proposal by ID.

### Tags
- `GET /tags`
  - Returns a list of tags.
- `GET /tags/{tag}`
  - Returns a single tag by title.

## Notes
- This API is served by LIDO Nation and may be rate-limited.
- Treat all responses as source data; store provenance per invariant.
- The OpenAPI schema includes response shapes under `components.schemas` (e.g., `proposal`).
