import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List
from urllib.parse import urlparse, urlunparse

URL_REGEX = re.compile(r"https?://[^\s)\]}>\"']+", re.IGNORECASE)


@dataclass
class LinkRecord:
    url: str
    type: str


def normalize_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    cleaned = parsed._replace(query="", fragment="")
    return urlunparse(cleaned)


def classify_url(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if "github.com" in host:
        return "github_repo"
    if "youtube.com" in host or "youtu.be" in host:
        return "youtube"
    if "twitter.com" in host or "x.com" in host:
        return "social"
    if "medium.com" in host:
        return "blog"
    return "website"


def extract_links(text: str) -> List[LinkRecord]:
    links: List[LinkRecord] = []
    for match in URL_REGEX.findall(text or ""):
        normalized = normalize_url(match)
        links.append(LinkRecord(url=normalized, type=classify_url(normalized)))
    return links


def extract_links_from_proposal(proposal: Dict[str, Any]) -> List[LinkRecord]:
    fields = [
        "summary",
        "solution",
        "problem",
        "experience",
        "website",
        "link",
        "ideascale_link",
    ]
    links: List[LinkRecord] = []
    for field in fields:
        value = proposal.get(field)
        if isinstance(value, str) and value.strip():
            links.extend(extract_links(value))
    embedded = proposal.get("embedded_uris")
    if isinstance(embedded, list):
        for item in embedded:
            if isinstance(item, str) and item.strip():
                normalized = normalize_url(item)
                links.append(LinkRecord(url=normalized, type=classify_url(normalized)))
    deduped = {}
    for link in links:
        deduped[(link.url, link.type)] = link
    return list(deduped.values())


def extract_links_batch(proposals: Iterable[Dict[str, Any]]) -> Dict[int, List[LinkRecord]]:
    output: Dict[int, List[LinkRecord]] = {}
    for proposal in proposals:
        proposal_id = proposal.get("id")
        if proposal_id is None:
            continue
        output[int(proposal_id)] = extract_links_from_proposal(proposal)
    return output
