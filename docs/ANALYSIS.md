# Frontend Analysis — Consistency & Scale Audit

_Phase 1 deliverable. Scope: `frontend/src`. Goal: one shared standard + reference implementation that scales to millions of records._

---

## 1. The current "typical module" pattern

Every CRUD module (system-it-admin + gxp-service) is built the same shape today:

```
pages/<area>/<module>/
  index.tsx            # EVERYTHING: state, data fetch, columns, toolbar/bulk/row actions,
                       # the list table, the create/edit modal wiring, AND an inline delete modal
  Create<Entity>Modal.tsx   # RHF + zod form; receives reference data as static prop arrays
```

**List flow** (`index.tsx`):
1. `const paginated = useServerPagination<T>({ fetchPage: getX, dataKeys: ["xs"], dependencies: [refresh] })`
2. Render `<AppDataTable rowData={paginated.rows} {...paginated.tablePaginationProps} ... />`
3. Columns, `toolbarActions`, `bulkActions`, `rowActions` are declared inline with `useMemo` in every file.

**Create/Read/Update:** a `Modal` wraps `Create<Entity>Modal`. State `activeX` + `mode: "create" | "edit" | "view"` drives it. Save calls `createX` / `updateX` then flips a `refresh` boolean (or the global `reFetch`) to refetch.

**Delete / bulk delete:** a **second inline `Modal`** (~50 lines, copy-pasted per module) with a `pendingDeleteX: T[]` state, previews the first 5 rows, then calls `bulkDeleteX(ids, { silent: true })`.

**Bulk clone:** where it exists, calls `bulkDuplicateX(ids)`. Not every module has it.

**Service layer:** flat functions in `admin.service.ts` / `gxp.service.ts`:
`getX`, `createX`, `updateX`, `deleteX`, `bulkDeleteX`, `bulkDuplicateX`, and sometimes `enableX` / `disableX` / `getXById`.

**Reference/dropdown data:** the list page eagerly fetches related entities with a hard `{ limit: 100 }` cap and passes them as static arrays to the modal, which renders `<SelectDropdown options={...}>` (a purely in-memory, client-filtered select).

---

## 2. Inconsistencies found

### Naming
- **Service verbs:** the codebase uses `getX` (list), but "clone" is called **`bulkDuplicateX`** / `duplicateApplication`. Two words for one concept ("duplicate" vs the desired "clone"). No `fetch<Entity>List` convention.
- **`getXById` is inconsistent:** only `getApplicationById` exists. Every other module never fetches a single record — it passes the full row object from the list into the modal. This breaks the moment a detail view needs a field the list didn't return, and makes deep-linking to `/edit/:id` impossible.
- **Enable/disable** helpers exist for GXP entities (`enableSupplier`, `disableWorkflow`, …) but not admin entities — asymmetric surface.
- **`assignmentGroup` uses `groupName` as its identifier** in `enableAssignmentGroup(groupName)` while everything else keys off id. Odd one-off.
- **Entity id field: `_id` vs `id`.** The frontend assumes **`_id`** everywhere (225 uses across `pages/`), but the DB was just migrated to UUID `id` (recent commits). `getCompany` already hand-patches `data.company._id = data.company.id`. This is a latent, repo-wide mismatch — see §3.
- **List data keys are ad-hoc strings:** `dataKeys: ["users"]`, `["designations"]`, etc., must match the server's envelope key by hand per call site.
- **Modal/prop naming drift:** Designation modal takes `initialData` + `onSubmit`; Users modal takes `activeUser` + `onSubmit` + four reference-array props. No shared form contract.
- **Refetch trigger drift:** some modules use a local `refresh` boolean, Users uses the **global** `reFetch` from `GlobalContext`. Two mechanisms for the same job.

### Structure
- **No separation of concerns inside a module.** `index.tsx` files are 380–580+ lines mixing columns, permissions, actions, delete UI, and data orchestration. Columns are not reusable or testable in isolation.
- **Two monolithic service files** (~500 and ~700 lines) instead of colocated per-module API modules. Adding an entity means editing a shared 700-line file.
- **The delete-confirm modal is duplicated** verbatim in essentially every `index.tsx` (Designation, Users, Suppliers, …) — same markup, same 5-row preview, same handlers.
- **Type definitions are duplicated per file.** `LocationOption`, `DepartmentOption`, `UserRole`, etc. are re-declared inline in `users/index.tsx` **and** re-declared again in `CreateUserModal.tsx`, and again wherever else they're needed.
- **`searchAccessor` is a leaky prop.** With server pagination active it no longer filters (client search is disabled when `onSearchChange` is set), yet it's still required just to make the search box render. It's simultaneously dead code and a UI toggle.

---

## 3. Scalability risks (the "millions of records" problems)

Ranked by severity.

### 🔴 Critical — dropdowns load-all
- **Every reference dropdown fetches a fixed page and silently truncates.** `users/index.tsx` loads roles/locations/departments/designations at `{ limit: 100 }`; `CreateServiceRequestModal.tsx` fires **six** `{ limit: 100 }` requests on open (environments, assignment groups, workflows, application software, application roles, locations); `assignment-groups` loads users at `{ limit: 100 }`. Past 100 rows, valid options **simply disappear** with no error. This is the single biggest correctness-at-scale bug.
- **`SelectDropdown` is in-memory only** ([components/ui/dropdown/SelectDropdown.tsx](frontend/src/components/ui/dropdown/SelectDropdown.tsx)): it takes a static `options[]`, filters with `.filter(includes)` in the browser, no server typeahead, no pagination/infinite scroll, no virtualization of the option list.
- **Eager fetch on list mount.** Reference data is fetched when the *list page* mounts (not when the modal opens), so every table visit pays for dropdown data the user may never use.

### 🔴 Critical — server-side sort & filter not wired
- `AppDataTable` marks columns `sortable: true`, so ag-grid sorts **the current page only** in the browser. With server pagination this is actively misleading — the user sorts 7 rows and thinks the dataset is sorted. `useServerPagination` sends only `page/limit/search`; there is **no `sortBy`/`sortDir` or column-filter plumbing** to the server.
- Same for column filters — none are wired to the API.

### 🟠 High — client-side tabs & selection break past page 1
- **Tabs filter client-side.** `users/index.tsx` "Active / Inactive" tabs use `predicate` over `rowData`, i.e. only the current page. The tab counts and filtering are wrong for any dataset larger than one page. These must become server-side filter params.
- **Bulk actions can't "select all matching filter."** Selection is cleared on every page/pageSize change (`AppDataTable` effects), so a user can only ever act on the rows visible on the current page. There is no "select all N matching" → server batch path, which the requirements explicitly demand.

### 🟠 High — no server-side count integrity for derived UI
- Tab counts, "X total", and any badges are computed from the loaded page, not the server total (except the pagination total, which is correct).

### 🟡 Medium — rendering / fetch hygiene
- **`fitContentHeight` switches ag-grid to `domLayout="autoHeight"`**, which **disables row virtualization**. It's gated by `fitContentHeightMaxRows` (≤8) so it's safe today, but it's a foot-gun: raise the page size and the DOM renders every row.
- **Search debounce lives in the view, not the data hook** (250 ms in `AppDataTable`). Requirement asks ~300 ms and, more importantly, debouncing belongs with the query so it's consistent for tables *and* dropdowns.
- **No request cancellation / race protection at the service layer.** `useServerPagination` guards with a `cancelled` flag, but rapid param changes still fire every request; there's no `AbortController`.
- **Columns/actions are re-`useMemo`'d per module** but depend on `t`, `openModal`, etc.; fine, but there's no shared, memoized column factory, so each module re-implements cell renderers (avatar/initials, status pill, truncation) by copy-paste.
- **No caching.** Every list revisit and every dropdown open refetches from zero; no reuse of recently fetched pages.

### 🟡 Medium — non-functional states are inconsistent
- Loading = ag-grid overlay; error = a red banner string; empty = an overlay template. There are **no skeletons**, and error/empty styling is re-specified per call. No optimistic updates — every mutation does a full refetch (correct, but heavy at scale and flickery).

---

## 4. Missing shared abstractions (feeds Phase 2)

| Missing | What it replaces today | Why it matters at scale |
|---|---|---|
| **`AsyncSelect` + `useAsyncOptions`** | `SelectDropdown` + `{limit:100}` eager fetch | server typeahead, paginated/infinite options, virtualized list, **resolve-selected-by-id**, page caching |
| **`useServerTable`** (supersedes `useServerPagination`) | `useServerPagination` (no sort/filter) | one hook owning page, pageSize, **sort, column filters**, debounced search, abortable fetch |
| **`ConfirmDialog`** | ~50-line inline delete `Modal` copy-pasted per module | one destructive-action dialog for delete + bulk delete |
| **`DataTable` wrapper conventions** | `AppDataTable` (already good) | wire server sort/filter, "select all matching", skeleton/empty/error states |
| **Per-module `.api.ts` pattern** | two 500–700-line shared service files | colocation, uniform `fetch<E>List/…/bulkClone<E>` surface |
| **Per-module `.types.ts` / `.columns.tsx`** | inline types (duplicated) + inline columns | single source of truth, testable columns |
| **Shared cell renderers** (avatar, status pill, truncate) | copy-pasted JSX in every `columnDefs` | consistency + fewer re-renders |
| **Canonical id normalization** (`id` vs `_id`) | per-call hand-patching (`getCompany`) | remove the repo-wide `_id` assumption safely |

---

## 5. Headline conclusions

1. **Tables are ~70% there.** `AppDataTable` + `useServerPagination` are a solid base already used everywhere. The work is *finishing* server-side sort/filter, fixing tabs/selection, and standardizing states — not a rewrite.
2. **Dropdowns are the real fire.** Every relational select is a load-all with a silent 100-row ceiling. This is where a new shared `AsyncSelect`/`useAsyncOptions` primitive is mandatory.
3. **Consistency is a boilerplate problem.** ~400–580-line `index.tsx` files, duplicated delete modals, duplicated types, and two mega service files. A canonical module layout + colocated `.api`/`.types`/`.columns` fixes most of it mechanically.
4. **One latent landmine: `_id` vs `id`.** The UUID migration means the frontend's `_id` assumption needs a decision (normalize in the service layer) before mass migration — otherwise every refactored module risks silent breakage.

---

## Open questions for you (before Phase 2)

1. **Server contract for scale:** does the backend already support `sortBy`/`sortDir` and per-field filters on list endpoints, plus a "select all matching filter" batch delete/clone (filter-based, not id-list)? Or do we design the standard to what exists and file backend asks separately?
2. **`_id` vs `id`:** confirm the API now returns `id` (UUID). Preferred fix — normalize to one canonical field in the service layer so components stop caring?
3. **Data layer:** open to introducing **React Query / RTK Query** for caching + request dedupe + optimistic updates, or must we stay on plain axios + the custom hook?
4. **"Clone" vs "duplicate":** standardize on **`bulkClone<Entity>`** naming (per your brief) and alias the existing `bulkDuplicate*` endpoints — confirm the endpoints stay `/bulk-duplicate` server-side?
