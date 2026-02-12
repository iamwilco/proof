# CI Philosophy

> CI exists to **protect invariants**. Every change must prove it doesn't break what already works.

---

## Philosophy

### Small Changes Are Enforced

Large changes are:
- Hard to review
- Hard to test
- Hard to revert
- Likely to introduce hidden bugs

**Each commit should do one thing well.**

### Quality Gates Protect the System

Quality gates are guardrails, not bureaucracy:

1. **Humans make mistakes** — Automated checks catch what humans miss
2. **Agents make mistakes** — AI-generated code needs verification too
3. **Context is lost** — Future developers won't know why something was done
4. **Reverting is expensive** — Catching issues early is cheaper than fixing production

### CI Must Be Fast

Target times:
- Lint: < 1 minute
- Type check: < 1 minute
- Tests: < 5 minutes
- Full pipeline: < 10 minutes

Slow CI discourages frequent commits — defeating the purpose.

---

## Quality Gates

### Gate 1: Type Check

**Purpose:** Catch type errors early.
**Blocks:** All merges if types fail.

### Gate 2: Lint

**Purpose:** Catch style issues and obvious errors.
**Blocks:** All merges if lint fails.

### Gate 3: Test

**Purpose:** Verify functionality hasn't regressed.
**Blocks:** All merges if tests fail.

### Gate 4: Build

**Purpose:** Ensure the project compiles successfully.
**Blocks:** All merges if build fails.

### Gate 5: Security (Future)

**Purpose:** Catch known vulnerabilities.
**Blocks:** Merges with critical vulnerabilities.

---

## Implementation Status

| Gate | Status | Notes |
|------|--------|-------|
| Type Check | ⬜ Pending | Add after PROOF-001 |
| Lint | ⬜ Pending | Add after PROOF-001 |
| Test | ⬜ Pending | Add when tests exist |
| Build | ⬜ Pending | Add after PROOF-001 |
| Security | ⬜ Future | Add after core gates |

---

## Branch Protection (When Ready)

Enable these settings:
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (no merge commits)
- ✅ Do not allow bypassing the above settings

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-10 | Initial CI philosophy documented |
