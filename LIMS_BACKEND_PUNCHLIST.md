# LIMS Backend — Punch List

Review of branch **`sp/lims-service`** against [LIMS_BACKEND_SPEC.md](./LIMS_BACKEND_SPEC.md).

---

# ROUND 2 — after `fb71cbd` (users, roles, scheduling, result versioning)

Merged, built and run against the live service. **Big step forward** — nine items closed:

| Closed | What you did |
|---|---|
| **B1** | `bulk-delete`, `bulk-duplicate`, `restore/:id`, `GET /:id/audit` all added |
| **B2** | `lims-groups`, `lims-roles`, `lims-users`, `lims-schedulers` all return 200 |
| **M1 / M3** | every route is now `/lims-*`, and `/stock` → `/lims-stocks` |
| **M2** | `PATCH /:id` served alongside `PUT` |
| **B4** (half) | `formatLimsEntity` emits `isRemoved` and `modifiedOn` |
| **B3** (mostly) | far more repos now `include` their relations |
| **G0** | `import "reflect-metadata"` added to `app.ts` |
| **G5** | audit is at `/:id/audit` and returns `{ audit: [...] }` — exactly our shape |
| **G1** (partly) | `bulkSoftDelete` records `oldValue` |

I have deleted the matching translation from our compatibility shim.

## 🔴 But seven entities are now completely broken

**You renamed the DTOs but not the models, and nothing maps between them.**

`CreateSupplierDto` requires `supplierName` / `email` / `description`. `ISupplier` still has
`name` / `contactEmail` / `notes`. `createSupplier` passes the DTO straight to
`Supplier.create()`, so **both spellings fail**:

```
POST /lims-suppliers {"name":"Merck"}          -> 400  supplierName should not be empty
POST /lims-suppliers {"supplierName":"Merck"}  -> 400  Supplier.name cannot be null
```

Verified live — **create is impossible** for:

`lims-suppliers` · `lims-customers` · `lims-locations` · `lims-batches` · `lims-lots` ·
`lims-samples` · `lims-stocks`

**Fix:** finish the rename in the models + a migration, or map DTO → model in the service.
Renaming the models is better — it also fixes the next item.

## 🔴 Requests and responses now disagree

Requests are validated against the **new** names, responses are serialised from the **old**
ones. `POST` wants `supplierName`; `GET` returns `name`. Any client has to speak two
vocabularies for one entity. This is the single most important thing to fix — until it is,
we cannot finish our field mapping, because there is no stable target.

## 🔴 `restore/:id` can never succeed

```ts
const record = await repo.getTestGroupByIdRepo(id);   // filters isDeleted: false
if (!record) throw 404;
```

The lookup excludes removed rows, so restoring one always 404s. Confirmed live. Same shape in
every entity service. **Fix:** look the record up with `isDeleted: true` (or unscoped).

## 🔴 `bulk-duplicate` 500s on every entity

```ts
const record = await Model.findOne({ where: { id, isRemoved: false } });
```

`isRemoved` is not a column — it only exists on the formatted output. Live result:
`{"error":"column TestGroup.isRemoved does not exist"}`. Note the uniqueness check five lines
below correctly uses `isDeleted`. **Fix:** one word.

## 🟠 `query.util.ts` is written but never called

`parseListQuery` correctly handles `sortBy`, `sortDir`, `filter[...]` and `includeRemoved`,
and `app.set("query parser", "extended")` is in place — nice. But **0 of 30 controllers call
it**; all 30 still use `getPaginationOptions`, which reads only `page` and `limit`.

The repos were updated to accept the parameters, and nothing passes them. Several repos also
still hardcode `order: [["name","ASC"]]`, so `sortBy` would be ignored even if it arrived.

Confirmed dead live — **`sortBy`, `sortDir`, `filter[]`, `includeRemoved` and `search` all do
nothing.** Wiring the controllers to `parseListQuery` closes M5, M6, B4 and G4 in one pass.

## 🟠 Still open from round 1

- **G1** — `oldValue` is still `null` for `PUT`/`PATCH` (bulk delete does it right; copy that).
- **G3b** — pagination still miscounts with a `hasMany` include: `/lims-phrases?limit=10`
  returns **5 rows** with **`totalCount: 15`** against 5 phrases. Needs `distinct: true`.
- **G0** — `reflect-metadata` is imported but **still not in `package.json`**, so a fresh
  `npm ci` will not install it and the service will not boot. One line.
- **G0b** — messages still render `"{{ entity }} created successfully"` (template uses
  `{{ entity }}`, `getMessage` replaces `{{entity}}`).
- **G7** — `UpdateXDto extends CreateXDto`, so partial updates are still rejected.
- **G8** — rate limit still 100/min keyed by IP.
- **G9** — still no authorization, only authentication.
- **S2** — sub-forms nested vs standalone: still undecided, still blocking 12 of our modules.

## Suggested order

1. Finish the model rename (unblocks 7 entities and settles the request/response split)
2. `restore` lookup + `bulkDuplicate` `isRemoved` → `isDeleted` — two tiny fixes
3. Wire the controllers to `parseListQuery` — closes four items at once
4. `reflect-metadata` into `package.json`
5. `distinct: true`, `oldValue` on update, the `{{entity}}` typo
6. Answer **S2**

---

# ROUND 1 — original review

Review of branch **`sp/lims-service`** against [LIMS_BACKEND_SPEC.md](./LIMS_BACKEND_SPEC.md).

**Verdict: integrated, with gaps.** The branch is merged and the frontend now talks to the
running service. The CRUD skeleton is solid — 188 files, 30 models, 7 migrations, Postgres +
Sequelize, audit logging, and the auth middleware **correctly verifies the JWT** (thank you —
that was a specific ask). CORS for `localhost:3000` is correct, and create / read / update /
delete / audit all round-trip.

**111 of 142 endpoints are wired.** What is missing is the second half of the contract —
batch operations, restore, nested relations, sort and filter — plus four entities that have
no backend at all. Details below.

**One thing blocks a clean start: G0 — the service does not boot as committed.** Please fix
that first.

Items are ordered by impact. §refs point at the spec section that describes the target.

---

## 🔴 Blockers — the frontend cannot work without these

### B1. Six endpoints per entity are missing (spec §2)

Every entity route currently has five: `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`.

| Missing | Current state | What breaks in the UI |
|---|---|---|
| `POST {route}/bulk-delete` | `BULK_DELETE` declared in `utils/routes.ts`, wired to nothing | Bulk delete on all 26 tables |
| `POST {route}/bulk-duplicate` | does not exist | Copy / bulk clone everywhere |
| `PATCH {route}/restore/:id` | `RESTORE` declared, wired to nothing | Restore + the "Show removed" toggle |
| `GET {route}/:id/audit` | different shape — `GET /audit/:entityName/:entityId` | Per-record audit dialog |
| `PATCH {route}/enable/:id` · `disable/:id` | does not exist | Status toggles (entities with status only) |

Bodies are in spec §2. Note `bulk-delete` and `restore` both take `{ changeReason }` — see B4.

### B2. Four entities have no backend at all

`users`, `roles`, `groups`, `schedulers`. No models, repos, routes or migrations.
`LIMS_USERS` is commented out in `routes/common.router.ts`.

**`groups` is the urgent one** — almost every other table carries `group_id` and there's
no CRUD to populate it, so every Lab Group dropdown in the app is empty.

- `groups` → spec §5
- `roles` → spec §5 **and see D1 below**, the model needs settling first
- `users` → **see D2**, the shape changed
- `schedulers` → spec §5c (also needs a job runner)

### B3. Relations come back as bare UUIDs — **partly wrong, corrected**

I originally wrote that this applies to every relation on every entity. It does not, and I
should have checked more than one repo. **19 repos already `include` the relation** with
`attributes: ["id", "name"]`, which is exactly the shape we need — thank you, that is the
right pattern.

Verified live: `GET /projects` returns `"customer": { "id": "…", "name": "Acme Pharma" }`.

It applies to the **9 repos that have no `include`** — these still return bare UUIDs:

`suppliers`, `customers`, `instruments`, `stock`, `stock-parameters`, `batches`,
`specifications`, `test-groups`, `inspection-plans`

Please extend the same `include` pattern to those. Two notes for consistency:

- Alias naming varies — locations nests the parent as `parent`, aliquots nests the stock
  batch as `batch`. Anything is fine as long as it's stable; we map on our side.
- Sequelize emits both `customerId` and `customer_id` on the row. Harmless, but
  `underscored: true` plus explicit `field:` is double-declaring.

The original problem statement, which still holds for those 9:

`getAllSuppliersRepo` does `findAndCountAll` with no `include`, so a row returns
`ratingPhraseId` / `groupId` rather than the nested object.

```jsonc
// what we get
{ "id": "…", "name": "Merck", "ratingPhraseId": "8f2c…", "groupId": "a91b…" }

// what the frontend needs
{ "id": "…", "name": "Merck",
  "rating": { "id": "8f2c…", "name": "Preferred" },
  "group":  { "id": "a91b…", "name": "QC Lab" } }
```

Without the nested form, **every dropdown shows a raw UUID when you open a record for
editing.** This applies to every relation on every entity.

### B4. Soft delete is one-way (spec §3, §4)

- Model uses `isDeleted`; the frontend reads **`isRemoved`**.
- There is no **`includeRemoved`** query param — deleted rows are always filtered out,
  so removed records can never be listed or restored.
- Update/delete/restore must accept **`changeReason`** in the body and write it to the
  audit row. GxP compliance requires the "why" on every change.

---

## 🟠 Contract mismatches — cheap, but must be agreed

| # | Item | Backend now | Spec / frontend | Suggested owner |
|---|---|---|---|---|
| M1 | Route prefix | `/suppliers` | `/lims-suppliers` | **Either** — say which and we align |
| M2 | Update verb | `PUT /:id` | `PATCH /:id` | Backend (or we switch — tell us) |
| M3 | Stock route | `/stock` | `/lims-stocks` | Backend — plural, for consistency |
| M4 | List envelope | `{ data: [...], metadata }` | `{ suppliers: [...], metadata }` | **No change needed** — we already accept `data` |
| M5 | `sortBy` / `sortDir` | not read | required, spec §3 | Backend |
| M6 | `filter[<field>]` | not read | required, spec §3 | Backend — needs `app.set("query parser", "extended")` |

M1–M3 are one-line changes on whichever side we choose. **M5/M6 are the ones that bite
later** — retrofitting sort and filter across 26 endpoints is far more expensive than
adding them now, and it's exactly what happened with gxp-service (column sorting is still
disabled across that whole area because of it).

---

## 🟡 Structural questions

### S1. Field names differ substantially

Supplier is the sample we checked:

| Backend | Frontend / spec |
|---|---|
| `name` | `supplierName` |
| `contactEmail` | `email` |
| `notes` | `description` |
| `ratingPhraseId` | `rating` (nested ref) |
| — | `supplierId` (business key, unique) |
| — | `website`, `contactName`, `address{…}`, `attachments[]` |

Spec §5 has the full field list per entity. Please reconcile — we've assumed the spec's
names throughout. Same review needed for the other 25.

### S2. Sub-forms: nested arrays vs separate endpoints

The backend exposes child collections as their own CRUD routes:
`analysis-components`, `spec-limits`, `test-group-items`, `inspection-personnel`,
`test-windows`, `stock-parameters`, `calibration-schedules`.

The frontend sends them **nested in the parent payload** — one `POST /lims-analyses`
carries the analysis and its `components[]`, and the response is expected to carry them
back the same way.

Either works, but it must be one or the other. Our preference is nested: it's one round
trip, and it keeps the parent and its rows in a single transaction and a single audit
entry. Standalone routes can stay for direct access.

---

## ❗ Decisions needed before you write these tables

### D1. Roles and permissions — one model, not two

Right now the spec describes two things that don't line up:

- **§7** — 104 seeded permission strings `LIMS:<ACTION>:<ENTITY>`, returned in the JWT,
  used by the UI to gate menus and buttons.
- **§5** — a role carries `entries[] {entry, canView, canCreate, canEdit, canRemove}`.

**Proposal — derive one from the other.** `entry` becomes a fixed enum of the 26 entity
names below. The backend then derives the permission strings:

```
{ entry: "SAMPLE", canView: true, canCreate: true, canEdit: false, canRemove: false }
        ↓
LIMS:VIEW:SAMPLE, LIMS:CREATE:SAMPLE
```

Consequences, all good:
- **No permissions seed table and no seed migration.** The role's entries *are* the grants.
- Only two new tables: `lims_roles` and `lims_role_entries`.
- The JWT carries the derived strings, which is what the UI already checks.

**The 26 entity values for `entry`** (exact strings):

```
USER              ROLE              GROUP             PROJECT
STUDY             SUPPLIER          CUSTOMER          LOCATION
STOCK             PARAMETER         STOCK_BATCH       ALIQUOT
INSTRUMENT        INSTRUMENT_PART   CALIBRATION       INSPECTION_PLAN
ANALYSIS          TEST_GROUP        SPECIFICATION     BATCH
LOT               SAMPLE            TEST              RESULT
SCHEDULER         PHRASE
```

Actions: `CREATE`, `VIEW`, `UPDATE`, `DELETE`. `OPERATE:ALL` overrides everything.

### D2. LIMS Users are assignments, not new users — spec §5 is out of date here

LIMS does **not** create users. A LIMS user record grants an **existing platform user**
(from the auth service, managed in System IT Administration) access to LIMS — exactly how
`gxp-service-users` works today.

```jsonc
// POST /lims-users
{
  "user": { "id": "<auth-service user id>", "name": "A. Shah" },
  "roles": ["<lims role id>", "…"],
  "group": "<lims group id>",
  "location": "<lims location id>",
  "accessGroups": ["<lims group id>"],
  "trainingCompleted": true,
  "signature": "…",
  "description": "…"
}
```

No `name`, `email` or `mobileNumber` columns — those live on the platform user. Return
`user` nested as `{ id, name }` (per B3). Spec §5 still shows the old flat shape; treat
this block as authoritative.

### D3. Cancel vs Remove (Lab Executions)

The functional spec uses *Cancel / Reactivate* for Batches, Lots, Samples, Tests and
Results, but *Remove / Restore* for master data. Are they the same state?

- **Same** → one `isRemoved` flag, we just relabel the buttons. (Current assumption.)
- **Different** → a cancelled sample still appears in reports while a removed one doesn't,
  which needs a separate `status` column alongside `deleted_at`.

Please decide before the execution tables are written.

### D4. Result versioning

The functional spec says *"View Result — Table from Versioned component"*. Does editing a
result create a new row (full history) or bump a counter on the existing row?
**Full history is the GxP-safe answer** and is what we'd recommend.

### D5. Scheduler runner

Schedulers need a cron/job that fires on schedule, creates the target record
(Sample / Test / Result), advances `nextRunDate` and increments `generatedCount`.
Calibration needs the same mechanism. Which service owns it?

---

## Suggested order

1. **D1–D5** — decide first; they change table shapes.
2. **B2 groups**, then **B3 nested relations** — unblocks every dropdown in the app.
3. **B1** bulk-delete / bulk-duplicate / restore / audit-by-record.
4. **B4** `isRemoved` + `includeRemoved` + `changeReason`.
5. **M1–M3** naming alignment, **M5/M6** sort + filter.
6. **S1** field reconciliation per entity, **S2** nested vs standalone sub-forms.
7. Remaining entities: **roles**, **users**, **schedulers**.

**Do the bugs below first though** — G1–G5 and G8 are small, self-contained fixes in code
that already exists, and G4/G5/G8 are things we'd otherwise trip over on day one of
integration.

---

# 🐞 Bugs in the code that exists today

These are separate from the missing-feature list above — these are defects in code
already written. Ordered by severity.

**All of these were then run against the live service** (branch merged, `npm install`,
`npm run build`, pointed at the existing `lims-service` database on Neon — all 30 tables
were already migrated). Each item below says whether it was confirmed on a running server
or reasoned from source. One prediction, G2, was wrong and is retracted.

### G0. The service does not start 🔴

`node dist/server.js` exits immediately:

```
TypeError: Reflect.getMetadata is not a function
    at class-transformer/cjs/decorators/type.decorator.js:13
    at __decorate (dist/dtos/phrase.dto.js:5)
```

`class-transformer`'s `@Type()` calls `Reflect.getMetadata` while the DTO module is being
evaluated, but **`reflect-metadata` is neither a dependency nor imported anywhere**
(`grep -rn reflect-metadata src/ package.json` → no hits).

**Fix** — `npm i reflect-metadata`, then make it the *first* import in `src/server.ts`,
before anything that pulls in a DTO:

```ts
import "reflect-metadata";
import app from "./app";
```

Applied locally so the rest could be tested; please make the same change on your branch.
With it, startup is clean: migrations report up-to-date, both DB connections succeed, phrase
seeding runs, and `/health` returns `{"message":"LIMS Service is LIVE!"}`.

### G0b. Success messages render the raw template

Every create/update/delete returns the placeholder literally:

```json
{ "message": "{{ entity }} created successfully", "data": { … } }
```

`CUSTOM_MESSAGES` writes `"{{ entity }}"` (with spaces) but `getMessage` replaces
`"{{entity}}"` (without), so the substitution never matches:

```ts
return !entity ? message : message.replace("{{entity}}", entity);
```

`NOT_FOUND` happens to be spelled `"{{entity}} not found"`, which is why *that* one renders
correctly — a good hint at which spelling to standardise on. Low impact for us (the frontend
composes its own success toasts) but wrong for any other consumer.

### G1. Audit `oldValue` is **always null** — there is no before/after

**Confirmed live.** Created then edited a supplier; both audit rows came back with
`"oldValue": null`.

`audit.middleware.ts` reads `req.auditContext.oldValue`, but **nothing anywhere ever
sets it** (grep for `auditContext` returns only the middleware and the type
declaration). Every UPDATE and DELETE audit row is written with `oldValue: null`.

An audit trail that records only the new value is not a GxP audit trail — the whole
point is "field X went from A to B". The per-record audit dialog in the UI has a
before/after column that will be permanently empty.

**Fix:** in the update/delete service, load the row first (it's already loaded for the
404 check) and stash it: `req.auditContext.oldValue = existing.toJSON()`. Cheapest place
is a small middleware that runs after `validateDto` and does the read.

### ~~G2. Failed requests write audit rows~~ — RETRACTED, does not reproduce

I predicted this from reading the code and it turned out to be wrong. Tested against the
running service: a `PUT /suppliers/:id` for a missing row returns 404 and writes **zero**
audit rows.

The reason is incidental rather than deliberate. `entityId` falls back to `req.params?.id`,
and by the time the error has bubbled to the app-level `errorHandler`, Express has already
restored `req.params` to `{}` as the router layer unwound. `entityId` is undefined, so the
middleware's own guard returns early.

Worth knowing because it is load-bearing by accident: the day someone sets
`req.auditContext.entityId` explicitly — which G1's fix requires — failed requests **will**
start writing audit rows. Add the guard then:

```ts
res.json = (body: any) => {
  if (res.statusCode < 400) setImmediate(async () => { /* … */ });
  return originalJson(body);
};
```

### G3. Audit write failures are swallowed — the operation still succeeds

`createAuditLog` wraps everything in `try/catch` and only calls `logError`. Combined with
`setImmediate`, the HTTP response has already gone out. So a record can be changed with
**no audit row and no error to anyone**.

This is the highest-risk item in the service for a regulated product. Under GxP the audit
write must be in the **same transaction** as the data change, and if it fails the request
must fail.

Concrete way this fires today: `performedByName` is `allowNull: false` (200 chars), and
it's populated from `req.user.fullName` off the JWT. Any token without `fullName` →
`notNull violation` → swallowed → silent audit loss.

### G3b. Pagination breaks on any list that includes a child collection

**Confirmed live.** `GET /phrases?page=1&limit=10` against 5 phrases returns:

```json
{ "data": [ 4 rows ], "metadata": { "totalCount": 14, "totalPages": 2 } }
```

Three things wrong at once: 5 phrases exist, the count says 14, and a limit of 10 returned 4.

`getAllPhrasesRepo` does `findAndCountAll` with a `hasMany` include (`entries`) plus
`limit`. Postgres returns one joined row per entry, so `count` counts join rows rather than
phrases, and `limit` truncates join rows — which collapse into fewer parents.

**Fix:** add `distinct: true` so the count is of parents. `limit` needs care too: the include
carries `where: { isDeleted: false }`, which makes Sequelize drop the subquery it would
otherwise use to limit parents. Either move that condition into `on`, or fetch entries in a
second query.

Only `/phrases` does this today — **but it is exactly the pattern S2-nested would introduce
on every list**, so it's worth settling before the sub-forms are built rather than after.

### G4. `search` is parsed and then thrown away — the search box does nothing

**Confirmed live.** `GET /suppliers?search=zzz-no-such-supplier` returned the row anyway.

`getPaginationOptions` returns `{ page, limit, skip, search }`, but every controller
destructures only `{ page, limit }`:

```ts
const { page, limit } = getPaginationOptions(req.query);   // search dropped
const result = await supplierService.getAllSuppliers(page, limit);  // never passed
```

No service or repo references `search` at all (`git grep search src/services src/repo`
→ zero hits). So the search input on all 26 tables returns the unfiltered list. This is
worse than a 404 — it looks like it works and quietly lies.

**Fix:** pass `search` through and build an `Op.iLike` `Op.or` over the entity's text
columns in the repo.

### G5. Audit routes are double-prefixed — both URLs are wrong

**Confirmed live.** `GET /v1/api/audit` → 404; `GET /v1/api/audit/audit/SUPPLIER/:id` → 200.

`common.router.ts` mounts at `/audit`, and `audit.routes.ts` *also* prefixes `/audit`:

| Intended | Actually served |
|---|---|
| `GET /v1/api/audit` | `GET /v1/api/audit/audit` |
| `GET /v1/api/audit/:entityName/:entityId` | `GET /v1/api/audit/audit/:entityName/:entityId` |

**Fix:** in `audit.routes.ts` use `router.get("/")` and `router.get("/:entityName/:entityId")`.

### G6. `RESTORE` is unreachable

`determineAction` only returns `"RESTORE"` for a **POST** whose path contains `restore`.
The spec's restore is `PATCH {route}/restore/:id`, which the function classifies as
`UPDATE`. So even once restore is built, it will be audited as an update. The
`AuditAction` enum has a value nothing can ever produce.

### G7. `UpdateXDto extends CreateXDto` — partial updates are rejected

**Confirmed live.** `PUT /suppliers/:id` with `{ notes: "…" }` → 400
`["name should not be empty", "name must be a string"]`.

```ts
export class UpdateSupplierDto extends CreateSupplierDto {}
```

`CreateSupplierDto.name` is `@IsNotEmpty()`, so it stays required on update. Any partial
update that omits `name` 400s. This pattern is repeated across the DTO files.

**Fix:** `PartialType`-style DTOs, or re-declare the update fields as `@IsOptional()`.

### G8. Rate limit of 100 req/min will be hit in normal use

```ts
rateLimit({ windowMs: 60_000, max: 100 })
```

Default key is the IP, and there's no `keyGenerator`, so **every user in one office
shares one 100/min bucket**. A single LIMS form opens 4–6 dropdowns, each paging as you
type — one person filling two forms can trip it, and everyone else gets 429s.

**Fix:** key on `req.user.id`, and raise the ceiling (gxp-service is a good reference).

### G9. No authorization — only authentication

`authenticate` verifies the JWT and attaches `req.user`, and that is the only gate. There
is no permission check on any route, so **any authenticated platform user can read and
write every LIMS table**, including users who were never granted LIMS access at all.
This is what D1 is for — worth confirming it's a known gap and not an oversight.

### G10. Transactions are accepted but never used

Every repo takes `transaction?: Transaction`, and no service ever opens one. Once
sub-forms land (S2), a parent + rows create will be able to half-succeed.

### G11. List order is hardcoded to `name`

`order: [["name", "ASC"]]` in every repo. Entities without a `name` column will throw at
runtime, and it's the same blocker as M5 (no `sortBy`).

### Smaller ones

- `limit` is clamped to **100**; the frontend's CSV export asks for more.
- `DELETE` requires `changeReason` **in the body** (`auditMiddleware(ENTITY, true)`).
  That works, but it's unusual — please confirm it's intentional so we send
  `axios.delete(url, { data: { changeReason } })` and not a query param.
- `validateDto` replaces `req.body` with the class instance and the service passes it
  straight to `Model.create()`. Harmless today (Sequelize ignores unknown keys) but it
  means `changeReason` is riding along into the create call.
- `updateSupplierRepo` has no `isDeleted: false` guard in its `where`. Safe now because
  the service checks first, but it's a footgun if anyone calls the repo directly.

---

## How to verify as you go

The frontend is already built against this contract and runs against a mock that
implements it. Point `VITE_API_LIMS_BASE_URL` at the real service and any divergence shows
up immediately — no guesswork needed.

Reference implementation of the same patterns: `gxp-service` for bulk-delete /
bulk-duplicate / pagination, and `gxp-service-users` for the D2 user-assignment shape.
