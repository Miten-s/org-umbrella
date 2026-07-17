# Module Migration Guide

_Phase 4 deliverable. How to convert any remaining module to the standard — fast and identically._

Read first: [STANDARDS.md](./STANDARDS.md) (the target), [ANALYSIS.md](./ANALYSIS.md) (why), [BACKEND_ASKS.md](./BACKEND_ASKS.md) (capability gaps). Reference implementations: **Designation** (simple) and **Users** (dropdowns + conditional validation).

---

## 0. The hard rule (non-negotiable)

**Migration changes STRUCTURE ONLY** — file layout, naming, shared primitives, `id` normalization, server-driven table/dropdowns. It must **preserve all existing business logic and behaviour exactly**: autofill, every validation rule, cascading/dependent dropdowns, side effects, and workflows must behave **identically** after migration.

For every **Complex** module, its "special behaviour to preserve" list (below) **is the acceptance checklist** — verified via test or a documented click-through against pre-migration behaviour, before and after.

### Systemic hard rules (apply to every current & future module)

**Rule 1 — Soft-delete must be consistent with uniqueness + clone naming.**
Entities with a unique business field that are also soft-deleted (`paranoid`) must enforce uniqueness **only among active rows**, or soft-deleted rows block create/clone ("Duplicate value…").
- **Fix (chosen): a DB-level PARTIAL unique index** `UNIQUE (<name>) WHERE deleted_at IS NULL`, replacing the full unique constraint/index. Chosen over an app-level check because uniqueness belongs in the DB and app checks race. Implemented for `locations`, `departments`, `designations` in `backend/migrations/013-partial-unique-active-names.ts`.
- **Clone naming** must produce a name unique **among active rows** (the existing `X-(n)` generator already queries active-only via `paranoid`, so it now succeeds once the partial index is in place).
- **Restore paths** (if/when added) must re-check for an active-name collision before un-deleting (rename or reject). No restore endpoint exists today.
- **Entities with a unique business field (apply this rule when migrating each):** `location` (locationName), `department` (departmentName), `designation` (designationName) — fixed. Also unique: `role`/`permission` (name), `user` (email) [auth-side, not clone]. **GXP entities live in the separate `gxp-service` backend** (`:9001`) — apply the same partial-index migration there for any GXP entity with a unique field + clone (e.g. suppliers, workflows, environments).

**Rule 2 — Exactly one toast per outcome (single source of truth).**
- **Errors:** the **axios interceptor is the sole owner** of error toasts — it shows the server's message once (skips 404 / "Token not found"). **Mutations must NEVER toast `onError`** (they may still roll back optimistic state). This was the double-toast root cause.
- **Success:** owned **solely by the mutation layer** (`.queries.ts` `onSuccess`). `.api.ts` functions are pure HTTP and perform **no** toasting. Exactly one success toast per action (created / updated / deleted / cloned / enabled / disabled), consistent client-side wording (i18n-ready), not the raw server message.
- This is Designation's pattern; replicate identically. Never add an `onError` toast to a mutation; never toast success in `.api.ts`. Keeping success in one layer (mutations) prevents the split that reintroduces double/inconsistent toasts.

**Rule 3 — User-friendly validation, never raw machine strings (S1).**
- (a) **Client-side first:** zod schemas must encode the server's rules so they fail **inline on the field** before submit, with friendly messages (e.g. an integer-≥1 count, a non-empty list). Build any server-shape transform (e.g. comma-string → array + count) in the form's submit, not in the user's face.
- (b) **Server errors readable:** the shared `getErrorMessage` (`utils/error.utils.ts`) is the single formatter — it prefers a `{ errors: [...] }` list, joins + humanizes field-machine messages, and never surfaces a bare "Validation failed". The interceptor (sole error-toast owner) uses it, so every module benefits automatically.

**Rule 4 — No double-submission on any API-triggering control (S2).**
- Every action button shows the common `Button` **loading state (disabled + spinner)** while its mutation is in flight — never just disabled. Form submit via `loading`; `ConfirmDialog` confirm (internal click-lock + `loading`); `DataTable` bulk-bar buttons auto-track the running action and spin it; the status toggle uses `StatusToggleCell` (spinner keyed by `togglingId = mutation.variables.id`). `DataTable`'s **`busy`** prop (`create||update||bulkClone||bulkDelete||toggle .isPending`) disables the rest.
- Each mutation-firing handler has a backstop: `if (mutation.isPending) return;` (used for the toggle handler).

---

## 1. Module inventory

Scope: the two main areas. `done` = migrated to the standard. Type: **Simple CRUD** (list + create/edit/delete + bulk, no special logic) vs **Complex** (autofill, cascading/dependent dropdowns, conditional/cross-field validation, multi-step, or business logic beyond CRUD). Relational dropdowns → need `AsyncSelect`.

### System IT Administration

| Module | Path | Status | Type | Relational dropdowns | Special behaviour to preserve |
|---|---|---|---|---|---|
| Designation | `pages/system-it-admin/designations` | ✅ done | Simple | none | none |
| Users | `pages/system-it-admin/users` | ✅ done | Complex | Location, Designation, Department | userType=Admin hides User-only fields; conditional required (location/designation/department) when userType=User; password strength + confirm-match rules on create only; signature capture |
| Departments | `pages/system-it-admin/departments` | ✅ done | Simple | **Manager** (User), **Location** | none (structurally simple; 2 dropdowns) |
| Locations | `pages/system-it-admin/locations` | ✅ done | Simple | none | none |

### GXP Service

| Module | Path | Status | Type | Relational dropdowns | Special behaviour to preserve |
|---|---|---|---|---|---|
| Users (GXP Service) | `pages/gxp-service/users` | ✅ done | Simple ⚠️ | **User** (platform user), **Roles** (multi) | **separate** from System IT Admin Users (uses `getGxpUsers`); both dropdowns converted from load-all `{limit:100}` → `AsyncSelect` (User: `useUserOptions` + `onChangeOption` for the `{id,name}` payload; Roles multi: `useGxpRoleOptions`, seeded from record `{id,name}`); enable/disable toggle; includeDisabled toggle |
| Suppliers | `pages/gxp-service/suppliers` | ✅ done | Simple | none | per-row enable/disable status toggle (optimistic); **"Include disabled" toolbar toggle** (`includeDisabled` filter param); bulk clone + bulk delete |
| Workflows | `pages/gxp-service/workflows` | ✅ done | Simple | none | enable/disable; bulk clone/delete |
| Environments | `pages/gxp-service/environments` | ✅ done | Simple | none | enable/disable; bulk clone/delete |
| Application/Software Module | `pages/gxp-service/application-software-module` | ✅ done | Simple | **Application** (parent) | enable/disable; bulk clone/delete |
| Assignment Groups | `pages/gxp-service/assignment-groups` | ✅ done | Simple ⚠️ | **Users** (multi-select members) | enable/disable; **multi-select member resolve-by-id** (see §4 — verify members returned nested `{id,name}`; if not, needs Ask #5 before migrating) |
| Roles & Permissions (GXP) | `pages/gxp-service/roles-and-permissions` | ✅ done | **Complex** | none | Role form: permissions grouped by type; "select all", per-group toggle, per-permission toggle; permissions persisted as id array. (Permissions sub-list itself is Simple.) Two entities in one folder (Roles + Permissions). |
| Add New Application | `pages/gxp-service/add-new-application` | ✅ done | **Complex** | 11 refs: Suppliers, Environments, Assignment Groups, Workflows, App Software, App Roles, Departments, Locations, Service Types, Users, App Groups | Large multi-section form; **edit/view autofill** via `getApplicationById(id)` populating every field; each ref dropdown → AsyncSelect with label seeded from the fetched record |
| Create New Service Request | `pages/gxp-service/create-new-service-request` | ✅ done | **Complex** | 7 refs: Applications, App Software/Modules, App Roles, Assignment Groups, Environments, Workflows, Locations | **Heavy autofill + cascade** (see §6.1) |

> Other areas (`access-management`, `company-management`, `my-space`) are out of this inventory's scope; migrate later using the same tracks if desired.

---

## 2. Two tracks

### Track A — Simple CRUD (fast, parallelizable)
Follow the §3 checklist mechanically. These can be done in parallel by different people. Relational dropdowns are part of the mechanical path (swap to `AsyncSelect` per §4). No behaviour-diffing needed beyond the DoD.

**Track A queue:** Departments, Locations, Suppliers, Workflows, Environments, Application/Software Module, Assignment Groups.

### Track B — Complex (one at a time, behaviour-verified)
Do **not** run these through the fast path. For each: (1) capture current behaviour (click-through notes or a test) using its "special behaviour" row as the checklist, (2) migrate structure, (3) re-verify each behaviour item is identical. One module per PR.

**Track B queue:** Roles & Permissions (GXP), Add New Application, Create New Service Request.

---

## 3. The migration checklist (per module)

Copy the canonical layout into the **existing folder** (STANDARDS §1 — no relocation):

```
<Entity>.types.ts   <Entity>.api.ts   <Entity>.queries.ts   <Entity>.columns.tsx
<Entity>.schema.ts  <Entity>Form.tsx  <Entity>List.tsx      index.tsx (+ index.legacy.tsx)
```

1. **Preserve legacy** — `cp index.tsx index.legacy.tsx` (reversible cutover; keep until live-verified).
2. **`.types.ts`** — move/define the row + payload types. Canonical `id`; keep `_id` only as the shim comment. Delete duplicated inline interfaces.
3. **`.api.ts`** — thin axios wrappers, exact names: `fetch<E>List`, `fetch<E>ById` (if `canFetchById`), `create<E>`, `update<E>`, `delete<E>`, `bulkDelete<E>`, `bulkClone<E>` (→ `/bulk-duplicate`), `enable<E>`/`disable<E>` where they exist, `fetch<E>Options` (for AsyncSelect). List/detail responses go through `toListResult`/`toOptionsPage` (which call `normalizeId`). Use the correct axios instance (**`gxpApi` for GXP**, `api` for admin).
4. **`.queries.ts`** — `<entity>Keys`, mutation hooks (`useCreate…`, `useUpdate…`, `useDelete…`, `useBulkDelete…`, `useBulkClone…`), and `use<E>Options` if other modules select this entity. Invalidate `keys.all` on success; follow the §9 optimistic/invalidation table. **Toasts (Rule 2):** exactly one SUCCESS toast per action owned here (or in `.api`); **no `onError` toast** — the interceptor owns errors.
5. **`.schema.ts`** — move the zod schema out of `lib/schema.ts`. **Copy validation rules verbatim** (hard rule).
6. **`.columns.tsx`** — `get<E>Columns(ctx)` using shared cells (`AvatarCell`, `StatusPill`, `TruncateCell`, `StatusToggleCell`). **Any multi-item array in a cell (roles, tags, members, permissions) MUST use `TagListCell`** (`components/data/cells/`) — inline items + "+N" hover overflow — so overflow behaves identically everywhere. No inline cell JSX.
7. **`<E>Form.tsx`** — RHF + zod; **every relational dropdown → `AsyncSelect`** (§4); static enums keep `SelectDropdown`. Preserve all conditional fields/validation.
8. **`<E>List.tsx`** — `useServerTable({ entity, queryKey, fetchList })` + `DataTable`; toolbar/row/bulk actions; `ConfirmDialog` for delete; tabs (if any) as server filters. **No `refresh`/`reFetch` flags.**
9. **`index.tsx`** — one-line `export { default } from "./<E>List"`.
10. **Capabilities** — add the entity to `CAPS` with honest flags (probe the backend; default all-false).
11. **Verify** — `tsc -b` (0 new errors), tests, `vite build`; then live click-through. Delete `index.legacy.tsx` + the old modal/schema only after live sign-off.

---

## 3.1 Addenda (gaps found during the Departments + Suppliers validation runs)

These weren't obvious from the base checklist; bake them in.

**A. Cross-module options dependency.** Before migrating a module with relational dropdowns, confirm **each referenced entity exposes a `use<E>Options` hook**. If not, add it to that entity's module first (small, forward-compatible): a `fetch<E>Options` in its `.api.ts` (via `toOptionsPage`) + a bound `use<E>Options` in its `.queries.ts`. _Found: Departments' Manager dropdown required `useUserOptions`, which the Users module didn't yet export._

**B. Fold interim `*.options.ts` seeds.** An entity may already have a temporary `<E>.options.ts` (created so an earlier module could select it before this entity was migrated). When migrating that entity, **move its fetcher into `.api.ts` and its hook into `.queries.ts`, delete the seed file, and repoint importers**. _Done for `Department.options.ts` → `Department.queries.ts` (repointed `UserForm`)._

**C. Interactive column cells.** When a column renders an interactive control (e.g. a status `Switch`), keep the column factory pure by **injecting the handler**: `get<E>Columns({ t, onToggleStatus })`. The mutation lives in the List, not the columns.

**D. enable/disable status toggle (GXP).** For `enable<E>`/`disable<E>`, add a single `useToggle<E>Status` mutation that flips based on current status and does an **optimistic** update (STANDARDS §9): `onMutate` patches every cached list via `setQueriesData({ queryKey: <e>Keys.all })`, snapshot for rollback in `onError`, `invalidateQueries` in `onSettled`. This preserves the pre-migration snappy toggle.

**E. "Include disabled" / status toolbar toggle (GXP).** Several GXP list endpoints accept a bespoke `includeDisabled` param. Preserve it as a toolbar toggle owned by the List: hold `const [includeDisabled, setIncludeDisabled] = useState(false)`, put it in the table's **`queryKey`** (`[...<e>Keys.all, { includeDisabled }]`) so flipping refetches, and pass a `fetchList` closure `(params, signal) => fetch<E>List(includeDisabled, params, signal)`. Render the toggle via DataTable's `titleExtra`. _Applies to Suppliers, Environments, Assignment Groups, Application/Software Module._

**G. Object-valued dropdowns (AsyncSelect additive API).** When a field stores `{ id, label }` objects rather than bare ids (e.g. Assignment Group's `manager: {userId,name}` and `members: [{userId,name}]`), use `AsyncSelect`'s additive callbacks: `onChangeOption?: (opt|null)` (single) / `onChangeOptions?: (opts[])` (multi), which fire **alongside** the required `onChange` with the full `{value,label}`. Pass a no-op `onChange` and build the object in the additive callback; seed labels on edit via `initialSelectedOptions`. Additive & backward-compatible — id-only consumers (Users, Departments, …) are unaffected.

**F. GXP axios instance.** GXP `.api.ts` files import `gxpApi` (`utils/gxp.axios.interceptor`, different base URL), not `api`. Already in the checklist (step 3) — re-flagged because it's easy to miss.

---

## 4. Dropdown resolve-decision tree

For each relational dropdown, choose how the **currently-selected value's label** is resolved when editing (so it shows correctly even for values deep in the dataset):

```
Does the parent record already carry the selection as nested { id, label }?
│  (e.g. user.designation = { id, designationName })
├─ YES →  seed AsyncSelect via `initialSelectedOptions={[{ value: id, label }]}`   ← ZERO fetch. Preferred.
│
└─ NO → Is `canResolveByIds` true for that entity (Ask #5)?
        ├─ YES → pass `resolveByIds` to its options hook → labels fetched in one call.
        └─ NO → Is `canFetchById` true (Ask #4)?
                ├─ YES → fetch the option by id (fallback).
                └─ NO → last resort: rely on search; file/September the gap in BACKEND_ASKS.
```

Rule of thumb: **list endpoints already return relations nested** (verified for users/departments), so the seed path covers most modules with zero extra requests.

---

## 5. Definition of done (per module)

- [ ] Canonical file layout in place; `index.tsx` is a one-liner; `index.legacy.tsx` preserved until live-verified.
- [ ] Naming exact (`fetch<E>List`, `bulkClone<E>`, …); correct axios instance.
- [ ] Responses normalized (`id`); no new `_id` reads in the module.
- [ ] Server state via React Query hooks; **no `refresh`/`reFetch` flags**.
- [ ] **Rule 2 — one toast per outcome:** exactly one success toast per action; **no mutation `onError` toast** (interceptor owns errors). Verified no double/missing toast.
- [ ] **Rule 1 — soft-delete uniqueness:** if the entity has a unique business field, the partial-unique-index migration is applied and bulk-clone succeeds after delete+recreate.
- [ ] **Rule 3 — friendly validation:** client zod fails inline with friendly messages; no raw field-machine strings or bare "Validation failed" in toasts.
- [ ] **Rule 4 — no double-submit:** all mutation-triggering buttons show the common `Button` loading state (**disabled + spinner**) while in flight — bulk-bar buttons (auto-tracked by `DataTable`), `ConfirmDialog` confirm, form submit, and the status toggle (`StatusToggleCell` swaps the `Switch` for an inline spinner via `togglingId`). `busy` still disables the rest; toggle handler keeps its `isPending` backstop.
- [ ] List: `useServerTable` + `DataTable` — server pagination, sort/filter/tabs behind caps, 300ms debounced search, virtualization, `BulkSelection` bulk actions.
- [ ] Every relational dropdown uses `AsyncSelect` (never load-all); selected label resolves per §4.
- [ ] Delete/bulk-delete via `ConfirmDialog`.
- [ ] Columns from `get<E>Columns` using shared cells.
- [ ] Skeleton / empty / error states (DataTable default).
- [ ] Capability flags declared honestly; unsupported affordances hidden.
- [ ] **Behaviour preserved** — every validation + (Complex) every "special behaviour" item verified identical to pre-migration.
- [ ] `tsc -b` clean, tests pass, `vite build` clean, live click-through done.

---

## 6. Complex-module playbooks (Track B)

Each below is migrated alone, with the bullet list as its before/after acceptance checklist.

### 6.1 Create New Service Request — the autofill + AsyncSelect seam

**Behaviours to preserve (verify each before & after):**
- Select **Application** → fetch app details → auto-fill: `requestType`/`serviceRequestTypes`, `applicationEnvironment`, `assignmentGroup`, `groupLocation`, `applicationWorkflow`, `applicationModules`, `applicationRoles`, `notes`.
- Select **Assignment Group** → auto-fill `groupLocation` (mapped from the group's location).
- **Change Application** → reset dependent fields (environment, assignmentGroup, groupLocation, workflow, modules, serviceRequestTypes, roles, notes) then re-fill from the new app's details.
- `requestType` **Provide-access vs Modify-access** conditional behaviour (affects `applicationRoles` handling).
- `trainingDone` toggle.

**The seam (critical):** when Application auto-fills the dependent dropdowns, each dependent field is set **by id** and its `AsyncSelect` must show the right **label**. Source the label from the app-details response — it should carry `{ id, label }` for each dependent (environment, assignmentGroup, workflow, modules, roles). Feed those into each `AsyncSelect` via `initialSelectedOptions` (the Users nested-seed pattern, §4). If app-details returns only ids, resolve via that entity's `resolveByIds`/`fetchById`, or co-fetch the labels — **document which per field**. A dependent dropdown that shows a raw id after autofill is a migration defect.

### 6.2 Add New Application — behaviour inventory (verified by code read)

**Nature:** Complex by **volume**, NOT cascade. It is a large single multi-section form with **~12 relational dropdowns**. There is **no field→field cascade**; on view/edit the whole form is bulk-populated from one fetch. (Contrast §6.1 Service Request, which cascades.)

**Structure:** `index.tsx` = applications list. View/Edit → `getApplicationById(id)` → `setActiveApplication(full)` → modal `reset(normalizedDefaults)` populates **every** field at once. Create/update: `createApplication(payload, newAttachments)` / `updateApplication(id, payload, newAttachments)` — attachments are a second argument, not part of the JSON payload.

**Relational dropdowns (ALL load-all `{limit:100}` today → each must become `AsyncSelect`):**

| Field | Kind | Entity | Options hook |
|---|---|---|---|
| `applicationEnvironment` | single | Environments | `useEnvironmentOptions` *(new)* |
| `group` | single | Application Groups | `useApplicationGroupOptions` *(new)* |
| `assignmentGroup` | single | Assignment Groups | `useAssignmentGroupOptions` *(new)* |
| `applicationWorkflow` | single | Workflows | `useWorkflowOptions` *(new)* |
| `applicationSystemOwner` | single | Users | `useUserOptions` ✓ |
| `applicationProcessOwner` | single | Users | `useUserOptions` ✓ |
| `supplier` | single | Suppliers | `useSupplierOptions` *(new)* |
| `applicationRoles` | multi | Application Roles | `useApplicationRoleOptions` *(new)* |
| `applicationGroups` | multi | Application Groups | `useApplicationGroupOptions` *(new)* |
| `applicationServiceRequestTypes` | multi | Service Types | `useServiceTypeOptions` *(new)* |
| `applicationModules` | multi | App Software Modules | `useModuleOptions` *(new)* |
| `departments` | multi | Departments | `useDepartmentOptions` ✓ |

`applicationType` is a **static enum** SelectDropdown → keep. **~8 new options hooks** to add (one per entity module, mirroring the existing pattern). `useApplicationOptions` already exists (add-new-application/Application.options.ts).

**Other fields:** `applicationName` (text), a read-only identity/moduleId display, `notes` (**TextArea, required**), `attachments` (file upload — new + existing), `status` (Switch).

**Special behaviour to preserve:**
- **Bulk autofill on edit** via `reset(normalizedDefaults)` from `getApplicationById` — assert every field maps unchanged.
- **`mergeOptions(base, extra)` + `normalizeMultiSelectValues`** — the old code merged the record's currently-selected options into the loaded option list so edit shows labels, and normalized MultiSelect values (`{value}` objects ↔ strings). **With `AsyncSelect` this is replaced by `initialSelectedOptions` seeded from the record's populated refs** — so **confirm `getApplicationById` returns each ref as `{id, name}`** (not bare ids); if any ref is id-only, that dropdown needs `resolveByIds`/`fetchById` (BACKEND_ASKS #4/#5).
- **`applicationModules` in the payload sets the application on those modules** (the counterpart to A3's manual-create path) — preserve exactly.
- Attachments: preserve new-vs-existing handling and the `(payload, attachments)` call shape.

**Resolve-selected seam (the risk):** ~12 dropdowns must show correct labels on edit. Primary mechanism = seed from `getApplicationById`'s nested refs. Per-field, document where the label comes from; a dropdown showing a raw id after edit is a defect.

### 6.3 Roles & Permissions (GXP)

**Structure (verified by live-code read):**
- `index.tsx` is a **tabbed shell** (Roles | Permissions) rendering `Roles.tsx` + `Permissions.tsx` — two entities in one folder on `useServerPagination`/`AppDataTable`.
- **Roles form is SHARED:** `Roles.tsx` renders `@/pages/access-management/roles-and-permissions/CreateRoleModal` — the **same** modal access-management's own roles page uses. The local `CreateGxpRoleModal.tsx` is **dead code** (imported nowhere).
- **Permissions form is local:** `Permissions.tsx` renders `CreateGxpPermissionModal.tsx` (live).

**Behaviours to preserve:**
- Role form (shared `CreateRoleModal`): permissions **grouped by name/entity**; "Select all" toggles every permission; per-group toggle; per-permission toggle; permissions persisted/edited **by name** (`activeRole.permissions.map(p => p.name)`), stale-permission pruning on load.
- Roles list: create/edit/view/delete/bulk-delete; loads all permissions to feed the modal (`getGxpPermissions`).
- Permissions list: CRUD + bulk delete; **mixes services/constants** — `getGxpPermissions`/`createGxpPermission` (gxp.service) + `bulkDeletePermissions` (admin.service) + `ADMIN_PERMISSIONS.*` gating; persists `type: PermissionType.GXP_SERVICE`.

**Resolved & migrated (structure-only):**
- Kept the **shared `CreateRoleModal`** as a read-only dependency (decision (a)) — not forked, not modified. `RoleList` maps permission names↔ids exactly as before; `useRolePermissions` preserves the `limit:100` permission load for the picker.
- **Deleted dead `CreateGxpRoleModal.tsx`** (grep-confirmed no importers).
- `index.tsx` stays the **tabbed shell** → `RoleList` + `PermissionList`; legacy `Roles.tsx`/`Permissions.tsx` retained for the `index.legacy.tsx` rollback path.
- Permissions kept on **admin services + `ADMIN_PERMISSIONS` gating**, type `GXP_SERVICE`, wired exactly as-is; `CreateGxpPermissionModal` reused as the form.

---

## 7. Sequencing with the 🔴 scale asks

Structure migration and the scale backend asks proceed **in parallel** so both finish together:
- **#1 sort**, **#2 filters** (⚙️ users shipped), **#3 batch-by-filter** are what make "millions of records" truly complete.
- Migrated modules already consume these behind capability flags — when an ask ships, flip the entity's flag and the affordance lights up with **no module rewrite**. Keep asks moving alongside the Track A/B queues.
