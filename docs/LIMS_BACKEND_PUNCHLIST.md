# LIMS Backend — Punch List

Review of branch **`sp/lims-service`** against [LIMS_BACKEND_SPEC.md](./LIMS_BACKEND_SPEC.md).

**Verdict: not yet integratable.** The CRUD skeleton is solid — 188 files, 30 models,
7 migrations, Postgres + Sequelize, audit logging, and the auth middleware **correctly
verifies the JWT** (thank you — that was a specific ask). What's missing is the set of
endpoints and response shapes the frontend actually depends on.

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

### B3. Relations come back as bare UUIDs (spec §3)

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

## How to verify as you go

The frontend is already built against this contract and runs against a mock that
implements it. Point `VITE_API_LIMS_BASE_URL` at the real service and any divergence shows
up immediately — no guesswork needed.

Reference implementation of the same patterns: `gxp-service` for bulk-delete /
bulk-duplicate / pagination, and `gxp-service-users` for the D2 user-assignment shape.
