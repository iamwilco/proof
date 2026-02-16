# Skill: Documentation Maintenance

> Keep the PROOF knowledge base up to date with code changes

---

## Purpose

Ensure `docs/knowledge-base/` documentation stays synchronized with actual platform features, limitations, and technical implementation.

---

## When to Trigger This Skill

Run documentation updates when:

1. **New feature added** - Add to `02-features.md` and relevant user guide
2. **Feature changed** - Update affected user guides
3. **Bug fixed** - Remove from `08-limitations.md` known bugs section
4. **New limitation discovered** - Add to `08-limitations.md`
5. **Schema changed** - Update `09-architecture.md` schema section
6. **New API endpoint** - Update `09-architecture.md` API reference
7. **Authentication changed** - Update `09-architecture.md` auth flow
8. **Scoring logic changed** - Update `01-introduction.md` scoring section
9. **New user role** - Create or update relevant user guide
10. **FAQ-worthy change** - Add to `10-faq.md`
11. **New term introduced** - Add to `11-glossary.md`

---

## Documentation Structure

```
docs/knowledge-base/
├── README.md                      # Index - update links when adding files
├── 01-introduction.md             # Purpose, vision, scoring
├── 02-features.md                 # Feature list
├── 03-user-guide-visitor.md       # Public browsing
├── 04-user-guide-member.md        # Registered users
├── 05-user-guide-proposer.md      # Project proposers
├── 06-user-guide-reviewer.md      # Reviewers
├── 07-user-guide-moderator.md     # Moderators/admins
├── 08-limitations.md              # Known issues
├── 09-architecture.md             # Technical details
├── 10-faq.md                      # FAQ
└── 11-glossary.md                 # Terms
```

---

## Update Checklist

### For New Features

- [ ] Add to `02-features.md` in appropriate section (Public/Authenticated/Admin)
- [ ] Add usage instructions to relevant user guide(s)
- [ ] Add any new terms to `11-glossary.md`
- [ ] Update `README.md` if adding new document

### For Bug Fixes

- [ ] Remove from `08-limitations.md` Known Bugs table if applicable
- [ ] Update any workaround notes

### For Schema Changes

- [ ] Update model definitions in `09-architecture.md`
- [ ] Update relationships diagram if affected
- [ ] Update glossary if new entity type

### For Scoring Changes

- [ ] Update weights/formula in `01-introduction.md`
- [ ] Update `09-architecture.md` ROI Scoring Engine section
- [ ] Update FAQ scoring questions if affected

### For API Changes

- [ ] Update API Reference in `09-architecture.md`
- [ ] Update code examples if affected

---

## Update Process

### Step 1: Identify Affected Documents

Based on the change type, determine which files need updates:

| Change Type | Primary Doc | Secondary Docs |
|-------------|-------------|----------------|
| New feature | `02-features.md` | User guides, glossary |
| UI change | User guides | Features |
| Schema | `09-architecture.md` | Glossary |
| Scoring | `01-introduction.md` | Architecture, FAQ |
| Bug fix | `08-limitations.md` | - |
| New endpoint | `09-architecture.md` | - |
| Auth change | `09-architecture.md` | User guides |

### Step 2: Make Updates

Edit each affected file:

```bash
# Example: Adding a new feature
1. Read current state of 02-features.md
2. Add feature to appropriate section
3. Read relevant user guide
4. Add usage instructions
5. Check if new terms need glossary entries
```

### Step 3: Verify Consistency

After updates, verify:

- [ ] Links between documents still work
- [ ] No contradictions between documents
- [ ] Code snippets match actual implementation
- [ ] Version/date updated in affected docs

### Step 4: Update Version History

In `README.md`, add entry to Version History:

```markdown
| 1.X | [Date] | [Brief description of changes] |
```

---

## Code-to-Doc Mapping

### Key Source Files to Monitor

| Source File | Documentation Impact |
|-------------|---------------------|
| `prisma/schema.prisma` | `09-architecture.md` schema section |
| `src/lib/roi.ts` | `01-introduction.md` ROI section, `09-architecture.md` |
| `src/lib/auth/session.ts` | `09-architecture.md` auth section |
| `src/lib/flagDetection.ts` | `01-introduction.md`, `07-user-guide-moderator.md` |
| `src/app/api/**/route.ts` | `09-architecture.md` API reference |
| `package.json` | `09-architecture.md` tech stack |

### Feature Flags

If feature flags are used, document:
- Feature name
- Default state
- How to enable
- Affected functionality

---

## Templates

### New Feature Entry (02-features.md)

```markdown
### Feature Name (`/route`)

Brief description of what it does.

| Field | Description |
|-------|-------------|
| **Field 1** | What it does |
| **Field 2** | What it does |

Usage notes or requirements.
```

### New FAQ Entry (10-faq.md)

```markdown
### Question here?

Answer in 2-4 sentences. Include links to relevant docs if applicable.
```

### New Glossary Entry (11-glossary.md)

```markdown
### Term
Brief definition. Include context if term has specific meaning in PROOF vs general usage.
```

### New Limitation Entry (08-limitations.md)

```markdown
### Issue Name

**Issue:** Brief description of the limitation.

**Impact:**
- How it affects users
- What features are limited

**Current Workaround:**
Temporary solution if available.

**Planned Solution:**
How this will be addressed.
```

---

## Validation Commands

After documentation updates, verify:

```bash
# Check all internal links resolve
grep -r "\]\(./" docs/knowledge-base/ | head -20

# Check for TODO markers
grep -r "TODO\|TBD\|FIXME" docs/knowledge-base/

# Word count for each file
wc -w docs/knowledge-base/*.md
```

---

## Integration with Development Workflow

### Pre-commit Reminder

When making significant code changes, ask:
> "Does this change require documentation updates?"

### Post-milestone Review

After completing a milestone:
1. Review all changes in milestone
2. Run through update checklist
3. Update version history

### Quarterly Review

Every 3 months:
1. Read through all documentation
2. Verify accuracy against current code
3. Update stale examples
4. Remove resolved limitations
5. Add newly discovered issues
