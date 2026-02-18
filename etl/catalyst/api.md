# CatalystExplorer API v1

Source: https://www.catalystexplorer.com/docs
OpenAPI: https://www.catalystexplorer.com/docs/openapi.yaml
Postman: https://www.catalystexplorer.com/docs/collection.json

Base URL: `https://www.catalystexplorer.com/api/v1`

## Authentication
Most endpoints are publicly accessible without authentication.

## Pagination
All list endpoints return paginated results with `data`, `links`, and `meta` objects.
- `page` (integer, default 1)
- `per_page` (integer, default 24, max 60)

## Proposals

### List Proposals
- `GET /proposals`
  - Query params:
    - `page`, `per_page` — pagination
    - `filter[id]` — exact proposal ID
    - `filter[title]` — search by title (case insensitive)
    - `filter[status]` — `funded`, `unfunded`, `complete`, `over_budget`
    - `filter[fund]` — filter by fund ID
    - `filter[budget_from]` — minimum requested amount (lovelace)
    - `include` — `campaign`, `user`, `fund`, `team`, `schedule`, `reviews`
    - `sort` — `title`, `status`, `amount_requested`, `funded_at`, `created_at` (prefix `-` for desc)
  - Response fields: `id`, `title` (localized), `status`, `type`, `category`, `amount_requested`, `amount_received`, `funded_at`, `yes_votes_count`, `no_votes_count`, `created_at`, `updated_at`

### Get Proposal Details
- `GET /proposals/{id}`
  - Query params:
    - `include` — `campaign`, `user`, `fund`, `team`, `schedule`, `links`, `reviews`
  - Additional fields: `description`, `reviews_count`
  - Team members: `id`, `name`, `role`

## Funds

### List Funds
- `GET /funds`
  - Query params:
    - `page`, `per_page` — pagination
    - `filter[status]` — `upcoming`, `active`, `completed`, `cancelled`
    - `filter[title]` — search by title
    - `include` — `campaigns`, `proposals`, `parent`, `children`
    - `sort` — `title`, `amount`, `status`, `launched_at`, `created_at`
  - Response fields: `id`, `title`, `status`, `amount`, `launch_date`, `proposals_count`, `funded_proposals_count`, `total_amount_awarded`

### Get Fund Details
- `GET /funds/{id}`
  - Query params:
    - `include` — `campaigns`, `proposals`, `parent`, `children`, `statistics`
  - Additional fields: `voting_power_threshold`, `description`
  - Statistics include: `total_voters`, `total_voting_power`, `participation_rate`, `average_proposal_amount`, `success_rate`

### Get Fund Campaigns
- `GET /funds/{id}/campaigns`
  - Query params:
    - `page`
    - `include` — `proposals`, `fund`
  - Response fields per campaign: `id`, `title`, `budget`, `proposals_count`, `funded_proposals_count`, `total_amount_awarded`

## Communities

### List Communities
- `GET /communities`
  - Query params:
    - `page`, `per_page` — pagination
    - `filter[name]` — search by name
    - `filter[verified]` — filter by verified status
    - `include` — `users`, `proposals`, `links`
    - `sort` — `name`, `members_count`, `proposals_count`, `created_at`
  - Response fields: `id`, `name`, `slug`, `verified`, `description`, `website`, `members_count`, `proposals_count`

### Get Community Details
- `GET /communities/{id}`
  - Query params:
    - `include` — `users`, `proposals`, `links`, `statistics`
  - Additional fields: `twitter_handle`, `discord_url`, `total_funding_received`
  - Users: `id`, `name`, `username`, `role`, `bio`, `joined_at`
  - Statistics: `active_members`, `funded_projects`, `success_rate`, `average_proposal_amount`, `total_ada_distributed`

### Get Community Proposals
- `GET /communities/{id}/proposals`
  - Query params:
    - `page`
    - `filter[status]` — filter by status
    - `include` — `campaign`, `fund`

## Notes
- Rate limits apply; handle 429 responses with exponential backoff.
- Treat all responses as source data; store provenance per invariant.
- The old LIDO Nation API (lidonation.com/api/catalyst-explorer) is deprecated; use this API instead.
