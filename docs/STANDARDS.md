# Frontend Module Standard

_Phase 2 deliverable. One standard every module follows. Approve before any module code is written (Phase 3)._

Companion docs: [ANALYSIS.md](./ANALYSIS.md) (why) · [BACKEND_ASKS.md](./BACKEND_ASKS.md) (server gaps) · MIGRATION.md (Phase 4, how-to).

Stack is fixed: React 18 + TS + Vite, ag-grid, react-hook-form + zod, Tailwind, react-router 7, axios. **New:** TanStack Query for server state (Redux stays for auth/client state only).

---

## 1. Canonical module folder layout

The standard is **colocation within the existing `pages/<area>/<module>/` folder** — no relocation. We apply the full file-split, colocation, and naming in place. One shape, every module:

```
pages/<area>/<module>/                    # existing folder, unchanged location (e.g. pages/system-it-admin/designations/)
  <Entity>.api.ts          # axios service fns for this entity — the ONLY place its endpoints live
  <Entity>.types.ts        # types/interfaces for this entity (single source of truth)
  <Entity>.columns.tsx     # ag-grid ColDef factory (uses shared cell renderers)
  <Entity>.queries.ts      # React Query keys + query/mutation hooks wrapping .api.ts
  <Entity>.schema.ts       # zod form schema (moved out of the global lib/schema.ts)
  <Entity>List.tsx         # the table view (was index.tsx's list half)
  <Entity>Form.tsx         # create/edit/view form (was Create<Entity>Modal.tsx)
  index.tsx                # thin: composes <Entity>List, owns route-level concerns only
```

Rules:
- **PascalCase `<Entity>`** in file names, matching the type name (`Designation`, `User`).
- The **folder stays where it is** (`pages/system-it-admin/designations/`, etc.) — `routes/index.tsx` lazy imports are untouched, git history stays clean.
- `index.tsx` remains the lazy-route entry and becomes thin — it renders `<EntityList/>` and nothing else once migrated.
- Cross-module shared code lives under `src/components/data/` (primitives) and `src/hooks/` (shared hooks), never copied into a module.
- **Transition:** we do NOT refactor all of `pages/` at once. Files are split/renamed in place inside each module folder as it's migrated. Unrefactored modules stay as-is.
- **Optional later (out of scope):** a purely mechanical move to a top-level `modules/<entity>/` tree may be decided *after* all modules are migrated. It is cosmetic and must not gate the refactor.

Shared location map:
```
src/components/data/
  DataTable.tsx            # our AppDataTable, evolved (server sort/filter/select-all)
  AsyncSelect.tsx          # paginated, virtualized, typeahead select
  ConfirmDialog.tsx        # destructive-action dialog
  TableStates.tsx          # <TableSkeleton/> <EmptyState/> <ErrorState/>
  cells/                   # shared cell renderers (avatar, status pill, truncate)
src/hooks/
  useServerTable.ts        # page/pageSize/sort/filters/search + RQ fetch
  useAsyncOptions.ts       # dropdown search/pagination/cache (RQ infinite)
src/lib/query/
  queryClient.ts           # QueryClient config
  capabilities.ts          # endpoint capability flags (see §10)
  normalizeId.ts           # id/_id normalization (see §3)
```

---

## 2. Naming conventions — applied identically everywhere

### API functions (in `<Entity>.api.ts`)
| Purpose | Name | HTTP |
|---|---|---|
| List (paginated/sorted/filtered) | `fetch<Entity>List(params)` | `GET {route}` |
| Single record | `fetch<Entity>ById(id)` | `GET {route}/:id` |
| Create | `create<Entity>(payload)` | `POST {route}` |
| Update | `update<Entity>(id, payload)` | `PATCH {route}/:id` |
| Delete | `delete<Entity>(id)` | `DELETE {route}/:id` |
| Bulk delete | `bulkDelete<Entity>(selection)` | `POST {route}/bulk-delete` |
| Bulk clone | `bulkClone<Entity>(selection)` | `POST {route}/bulk-duplicate` ← endpoint keeps `duplicate` |
| Single clone | `clone<Entity>(id)` | `POST {route}/bulk-duplicate` with one id |
| Enable / disable | `enable<Entity>(id)` / `disable<Entity>(id)` | `PATCH {route}/enable\|disable/:id` |
| Options (for AsyncSelect) | `fetch<Entity>Options(params)` | `GET {route}` (slim projection if available) |
| Resolve by ids | `resolve<Entity>ByIds(ids)` | `GET {route}?ids=` (fallback: N× byId) |

- `<Entity>` is **singular PascalCase**: `fetchDesignationList`, `bulkCloneUser`.
- The old `getX` / `bulkDuplicateX` names are **renamed** (`bulkClone` calls the `/bulk-duplicate` route internally — no backend rename, see §2 note in BACKEND_ASKS).
- `enable`/`disable` are **added symmetrically** to admin entities where a status toggle exists; where the backend route is missing, the function is omitted and the capability flag hides the control.

### Selection type (used by every bulk fn)
```ts
// one shape for id-based AND filter-based batch ops
type BulkSelection =
  | { ids: string[] }                              // explicit rows (current-page selection)
  | { filter: ListFilters; excludeIds?: string[] } // "select all matching" (needs canBulkByFilter)
```

### React Query keys (in `<Entity>.queries.ts`)
```ts
const designationKeys = {
  all:    ["designation"] as const,
  list:   (params) => ["designation", "list", params] as const,
  detail: (id)     => ["designation", "detail", id] as const,
  options:(search)  => ["designation", "options", search] as const,
};
```
Query hooks: `use<Entity>List(params)`, `use<Entity>(id)`, `use<Entity>Options(search)`.
Mutation hooks: `useCreate<Entity>()`, `useUpdate<Entity>()`, `useDelete<Entity>()`, `useBulkDelete<Entity>()`, `useBulkClone<Entity>()`.

### Components / hooks / files
- Components: **PascalCase** (`DesignationList`, `AsyncSelect`).
- Hooks: **camelCase `use…`** (`useServerTable`, `useAsyncOptions`).
- Types/interfaces: **PascalCase**, no `I` prefix. Row type is `<Entity>` (`Designation`), option type is `<Entity>Option`.
- Columns factory: `get<Entity>Columns(ctx)`.

---

## 3. `id` normalization + `_id` compatibility shim

Canonical field going forward is **`id`** (UUID). The service layer normalizes every response so components never touch raw API shape.

```ts
// src/lib/query/normalizeId.ts
export const normalizeId = <T extends Record<string, any>>(row: T): T & { id: string; _id: string } => {
  const id = row.id ?? row._id;
  return { ...row, id, _id: id };   // _id kept populated as a TEMPORARY shim
};
export const normalizeList = <T>(rows: T[]) => rows.map(normalizeId);
```

- Applied inside each `fetch<Entity>List` / `fetch<Entity>ById` (and nested relations where needed) — the one place shapes are massaged. Removes the per-call hand-patching (`getCompany`).
- **Shim rule:** `_id === id` so the ~225 existing `_id` reads keep working during migration.
- **Migration:** when a module is refactored, switch its own reads to `id` and drop `_id` from that module. Once `grep -rn "_id" src/` is empty, delete the shim line and the `_id` from `normalizeId`'s return type. Tracked in MIGRATION.md.
- Canonical id lives on `id`; `getRowId`, query keys, and selection all use `id`.

---

## 4. React Query adoption pattern

Add `@tanstack/react-query`. Provider in `main.tsx` wrapping `<App/>` (inside existing Redux `<Provider>`). `queryClient.ts` sets sane defaults: `staleTime: 30s`, `gcTime: 5m`, `retry: 1`, `refetchOnWindowFocus: false`.

**Dependencies added:** `@tanstack/react-query` (server state) and `@tanstack/react-virtual` (headless virtualization for the AsyncSelect option list — virtualization is mandatory per §5, so this is a required implementation detail, not new scope).

**Layering — do not rewrite axios/interceptors:**
```
axios instance + interceptor   (unchanged)
        ↓
<Entity>.api.ts   fetch/create/... fns  (thin, + normalizeId)
        ↓
<Entity>.queries.ts   useQuery / useInfiniteQuery / useMutation wrapping the api fns
        ↓
useServerTable / useAsyncOptions   (generic hooks built on the query hooks)
        ↓
DataTable / AsyncSelect / List / Form components
```

- **Server state → React Query.** Auth, theme, sidebar, and other client state → Redux/Context (unchanged).
- Query fns pass RQ's `signal` into axios (`{ signal }`) → **automatic request cancellation** (fixes the no-cancellation finding).
- **Caching/dedupe** come for free (fixes no-caching finding); revisiting a list or reopening a dropdown serves cache then revalidates.
- **Mutations** invalidate the relevant keys (§9) and use optimistic updates where safe.
- Rollout: Designation + Users adopt first; other modules migrate one at a time (both patterns can coexist because RQ wraps the same axios fns).

---

## 5. `AsyncSelect` + `useAsyncOptions`

Replaces `SelectDropdown` for every **relational** dropdown (Location, Designation, Department, roles, workflows, …). Static enums (`UserTypes`) keep the plain select.

### `useAsyncOptions` (built on `useInfiniteQuery`)
```ts
useAsyncOptions<T>({
  queryKey,                              // e.g. designationKeys.options
  fetchPage: (params) => Promise<{ options: Option[]; nextPage: number | null }>,
  resolveByIds?: (ids) => Promise<Option[]>,  // to label selected values not on page 1
  search: string,                        // current typeahead term (raw)
  pageSize?: number = 20,
  debounceMs?: number = 300,
  enabled?: boolean,                     // only fetch when dropdown is open
})
→ { options, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, resolvedSelected }
```
- **Debounce (~300ms) lives here**, in the query layer — the term is debounced before it becomes part of the query key, so it's identical for every dropdown and dedupes correctly.
- **Server typeahead + pagination:** each page = `fetch<Entity>Options({ search, page, limit })`. Infinite query appends pages; RQ caches each `(search,page)` (fixes "reuse recently fetched pages").
- `enabled: open` → **no fetch until the dropdown opens** (fixes eager load-on-list-mount).

### `AsyncSelect` component
```tsx
<AsyncSelect
  value={field.value}                 // id string (or string[] for multi)
  onChange={field.onChange}
  useOptions={useDesignationOptions}   // module supplies its bound useAsyncOptions hook
  placeholder="Select designation"
  multi={false}
  disabled={isReadOnly}
/>
```
Behavior (all mandatory):
- **Never loads all.** Options come page-by-page from the server.
- **Virtualized option list** (only visible options render) — infinite scroll triggers `fetchNextPage` near the bottom.
- **Debounced remote search** (300ms, via the hook).
- **Resolve-selected-by-id:** on mount with a `value` not present in the loaded pages, calls `resolveByIds` (or falls back to `fetch<Entity>ById`) so the current value shows its correct label when editing an existing record — even if it's on page 900.
- Loading / empty / error states inside the menu; keyboard accessible.
- RHF integration via `Controller` (same as today).

The `SelectDropdown` component is retained only for static enum lists; a lint note discourages passing server data to it.

---

## 6. `useServerTable`

Supersedes `useServerPagination`. One hook owns all list query state and feeds `DataTable`.

```ts
useServerTable<T>({
  queryKey,                            // entityKeys.list
  fetchList,                           // (params) => Promise<{ rows, total }>  (from .queries)
  initialPageSize?: number,
  initialSort?: { field: string; dir: "asc" | "desc" },
  initialFilters?: ListFilters,
  searchDebounceMs?: number = 300,
  capabilities: TableCapabilities,     // { canSort, canFilter, canBulkByFilter } — see §10
})
→ {
  rows, total, isLoading, isFetching, error,
  page, pageSize, setPage, setPageSize,
  sort, setSort,                       // no-op / disabled when !canSort
  filters, setFilter, clearFilters,    // includes tab selection as a filter
  search, setSearch,                   // debounced internally
  selection, tableProps,               // spread onto <DataTable/>
}
```
Requirements it satisfies:
- **Server pagination** (page/pageSize) — as today.
- **Server sort:** `setSort` sends `sortBy/sortDir`; only exposed when `canSort`, else sort headers are disabled (no client-only sort).
- **Server filters + tabs:** tabs (Active/Inactive) become `filters.status` params sent to the server — **not** client predicates over the current page. Tab **counts** come from a facet/count-by-filter endpoint (`canFacetCounts`, Ask #8); until it ships, tabs render **without counts** rather than showing single-page-derived numbers.
- **Debounced search** moves out of the view into this hook (300ms) so table + dropdowns behave identically.
- **Abortable fetch** via RQ `signal`.
- **"Select all matching filter":** exposes `selection` supporting both `{ ids }` (checkboxes on current page) and `{ filter, excludeIds }` ("select all N"). Bulk actions receive a `BulkSelection`; the client never enumerates ids for the filter case. "Select all matching" affordance shown only when `canBulkByFilter`.
- Memoized `tableProps`; stable callbacks to avoid re-renders.

`useServerPagination` is kept as a thin deprecated shim delegating to `useServerTable` until all modules migrate.

---

## 7. `DataTable` (new component; `AppDataTable` frozen as fallback)

We do **not** edit the 965-line `AppDataTable` in place — ~15 un-migrated modules depend on it, so editing it is exactly the blast radius we're avoiding. Instead:
- **`DataTable`** is a new component (`components/data/DataTable.tsx`) built to the standard, consuming `useServerTable`.
- **`AppDataTable` is frozen** (bug-fix only) and remains the fallback for un-migrated modules.
- **Retire `AppDataTable` when the last module migrates.**

**Guardrail — no copied logic.** The two components must not duplicate table plumbing. Genuinely shared internals are extracted into modules both consume:
- `components/common/table/tableTheme.ts` — `createAgTableTheme` (the ag-grid Quartz theme).
- `components/common/table/ServerPaginationFooter.tsx` — page-size select + range summary + First/Prev/Next/Last pager.
- `RowActionsCell` (exported from `AppDataTable`) — inline + overflow-menu row actions.
- All list/selection state lives in `useServerTable` (a hook), so it is shared by construction, not copied.
What legitimately stays component-local is presentational shell (header/toolbar) and the bulk-action bar (DataTable's uses the new `BulkSelection` model + "select all matching", which AppDataTable's does not).

`DataTable` specifics:
- Accepts the `useServerTable` return as `table`; wires ag-grid column sort to **emit `table.setSort`** only when `canSort` (else `sortable:false` — no client-only sorting).
- Server tabs map to filters; selection integrates with `BulkSelection`; a "Select all N matching" affordance appears only when `canBulkByFilter`.
- Replaces the leaky `searchAccessor` with an explicit `searchable?: boolean` — client-side filtering is removed entirely.
- Loading/empty/error use the shared state components (§8); row virtualization always on (no `autoHeight` foot-gun).

---

## 8. Shared cell renderers + column factory

`src/components/data/cells/`:
- `<AvatarCell name label sublabel />` — initials avatar + primary/secondary text (the repeated user/designation cell).
- `<StatusPill status />` — active/inactive/enabled pill (repeated in Users, etc.).
- `<TruncateCell value fallback="-" />` — truncated text with `-` fallback.
- `<TagListCell items max />` — the "+N more" roles/tags cell.

Each memoized. Column factories consume them:
```ts
// <Entity>.columns.tsx
export const getDesignationColumns = ({ t }): ColDef<Designation>[] => [ … ];
```
No inline cell JSX in module files; columns become unit-testable and consistent.

---

## 9. Non-functional standards

### States (one shared implementation each, `TableStates.tsx`)
- **Loading:** `<TableSkeleton rows columns />` shimmer on first load; on refetch, keep old rows + subtle top progress (RQ `isFetching`), no full-screen spinner.
- **Empty:** `<EmptyState title message action />` — consistent icon + optional "Create" CTA.
- **Error:** `<ErrorState message onRetry />` — retry calls RQ `refetch`. Replaces the ad-hoc red banner string.
- Dropdowns reuse compact variants inside their menus.

### Cache invalidation + optimistic updates (mutation rules)
Uniform across every module:
| Mutation | Optimistic? | On settle |
|---|---|---|
| `create<E>` | No (needs server id) | `invalidateQueries(keys.all)` |
| `update<E>` | Yes — patch cached row in the visible list + detail | invalidate `keys.detail(id)` + `keys.list` |
| `delete<E>` / `bulkDelete<E>` | Yes — remove rows from cached list; snapshot for rollback | invalidate `keys.list` |
| `bulkClone<E>` | No | invalidate `keys.list` |
| `enable/disable<E>` | Yes — flip status pill | invalidate `keys.list` |
- Optimistic updates snapshot previous cache and **roll back on error** (RQ `onError`), then `invalidate` on `onSettled` to reconcile with the server truth.
- After any mutation, lists stay correct without a manual `refresh` boolean — the old `refresh` / global `reFetch` flags are **removed**.
- Selection is cleared after a successful bulk action.

---

## 10. Capability / adapter layer (partial backend support)

We design to the **target** contract but never fake it. A single capabilities map gates UI affordances; each list module declares what its endpoint currently supports.

```ts
// src/lib/query/capabilities.ts
export interface TableCapabilities {
  canSort: boolean;          // server accepts sortBy/sortDir            (Ask #1)
  canFilter: boolean;        // server accepts filter[...]               (Ask #2)
  canBulkByFilter: boolean;  // batch endpoints accept { filter }        (Ask #3)
  canFetchById: boolean;     // GET /:id exists                          (Ask #4)
  canResolveByIds: boolean;  // resolve-by-ids for AsyncSelect           (Ask #5)
  canFacetCounts: boolean;   // count-by-filter / facet endpoint         (Ask #8)
}
export const DEFAULT_CAPS: TableCapabilities = {
  canSort: false, canFilter: false, canBulkByFilter: false,
  canFetchById: false, canResolveByIds: false, canFacetCounts: false,
};
// per-entity overrides as backend ships features:
export const CAPS: Record<string, TableCapabilities> = {
  designation:    { ...DEFAULT_CAPS },
  application:    { ...DEFAULT_CAPS, canFetchById: true },
  serviceRequest: { ...DEFAULT_CAPS, canFetchById: true },  // GET /:id exists today
};
```
- `useServerTable` / `AsyncSelect` read these and **hide** (not fake) unsupported affordances: no sort headers without `canSort`; no server tabs without `canFilter`; no "select all matching" without `canBulkByFilter`; `fetchById` falls back to the list row without `canFetchById`; AsyncSelect falls back to `search`-based label resolution without `canResolveByIds`; **tabs render without counts without `canFacetCounts`** (never counts derived from a single page).
- Every gap here has a matching row in BACKEND_ASKS.md. Closing an ask = flipping one flag.

---

## 11. Definition of a compliant module (preview of MIGRATION.md checklist)

- [ ] Folder = canonical layout (§1); no logic left in a fat `index.tsx`.
- [ ] `.api.ts` uses the exact naming table (§2); `bulkClone` calls `/bulk-duplicate`.
- [ ] Responses go through `normalizeId`; module reads `id` (no new `_id`).
- [ ] Server state via React Query hooks in `.queries.ts`.
- [ ] List uses `useServerTable` + `DataTable`: server pagination + sort + filters (behind caps), 300ms debounced search, virtualization, `BulkSelection` bulk actions.
- [ ] Every relational dropdown uses `AsyncSelect` (never load-all); selected value resolves by id when editing.
- [ ] Delete/bulk-delete use `ConfirmDialog` (no inline modal).
- [ ] Columns from `get<Entity>Columns` using shared cells.
- [ ] Skeleton / empty / error states from `TableStates`.
- [ ] Mutations follow the invalidation/optimistic table (§9); no `refresh` booleans.
- [ ] Capability flags declared; unsupported affordances hidden; gaps logged in BACKEND_ASKS.md.

---

## 12. Reference build order (Phase 3, on approval)

1. Add React Query + provider + `queryClient`, `normalizeId`, `capabilities`.
2. Build shared primitives: `ConfirmDialog`, `TableStates`, shared cells, `useServerTable`, `useAsyncOptions`, `AsyncSelect`, evolve `AppDataTable`→`DataTable`.
3. Refactor **Designation** to the standard (gold reference: simple CRUD + bulk clone/delete).
4. Refactor **System IT Admin → Users** (proves dropdowns: Location/Designation/Department via AsyncSelect; server tabs behind caps).
5. Short change-note per module.

Then Phase 4 MIGRATION.md generalizes it for the rest.
