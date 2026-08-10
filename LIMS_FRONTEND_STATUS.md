# LIMS Frontend — Status & Handoff

Companion to [LIMS_BACKEND_SPEC.md](./LIMS_BACKEND_SPEC.md) (give that one to the backend dev).
This file is the frontend picture: what's built, what's left, how to run it, and what gets deleted when `lims-service` goes live.

Branch: `test` · Frontend standard: [frontend/STANDARDS.md](./frontend/STANDARDS.md) · Migration rules: [frontend/MIGRATION.md](./frontend/MIGRATION.md)

---

## 1. Run it today (no backend needed)

`lims-service` doesn't exist yet, so LIMS runs against an in-browser mock.

```bash
cd frontend
npm install
# .env already contains:
#   VITE_API_LIMS_BASE_URL=http://localhost:9003/v1/api
#   VITE_ENABLE_LIMS_MOCKS=true
npm run dev          # → http://localhost:3000/lims/locations
```

Working screens have real data: list, search, pagination, create, edit (with change reason),
remove, restore, audit trail. Mocks are **dev-only** and gated behind `VITE_ENABLE_LIMS_MOCKS`
— they can never reach production, and only LIMS calls are intercepted.

```bash
npm run typecheck    # tsc -b
npm run test         # vitest
npm run build
```

---

## 2. Module status — 26 of 26 ✅ all modules built

| # | Module | Route | Status |
|---|--------|-------|--------|
| 1 | Storage Locations | `/lims/locations` | ✅ built + integration test |
| 2 | Lab Groups | `/lims/groups` | ✅ built + integration test |
| 3 | Parameters (Stock Parameters) | `/lims/parameters` | ✅ built |
| 4 | Lab Roles | `/lims/roles` | ✅ built |
| 5 | Projects | `/lims/projects` | ✅ built |
| 6 | Studies | `/lims/studies` | ✅ built |
| 7 | Suppliers | `/lims/suppliers` | ✅ built |
| 8 | Customers | `/lims/customers` | ✅ built |
| 9 | Calibrations | `/lims/calibrations` | ✅ built |
| 10 | Instrument Parts | `/lims/instrument-parts` | ✅ built |
| 11 | Test Groups | `/lims/test-groups` | ✅ built |
| 12 | Pick Lists (Phrases) | `/lims/phrases` | ✅ built — first `SubFormGrid` consumer |
| 13 | Lab Users | `/lims/users` | ✅ built |
| 14 | Stock Items | `/lims/stocks` | ✅ built |
| 15 | Stock Batches | `/lims/stock-batches` | ✅ built |
| 16 | Aliquots | `/lims/aliquots` | ✅ built |
| 17 | Instruments | `/lims/instruments` | ✅ built |
| 18 | Inspection Plans | `/lims/inspection-plans` | ✅ built |
| 19 | Analyses | `/lims/analyses` | ✅ built |
| 20 | Specifications | `/lims/specifications` | ✅ built |

**All 20 phase-1 modules are built.** `LimsModulePending` is now unused by any route and can be deleted.

### Phases beyond the 20 above

| Phase | Section | Modules | Status |
|---|---|---|---|
| 1 | A. Administration + B. Master Data | 20 | **20 built ✅** |
| 2 | C. Lab Executions — Batches, Lots, Samples, Tests, Results | 5 | **5 built ✅** |
| 3 | G. Schedulers — Sample / Test / Result | 1 | **1 built ✅** |

**Total 26 modules — all built.** Sections D (Incident/Deviation), E (SDMS) and F (Workflow rules)
are marked *Future* in the spec and are out of scope entirely.

---

## 3. What's already in place (shared)

| Piece | Path |
|---|---|
| Nav — 2 sidebar groups, 20 items, lab icons | `components/layout/AppSidebar.tsx`, `public/icons/flask.svg`, `lab-access.svg` |
| Routes + permissions per route | `routes/index.tsx` (generated from one table) |
| 80 permissions `LIMS:<ACTION>:<ENTITY>` | `utils/permissions.ts` |
| Axios instance (port 9003) | `utils/lims.axios.interceptor.ts` |
| Capability flags (all `false` until endpoints ship) | `lib/query/capabilities.ts` |
| Repeatable row editor | `components/data/SubFormGrid.tsx` |
| Change-reason / restore / audit state + dialogs | `hooks/useLimsCompliance.ts`, `components/data/LimsComplianceDialogs.tsx` |
| Audit trail viewer | `components/data/AuditTrailDialog.tsx` |
| `ConfirmDialog` extended with `requireReason` | `components/data/ConfirmDialog.tsx` |
| Mock lims-service | `src/mocks/` |

Each module follows STANDARDS.md §1 — 8 files: `.types`, `.api`, `.queries`, `.columns`,
`.schema`, `Form`, `List`, `index`.

---

## 4. How LIMS differs from GXP (and why)

Same architecture, same 8-file layout, same `DataTable` / `AsyncSelect` / React Query. Three additions,
all driven by the functional spec rather than preference:

| Addition | Source |
|---|---|
| Change reason on every edit / remove / restore | Spec pp.11+ — audit needs Who, When, Old, New, **Why**, Unique ID |
| Soft delete + Restore | Spec — every entity lists Remove **and** Restore |
| `SubFormGrid` | Spec — 11 entities have sub-form grids |

Two things are **not** spec-driven and are removable on request: the MSW mocks and the per-module
integration tests. Both exist only because there is no `lims-service` to click through; GXP modules
have neither (`find src/pages -name "*.test.*"` → 0 outside LIMS).

---

## 5. When `lims-service` goes live

**Delete:**
- `public/mockServiceWorker.js`
- the `VITE_ENABLE_LIMS_MOCKS` block in `src/main.tsx` (~8 lines)
- `VITE_ENABLE_LIMS_MOCKS` from `.env`
- `src/mocks/browser.ts`

**Keep (recommended):** `src/mocks/server.ts` + `lims/handlers.ts` + `lims/fixtures.ts` — the node half
that backs the module tests. Tests shouldn't hit a live database. Delete only if you also drop the
module tests.

**Change, don't delete:** flip each entity's flag in `lib/query/capabilities.ts` from `false` to `true`
as its endpoint ships — sort headers and "select all matching" light up with no module rewrite.

**Unrelated triggers:**
- `pages/lims/LimsModulePending.tsx` → delete when the 20th module is built
- `pages/lims/users/LimsUser.options.ts` → interim option seed; fold into the Lab Users module when
  it is built (already done for Lab Groups and Pick Lists)

---

## 6. Known issues found along the way

| Issue | Where | Severity |
|---|---|---|
| `Switch` renders a bare `<label>` — no `<input>`, no `role`, no `aria-checked`. Not keyboard-operable, invisible to screen readers | `components/common/form/switch/Switch.tsx` | Affects GXP too |
| `gxp-service` auth middleware accepts any token and hardcodes an ADMIN user; no permission checks on any route | `gxp-service/src/middlewares/auth.middleware.ts` | **Security** — don't copy into lims-service |
| Service Request statuses have no transition rules, no role checks, and no per-user assignee | `gxp-service` | Feature gap |
| 14 pre-existing eslint warnings (`openForm` / `useMemo` deps) across GXP + admin lists | `pages/**/List.tsx` | Cosmetic |

---

## 7. Suggested order from here

All 26 modules are built. What is left is not module work:

1. **Review the screens** — the later modules were generated from a field spec, so field
   order and grid density want a human eye (start with `/lims/samples`, `/lims/analyses`).
2. **Behaviours not yet wired** — Stock Batch's auto-derived `stockId/batchNumber`,
   Aliquots generating rows from the count field, Sample test-windows generated from the
   Test Group, Scheduler run logic. All need the backend to define them first.
3. **Tests** — no per-module tests were written (deferred by request). `SubFormGrid`,
   `ConfirmDialog`, permissions, routing and 2 modules are covered; 24 modules are not.
4. **Cleanup when the backend lands** — see §5.
5. **Delete `LimsModulePending`** — no route uses it any more.

Backend can proceed in parallel at any point; see [LIMS_BACKEND_SPEC.md §9](./LIMS_BACKEND_SPEC.md)
for the recommended entity order (Pick Lists → Groups → Locations first, since everything references them).
