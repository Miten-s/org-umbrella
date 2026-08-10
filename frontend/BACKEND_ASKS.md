# Backend Asks — capability gaps for frontend scale

_Living document. The frontend standard degrades gracefully behind capability checks (see STANDARDS.md §10); each item below is a gap that currently forces the UI to **hide** an affordance rather than fake it. Close an item → flip the capability flag → the UI lights up. No frontend rewrite needed per item._

Legend: 🔴 blocks a scale requirement · 🟠 degrades UX · 🟡 consistency/cleanup

---

## Probed current contract (baseline)

Every list endpoint accepts `page`, `limit`, `search`. Some GXP endpoints additionally accept a boolean `includeDisabled` / `includeInactive`. Batch ops are id-list based (`POST {route}/bulk-delete` and `/bulk-duplicate` with `{ ids: string[] }`). `GET {route}/:id` exists only for `gxp-applications` and service requests.

---

## Asks

### 🔴 1. Server-side sort on all list endpoints
Accept `sortBy=<field>&sortDir=asc|desc`. Response unchanged.
- **Blocks:** correct sorting past the current page. Until shipped, column sort headers are **disabled** in `AppDataTable` (capability `canSort=false`).
- **Applies to:** every `get*` list route in `admin.service.ts` + `gxp.service.ts`.

### 🟠 2. Per-field filters on all list endpoints — ⚙️ PARTIALLY SHIPPED (users)

**Canonical spec (the template every list endpoint copies):**
- Query: `?filter[<field>]=<value>`; repeat a key for OR/array values: `?filter[status]=active&filter[status]=disabled`.
- Requires the **`extended` query parser** (`app.set("query parser", "extended")` — Express 5 defaults to `simple`, which does NOT parse brackets). Set globally in `app.ts`.
- Backend helper `getListFilters(req.query, allowedFields)` (in `pagination.util.ts`) returns `{ field: value | value[] }`, whitelisted per endpoint. Services apply only fields they support.

**Shipped:** `/auth/users` accepts `filter[status]=active|disabled` (`user.service.ts#getUsers` + `user.controller.ts`, whitelist `["status"]`). Frontend `CAPS.user.canFilter` flipped to `true` → Users Active/Inactive tabs are now live server-side.

**Still open (every other list endpoint):** apply `getListFilters` with each endpoint's whitelist as it migrates. Column filters beyond tabs also pending.
- **Note:** the existing `includeDisabled`/`includeInactive` booleans should be folded into this convention (`filter[status]`), keeping the boolean as a temporary alias.
- **Also still open for users:** `order`/sort is hard-coded `created_at DESC` (see Ask #1).

### 🔴 3. Filter-based batch delete/clone ("select all matching")
New mode for the existing batch endpoints: accept **either** `{ ids: string[] }` **or** `{ filter: {…}, excludeIds?: string[] }`.
```
POST {route}/bulk-delete     body: { filter: {...}, excludeIds?: [...] }
POST {route}/bulk-duplicate   body: { filter: {...}, excludeIds?: [...] }
```
- **Blocks:** "select all N matching filter" for datasets larger than one page. The client must **never** collect millions of ids. Until shipped, "select all matching" is **hidden**; only per-page id-based selection is offered (capability `canBulkByFilter=false`).
- **FE follow-up when shipped:** `useServerTable` currently collapses "all matching" to an explicit id set when a row is de-selected (tracked TODO in `useServerTable.ts`). Once this ask lands, enrich it to track `excludeIds` so "all N matching MINUS these" is preserved.

### 🟠 4. `GET {route}/:id` for every entity
Currently only Applications/Service Requests. Needed so edit/view can fetch the full record by id (deep-linking, and fields the list projection omits) instead of passing the list row object.
- Until shipped per module, that module falls back to editing from the list row (capability `canFetchById=false`).

### 🟠 5. Lightweight options endpoint for AsyncSelect (optional but preferred)
The paginated dropdowns will call the normal list endpoints with `search`+`page`+`limit`. That works. A slimmer projection (`GET {route}?fields=id,label` or `{route}/options`) returning only `{ id, label }` would cut payload for million-row references. Nice-to-have, not blocking.
- Also useful: **resolve-by-ids** `GET {route}?ids=a,b,c` (or `{route}/by-ids`) so AsyncSelect can label already-selected values in one request when editing. If absent, we fall back to N× `GET /:id` (needs #4) or a single `?search=` best-effort.

### 🟡 6. Uniform list envelope + canonical `id`
Confirm every list response is `{ <key>: T[], metadata: { totalCount, currentPage, limit, totalPages } }` and every entity carries UUID `id`. The frontend normalizes `id` and keeps `_id` as a temporary shim (STANDARDS.md §3), but a uniform server envelope lets us drop the `extractList` key-guessing heuristic.

### 🟠 8. Tab / facet counts (count-by-filter)
A count-by-filter or facet endpoint returning counts per filter value in **one** call, e.g.
`GET {route}/facets?field=status` → `{ active: 1240, disabled: 88 }` (or a general count-by-filter).
- **Blocks:** correct server-side tab counts (Users Active/Inactive). Without it we'd need one extra count-query per tab, or worse, single-page-derived counts (wrong). Until shipped, tabs render **without counts** (capability `canFacetCounts=false`).
- **Applies to:** any module with tabs (Users first).

### 🟡 7. Symmetric enable/disable
GXP entities have `PATCH {route}/enable/:id` + `/disable/:id`; admin entities don't. Decide whether admin entities need them (Users has a `status` field but no dedicated toggle route) so the `enable<E>`/`disable<E>` surface can be symmetric.

---

## Rule 1 (soft-delete uniqueness) — open items
- ☐ **GXP `:9001` backend**: apply the same partial-unique-index migration (`UNIQUE(<name>) WHERE deleted_at IS NULL`) to any GXP entity with a unique business field + clone (suppliers, workflows, environments, …) — the `backend/` migration `013` only covers location/department/designation.
- ☐ **Restore endpoint**: when a soft-delete restore is built, it must re-check for an **active** name collision before un-deleting (rename or reject). No restore endpoint exists today.

## Status tracker

| # | Ask | Priority | Backend status | FE capability flag |
|---|-----|----------|----------------|--------------------|
| 1 | Server sort | 🔴 | ☐ open | `canSort` |
| 2 | Field filters | 🟠 | ⚙️ partial — users `filter[status]` shipped | `canFilter` |
| 3 | Batch-by-filter | 🔴 | ☐ open | `canBulkByFilter` |
| 4 | `GET /:id` all entities | 🟠 | ☐ open (partial: applications + service requests) | `canFetchById` |
| 5 | Options/resolve-by-ids endpoint | 🟠 | ☐ open | `canResolveByIds` |
| 6 | Uniform envelope + `id` | 🟡 | ☐ open | — |
| 7 | Symmetric enable/disable | 🟡 | ☐ open | — |
| 8 | Tab / facet counts | 🟠 | ☐ open | `canFacetCounts` |
