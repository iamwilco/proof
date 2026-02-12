# Test Workflow

This workflow must pass before any task is marked complete.

---

## Purpose

Ensure changes do not break existing functionality and meet quality standards. **No task is complete until this workflow passes.**

---

## Steps

### 1. Install Dependencies

```bash
npm install
```

Ensure all dependencies are installed and up to date.

### 2. Type Check

```bash
npm run type-check
# or: npx tsc --noEmit
```

All TypeScript errors must be resolved.

### 3. Lint

```bash
npm run lint
```

All linting errors must be resolved. Warnings should be reviewed.

### 4. Test

```bash
npm test
```

All tests must pass. New functionality must include corresponding tests.

### 5. Build

```bash
npm run build
```

The build must complete without errors.

---

## Workflow Status

Update this table after running each step:

| Step | Command | Status |
|------|---------|--------|
| Install | `npm install` | ⬜ Not run |
| Type Check | `npm run type-check` | ⬜ Not run |
| Lint | `npm run lint` | ⬜ Not run |
| Test | `npm test` | ⬜ Not run |
| Build | `npm run build` | ⬜ Not run |

---

## Failure Protocol

If any step fails:

1. **Do NOT mark the task complete**
2. Document the failure in the task
3. Fix the issue before proceeding
4. Re-run the entire workflow from the beginning

---

## Python ETL Workflow

For Python ETL changes, also run:

```bash
cd etl
pip install -r requirements.txt
python -m pytest
python -m flake8 .
```

---

## Notes

- Keep this workflow fast (< 5 minutes total)
- Run before every task completion
- If tests don't exist yet, note it but don't block on it
