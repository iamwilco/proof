# Pre-Launch Feedback & Improvement Tracker

**Status:** 🔴 Critical Issues  
**Last Updated:** 2026-02-14  
**Target:** Production-ready launch

---

## Priority Legend
- 🔴 **P0 - Critical:** Blocks launch, app crashes/unusable
- 🟠 **P1 - High:** Major UX issues, missing core features
- 🟡 **P2 - Medium:** Polish items, design consistency
- 🟢 **P3 - Low:** Nice-to-have improvements

---

## 🔴 P0 - Critical Errors

### DB-001: Database Schema Out of Sync
- **Page:** `/projects`
- **Error:** `Project.githubStars` column doesn't exist
- **Root Cause:** Schema has columns that haven't been migrated to database
- **Fix:** Run `npx prisma migrate dev` or `npx prisma db push`
- **Status:** ⬜ TODO

### ERR-001: ConnectionHoverCard AbortError
- **Page:** `/people`
- **Error:** `signal is aborted without reason` in useEffect
- **Root Cause:** Fetch request not being properly cleaned up on unmount
- **Fix:** Add AbortController cleanup in useEffect return
- **Status:** ⬜ TODO

### ERR-002: Rankings Performance Measure Error
- **Page:** `/rankings`
- **Error:** `Failed to execute 'measure' on 'Performance': negative timestamp`
- **Root Cause:** Next.js/React timing issue, possibly dev-mode only
- **Fix:** Investigate component timing, may need force-dynamic
- **Status:** ⬜ TODO

---

## 🟠 P1 - High Priority (UX/Functionality)

### FUNC-001: Empty Organizations Page
- **Page:** `/organizations`
- **Issue:** No data displayed at all
- **Possible Causes:** No org data in DB, or query failing silently
- **Status:** ⬜ TODO

### FUNC-002: Empty Milestones Page
- **Page:** `/milestones`
- **Issue:** No milestones displayed
- **Note:** Schema exists, API queries work - likely no data in DB
- **Status:** ⬜ TODO

### FUNC-003: Project Search Not Working
- **Page:** `/projects/[id]`
- **Issue:** Search functionality broken
- **Status:** ⬜ TODO

### AUTH-001: Protected Routes
- **Issue:** Need to block certain areas for logged-in users only
- **Areas to protect:** TBD (admin, account, bookmarks, etc.)
- **Status:** ⬜ TODO

### ADMIN-001: Admin Dashboard Verification
- **Issue:** Ensure admin dashboard is fully functional
- **Status:** ⬜ TODO

---

## 🟡 P2 - Design & UX Overhaul

### DESIGN-001: Inconsistent Backgrounds
- **Issue:** Some pages have dark background, others have white
- **Fix:** Establish consistent theme system
- **Status:** ⬜ TODO

### DESIGN-002: Invisible Input Fields
- **Issue:** White inputs on white background with white font
- **Affected:** Text fields, dropdowns across multiple pages
- **Fix:** Add proper borders, contrast, dark mode support
- **Status:** ⬜ TODO

### NAV-001: Navigation Overwhelm
- **Issue:** Top navbar is overwhelming with too many items
- **Proposal:** Implement smart sidebar navigation
- **Goals:**
  - Clean, collapsible sidebar
  - Grouped navigation sections
  - Better mobile experience
  - Quick access to key features
- **Status:** ⬜ TODO

---

## 🟢 P3 - Polish Items

*(To be added as we progress)*

---

## Design System Guidelines (To Implement)

### Color Scheme
- **Background:** Consistent slate-50 (light) / slate-900 (dark)
- **Cards:** White (light) / slate-800 (dark)
- **Inputs:** Visible borders, proper contrast
- **Text:** slate-900 (light) / slate-100 (dark)

### Navigation Structure (Proposed)
```
┌─────────────────────────────────────┐
│ Logo                    [User Menu] │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │     Main Content         │
│          │                          │
│ - Home   │                          │
│ - Explore│                          │
│   └ Projects                        │
│   └ People                          │
│   └ Organizations                   │
│   └ Funds                           │
│ - Analytics                         │
│ - Graph                             │
│ - Admin (if admin)                  │
│          │                          │
└──────────┴──────────────────────────┘
```

---

## Testing Checklist

Before marking any task complete:

- [ ] `npm run type-check` passes
- [ ] `npm run build` passes
- [ ] No console errors on affected pages
- [ ] Tested in both light and dark mode
- [ ] Mobile responsive check
- [ ] Auth state tested (logged in vs out)

---

## Progress Log

### 2026-02-14
- Created feedback tracker
- Identified 3 critical errors, 5 high priority items, 3 design issues
- Database migration needed as first step
