# 📚 PROOF Agent Documentation Index

> **For AI Agents:** Read this file first to understand available documentation and when to reference each resource.

This folder contains all the documentation needed for AI agents to effectively assist with development on the PROOF project.

---

## 🗺️ Quick Navigation

| Folder | Purpose | When to Read |
|--------|---------|--------------|
| [`/system`](./system/) | Architecture, schemas, API endpoints | **First**, for any architectural decisions or understanding system design |
| [`/prd`](./prd/) | Product requirements and feature roadmaps | When implementing new features or understanding objectives |
| [`/tasks`](./tasks/) | Execution queue (atomic tasks) | When finding the next task to execute |
| [`/SOPs`](./SOPs/) | Standard Operating Procedures | When encountering known issues or following established patterns |
| [`/skills`](./skills/) | Agent skills and operators | When a task matches a supported skill |
| [`/workflows`](./workflows/) | Step-by-step development workflows | When executing specific development tasks |

---

## 📁 Folder Details

### `/system` — Architecture & Schemas

**The source of truth for major architectural decisions.**

Read these files to understand:
- Overall system architecture and component relationships
- Database schemas and entity relationships
- API endpoints and contracts
- Integration patterns with external services

Files:
- `architecture.md` — System overview, module dependencies, data flow, Cardano integration
- `database-schema.md` — Database entities, relationships, provenance tracking
- `api-endpoints.md` — REST endpoints, request/response formats, rate limiting

---

### `/prd` — Product Requirements

**Source of truth for what we're building.**

Files:
- `core.md` — Core PRD with objectives, invariants, constraints
- `transparency-features.md` — Feature roadmap for transparency system

---

### `/tasks` — Execution Queue

The task queue contains atomic units of work:
- **id** — Unique identifier (PROOF-XXX)
- **priority** — Execution order (1 = highest)
- **status** — `pending`, `in_progress`, `completed`, `blocked`
- **acceptance_criteria** — How to know it's done

---

### `/SOPs` — Standard Operating Procedures

**Learnings from resolved issues and best practices.**

When an issue is resolved or a complex integration succeeds:
1. Document the step-by-step solution
2. Include common pitfalls and how to avoid them
3. Reference related code or configuration

**To create a new SOP**, ask the agent:
> "Generate SOP for [task/integration name]"

---

### `/skills` — Agent Skills

**Reusable, task-specific playbooks and operators.**

| Skill | Description |
|-------|-------------|
| [`git-commit-formatter`](./skills/git-commit-formatter/skill.md) | Conventional commit formatting |

---

### `/workflows` — Development Workflows

**Step-by-step guides for common development tasks.**

| Workflow | Description | Trigger |
|----------|-------------|---------|
| [`test.md`](./workflows/test.md) | Run test suites | `/test` |
| [`ci.md`](./workflows/ci.md) | CI philosophy and quality gates | `/ci` |

---

## 🔄 The Agent Loop

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

## 📂 Directory Structure

```
.agent/
├── readme.md           # This file — agent documentation index
├── progress.md         # Milestone tracker and session notes
├── system/
│   ├── architecture.md # System overview, data flow
│   ├── database-schema.md # Entity relationships
│   └── api-endpoints.md # REST API documentation
├── prd/
│   ├── core.md         # Core PRD (source of truth)
│   └── transparency-features.md  # Feature roadmap PRD
├── tasks/
│   └── tasks.json      # Execution queue (atomic tasks)
├── SOPs/
│   └── readme.md       # SOP template and index
├── skills/
│   └── git-commit-formatter/ # Conventional commits skill
└── workflows/
    ├── test.md         # Testing workflow
    └── ci.md           # CI philosophy and quality gates
```

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

## ⚡ Quick Commands

| Command | Action |
|---------|---------|
| `continue` / `next` | Execute next pending task |
| `status` | Show current progress and blockers |
| `skip PROOF-XXX` | Mark task as blocked, move to next |
| `focus milestone N` | Prioritize tasks from milestone N |

---

## 🏗️ Project Overview

**PROOF** (Public Registry of Outcomes & On-chain Funding) is a transparency platform for Cardano treasury/grant funding.

### Technology Stack

| Layer | Technology | Key Modules |
|-------|------------|-------------|
| **Frontend** | Next.js 14+, React, TypeScript | `src/app/` |
| **Styling** | Tailwind CSS | Utility classes |
| **Database** | PostgreSQL via Supabase | Prisma ORM |
| **ETL** | Python (SQLAlchemy) | `etl/` |
| **Auth** | Supabase + CIP-30 Wallets | Wallet signatures |

### Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Database
npx prisma generate
npx prisma db push

# ETL (Python)
cd etl && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python catalyst/ingest_proposals.py
```

---

**Created:** 2026-02-10  
**Last Updated:** 2026-02-12