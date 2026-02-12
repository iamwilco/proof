# Identity Resolution

This module builds a deterministic identity index from Catalyst proposal records.

## What it does

- Extracts proposer/person names from proposal fields.
- Splits multi-name strings (e.g., "Alice / Bob", "Alice & Bob").
- Normalizes names and performs fuzzy matching for duplicates.
- Produces a canonical person with aliases and confidence score.
- Extracts organization/team names with similar matching logic.

## Source Fields Used

People (first non-empty match):
- `ideascale_user`
- `proposer`
- `proposer_name`
- `proposer_full_name`

Organizations (first non-empty match):
- `organization`
- `company`
- `team`

## Usage

```python
from catalyst.identity_resolution import build_identity_index, summarize_identities

people, organizations = build_identity_index(proposals)
summary = summarize_identities(people, organizations)
```

## Tuning

- `resolve_people(threshold=0.86)`
- `resolve_organizations(threshold=0.90)`

Adjust thresholds to trade off between false merges and duplicates.
