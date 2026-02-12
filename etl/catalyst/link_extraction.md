# Link Extraction

This module extracts and normalizes external links from Catalyst proposal content.

## What it does

- Scans proposal text fields for URLs.
- Normalizes URLs (removes query string + fragment).
- Classifies link types (GitHub, YouTube, social, blog, website).
- Deduplicates links per proposal.

## Fields Scanned

- `summary`
- `solution`
- `problem`
- `experience`
- `website`
- `link`
- `ideascale_link`
- `embedded_uris` (array)

## Usage

```python
from catalyst.link_extraction import extract_links_batch

links_by_proposal = extract_links_batch(proposals)
```
