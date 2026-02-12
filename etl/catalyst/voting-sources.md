# Voting Data Sources (PROOF-042)

## Catalyst Explorer (Lido Nation)

Source docs: https://www.lidonation.com/docs?api-docs.json

Base URL: `https://www.lidonation.com/api/catalyst-explorer`

Key endpoints for vote data:
- `GET /proposals` (includes `yes_votes_count`, `no_votes_count` in payload)
  - Example from ingestion script: `https://www.catalystexplorer.com/api/v1/proposals?per_page=60&page=1&include=campaign,fund,team`
- `GET /proposals/{proposal_id}`

Sample fields captured in ingestion:
```json
{
  "id": "<proposal_id>",
  "yes_votes_count": 12345,
  "no_votes_count": 678,
  "fund": { "id": "<fund_id>", "title": "Fund 12" },
  "campaign": { "id": "<challenge_id>", "title": "Challenge Name" }
}
```

Notes:
- The OpenAPI schema lists funds, challenges, proposals, etc. under `components.schemas`.
- Use `sourceType: catalyst_explorer` and the proposal link as provenance.
- Gaps: Catalyst Explorer does not expose abstain vote totals or unique wallet counts in the proposal payload.

## Jörmungandr (Vote Plans / Tally)

Reference: https://raw.githubusercontent.com/input-output-hk/jormungandr/master/doc/jcli/rest.md

Endpoints via `jcli rest v0`:
- `jcli rest v0 vote active plans get -h <node_addr>`
  - Returns active vote plan IDs and proposal `external_id` plus vote window epochs.
  - Sample response (YAML):
```yaml
---
- committee_end:
    epoch: 10
    slot_id: 0
  proposals:
    - external_id: adb92757155d09e7f92c9f100866a92dddd35abd2a789a44ae19ab9a1dbc3280
      options:
        OneOf:
          max_value: 3
  vote_end:
    epoch: 5
    slot_id: 0
  vote_start:
    epoch: 1
    slot_id: 0
```

- `jcli rest v0 vote active committees get -h <node_addr>`
  - Returns committee public keys used for tally.
  - Sample response (YAML):
```yaml
---
- 7ef044ba437057d6d944ace679b7f811335639a689064cd969dffc8b55a7cc19
- f5285eeead8b5885a1420800de14b0d1960db1a990a6c2f7b517125bedc000db
```

Notes:
- Jörmungandr vote plans provide the vote plan/proposal IDs; tallies are produced by the tally process (often via `jcli` in Catalyst infrastructure).
- Archive node endpoints are required to access historical vote plans and tallies; endpoint URLs are not yet publicly documented.
- Gaps: No public tally API found; need Catalyst infra or archived tally exports for yes/no/abstain totals.
