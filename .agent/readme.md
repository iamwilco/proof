# PROOF Agent Control Layer

> **Humans own strategy. Agents own execution.**

This directory contains the control system for AI agent operations on the PROOF project.

---

## The Agent Loop

Every agent session follows this exact sequence:

```
┌─────────────────────────────────────────────────────────────┐
│                     THE AGENT LOOP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. READ PRD                                               │
│      └─ .agent/prd/core.md                                  │
│      └─ Understand objectives, invariants, constraints      │
│                                                             │
│   2. READ TASK QUEUE                                        │
│      └─ .agent/tasks/tasks.json                             │
│      └─ Find highest-priority pending task                  │
│                                                             │
│   3. EXECUTE ONE TASK                                       │
│      └─ Make small, reversible changes                      │
│      └─ Run workflow checks (lint, test, build)             │
│                                                             │
│   4. UPDATE STATE                                           │
│      └─ Mark task complete in tasks.json                    │
│      └─ Update documentation if needed                      │
│                                                             │
│   5. STOP                                                   │
│      └─ Do NOT proceed to next task                         │
│      └─ Wait for human review                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**This is non-negotiable.** Agents must not batch tasks, skip steps, or make assumptions about future work.

---

## Directory Structure

```
.agent/
├── README.md           # This file — agent control layer
├── progress.md         # Milestone tracker and session notes
├── prd/
│   ├── core.md         # Core PRD (source of truth)
│   └── transparency-features.md  # Feature roadmap PRD
├── tasks/
│   └── tasks.json      # Execution queue (atomic tasks)
└── workflows/
    ├── test.md         # Testing workflow (must pass before completion)
    └── ci.md           # CI philosophy and quality gates
```

---

## File Purposes

### `prd/core.md` — Source of Truth

The PRD contains:
- **Objective** — What we're building
- **Invariants** — Rules that must never break
- **Non-goals** — What we're explicitly not doing
- **Constraints** — Technical and process limitations
- **Status** — Current progress

**Read this first. Always.**

### `tasks/tasks.json` — Execution Queue

The task queue contains atomic units of work:
- **id** — Unique identifier (PROOF-XXX)
- **priority** — Execution order (1 = highest)
- **status** — `pending`, `in_progress`, `completed`, `blocked`
- **description** — What needs to be done
- **acceptance_criteria** — How to know it's done

**Pick the highest-priority pending task. Execute only that task.**

### `workflows/` — Quality Gates

Workflows define procedures that must pass before any task is complete:
- **test.md** — Install, lint, test, build
- **ci.md** — CI philosophy and gates

**If any workflow step fails, the task is NOT complete.**

---

## Rules for Agents

1. **Always read PRD first**
2. **Always read task queue second**
3. **Execute exactly one task per session**
4. **Make small, reversible changes**
5. **Update documentation to reflect changes**
6. **Mark task complete only when workflows pass**
7. **Stop after task completion — do not continue**

Violations of these rules compromise the entire system's integrity.

---

## Context Resets Are Expected

The `/new` command (or any context reset) is normal. Agents will lose all conversational memory. This is by design.

**All memory must live in files:**
- PRD documents current objectives
- Task JSON documents current queue
- Code documents current implementation
- Comments document decisions

If it's not in a file, it doesn't exist.

---

## Why This Works

- **Predictability** — Same inputs produce same outputs
- **Auditability** — Every decision is traceable to documentation
- **Resilience** — Any agent can continue any other agent's work
- **Safety** — Small changes are easy to review and revert

---

## Starting a Session

Use this prompt to begin each agent session:

```
Read these files in order:
1. `.agent/prd/core.md` — Core requirements
2. `.agent/prd/transparency-features.md` — Feature roadmap
3. `.agent/tasks/tasks.json` — Task backlog
4. `.agent/progress.md` — Current status

## Execution Rules

1. **Find Current Work**
   - Locate the first task with `status: "in_progress"`
   - If none, find the highest-priority `status: "pending"` task

2. **Execute Single Task**
   - Mark task as `in_progress` in tasks.json
   - Implement ALL acceptance criteria
   - Run tests/validation before marking complete

3. **Update Files After Completion**
   - `tasks.json` — Mark task `completed`, add completion date
   - `progress.md` — Update milestone progress, current task, session notes
   - `prisma/schema.prisma` — If schema changed, run `prisma generate`
   - `CHANGELOG.md` — Add entry for completed work

4. **Commit & Report**
   - After each completed task, stage changes and commit using Conventional Commits (see git-commit-formatter)
   - Example: `feat(PROOF-XXX): <task title>`
   - Output: task ID, what was done, files changed, next task ID

5. **Stop After One Task**
   - Do NOT auto-continue to next task
   - Wait for user to say "continue" or "next"
```

---

## Quick Commands

| Command | Action |
|---------|--------|
| `continue` / `next` | Execute next pending task |
| `status` | Show current progress and blockers |
| `skip PROOF-XXX` | Mark task as blocked, move to next |
| `focus milestone N` | Prioritize tasks from milestone N |