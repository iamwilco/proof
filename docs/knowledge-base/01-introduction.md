# PROOF Knowledge Base - Introduction

> **Public Registry of Outcomes & On-chain Funding** (aka "DOGE View")

---

## Why PROOF Exists

### The Problem

Cardano's Project Catalyst has distributed **$100M+** across 14+ funding rounds to **2,000+ projects**. However:

- **No unified view** of who delivered what, when, and how well
- **Repeat proposers** can secure funding without accountability for past performance
- **Community lacks tools** to track outcomes or identify patterns
- **Successful builders** get no recognition; underperformers face no consequences

### The Solution

PROOF creates a "DOGE View" for Cardano treasury spending:

- **Every dollar tracked** from proposal to milestone to on-chain activity
- **Every proposer scored** based on delivery history
- **Every project connected** to people, organizations, and outcomes
- **Community oversight** through reviews, flags, and concerns

### Why I Built This

1. **Accountability matters**: Public funds deserve public scrutiny
2. **Builders deserve recognition**: Those who deliver should be visible
3. **Voters need data**: Informed decisions require accessible information
4. **Patterns should surface**: Repeat delays and concerning behavior should be flagged
5. **The ecosystem needs trust**: Transparency builds confidence in treasury governance

---

## Vision & Goals

### Vision Statement

> Make Cardano treasury funding outcomes legible, comparable, and socially accountable.

### Primary Goals

| Goal | Description |
|------|-------------|
| **Transparency** | Surface all available data about funded projects and their outcomes |
| **Accountability** | Track proposer history and create incentives for delivery |
| **Discoverability** | Help voters find projects, compare proposals, identify builders |
| **Community Intelligence** | Enable reviews, flags, concerns, and shared knowledge |

### Core Invariants (Never Broken)

1. **Fact-first**: Every claim must be source-linked or marked as community opinion
2. **Neutral language**: Use "low observed activity" not accusations
3. **Source provenance**: Every field tracks `source_url`, `source_type`, `last_seen_at`
4. **No doxxing**: Only public data; no private information
5. **Confidence transparency**: All scores display confidence levels and methodology
6. **Immutable audit trail**: All moderation actions logged; edits tracked, never deleted

---

## Core Concepts

### The Data Model

```
┌──────────┐     funds      ┌──────────┐     delivers    ┌─────────────┐
│  FUNDS   │───────────────▶│ PROJECTS │───────────────▶│ MILESTONES  │
└──────────┘                └──────────┘                └─────────────┘
                                  │                            │
                                  │ team                       │ produces
                                  ▼                            ▼
                            ┌──────────┐                ┌─────────────┐
                            │  PEOPLE  │                │DELIVERABLES │
                            └──────────┘                └─────────────┘
```

### Entity Definitions

| Entity | Description |
|--------|-------------|
| **Fund** | A Catalyst funding round (F10, F14, etc.) with budget and stats |
| **Project** | A funded proposal with funding amount, status, and metrics |
| **Milestone** | A checkpoint with Statement of Milestone (SoM) and Proof of Achievement (PoA) |
| **Deliverable** | A concrete output or artifact produced |
| **Person** | An individual proposer or team member with aggregated stats |
| **Organization** | A company, DAO, or group entity |

### Accountability Scoring (0-100)

| Component | Weight | Measures |
|-----------|--------|----------|
| **Completion** | 30% | % of projects completed vs started |
| **Delivery** | 25% | On-time milestone delivery rate |
| **Community** | 20% | Ratings and community feedback |
| **Efficiency** | 15% | Actual spend vs. budget, ROI |
| **Communication** | 10% | Responsiveness, monthly reports |

**Badge Levels:**
- 🟢 **TRUSTED** (80-100): Consistently delivers
- 🔵 **RELIABLE** (60-79): Generally delivers with minor issues
- 🟡 **UNPROVEN** (40-59): Limited history or mixed results
- 🔴 **CONCERNING** (0-39): Pattern of non-delivery or flags

### ROI Scoring

```
ROI = Outcome Score / Normalized Funding ($10k baseline)

Outcome Score = (GitHub × 0.4) + (Deliverables × 0.3) + (On-chain × 0.3)
```

| Component | Metrics |
|-----------|---------|
| **GitHub** | Stars, forks, contributors, commit activity, PR merge rate |
| **Deliverables** | Milestone completion rate, on-time delivery % |
| **On-chain** | Transaction count, unique addresses, ADA volume |
