import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Any, Dict, Iterable, List, Optional, Tuple

NAME_SPLIT_REGEX = re.compile(r"\s*(?:,|/|\band\b|&|\+|\||;)\s*", re.IGNORECASE)


def normalize_name(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", name.strip())
    cleaned = re.sub(r"[^a-zA-Z0-9\s\-']", "", cleaned)
    return cleaned.lower()


def split_names(raw: str) -> List[str]:
    parts = [part.strip() for part in NAME_SPLIT_REGEX.split(raw) if part.strip()]
    return parts


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


@dataclass
class PersonRecord:
    canonical_name: str
    aliases: List[str] = field(default_factory=list)
    confidence: float = 1.0


@dataclass
class OrganizationRecord:
    name: str
    confidence: float = 1.0


def extract_people_from_proposal(proposal: Dict[str, Any]) -> List[str]:
    candidates: List[str] = []
    for key in ("ideascale_user", "proposer", "proposer_name", "proposer_full_name"):
        value = proposal.get(key)
        if isinstance(value, str) and value.strip():
            candidates.extend(split_names(value))
    return list({name for name in candidates if name})


def extract_orgs_from_proposal(proposal: Dict[str, Any]) -> List[str]:
    orgs: List[str] = []
    for key in ("organization", "company", "team"):
        value = proposal.get(key)
        if isinstance(value, str) and value.strip():
            orgs.extend(split_names(value))
    return list({org for org in orgs if org})


def resolve_people(
    proposals: Iterable[Dict[str, Any]],
    threshold: float = 0.86,
) -> List[PersonRecord]:
    people: List[PersonRecord] = []
    for proposal in proposals:
        for name in extract_people_from_proposal(proposal):
            normalized = normalize_name(name)
            matched = False
            for person in people:
                canonical_norm = normalize_name(person.canonical_name)
                score = similarity(normalized, canonical_norm)
                if score >= threshold:
                    if name not in person.aliases and name != person.canonical_name:
                        person.aliases.append(name)
                    person.confidence = max(person.confidence, score)
                    matched = True
                    break
            if not matched:
                people.append(PersonRecord(canonical_name=name, aliases=[], confidence=1.0))
    return people


def resolve_organizations(
    proposals: Iterable[Dict[str, Any]],
    threshold: float = 0.9,
) -> List[OrganizationRecord]:
    orgs: List[OrganizationRecord] = []
    for proposal in proposals:
        for org in extract_orgs_from_proposal(proposal):
            normalized = normalize_name(org)
            matched = False
            for record in orgs:
                canonical_norm = normalize_name(record.name)
                score = similarity(normalized, canonical_norm)
                if score >= threshold:
                    record.confidence = max(record.confidence, score)
                    matched = True
                    break
            if not matched:
                orgs.append(OrganizationRecord(name=org, confidence=1.0))
    return orgs


def build_identity_index(
    proposals: Iterable[Dict[str, Any]],
) -> Tuple[List[PersonRecord], List[OrganizationRecord]]:
    proposals_list = list(proposals)
    return resolve_people(proposals_list), resolve_organizations(proposals_list)


def summarize_identities(
    people: List[PersonRecord],
    organizations: List[OrganizationRecord],
) -> Dict[str, Any]:
    return {
        "people": [
            {
                "canonical_name": person.canonical_name,
                "aliases": person.aliases,
                "confidence": round(person.confidence, 2),
            }
            for person in people
        ],
        "organizations": [
            {
                "name": org.name,
                "confidence": round(org.confidence, 2),
            }
            for org in organizations
        ],
    }
