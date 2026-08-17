# LIMS Backend Spec

What the LIMS frontend needs from the backend. Every entity follows the **same** contract — read §1–§4 once, then §5 is just the list of entities and their fields.

Mirrors the existing `gxp-service` conventions so nothing new has to be invented.

> **Scope — all 26 entities.** §5 covers phase 1 (Administration + Master Data),
> §5b covers phase 2 (Lab Executions) and §5c phase 3 (Schedulers). Every entity uses
> the same contract in §1–§4.
>
> **Build order matters:** phase 1 first — Lab Executions reference master data, and
> Schedulers generate Samples/Tests/Results, so they come last.

---

## 1. Service

| | |
|---|---|
| Service name | `lims-service` |
| Port | `9003` (backend `9002`, gxp-service `9001`) |
| Base path | `/v1/api` |
| Example | `GET http://localhost:9003/v1/api/lims-suppliers` |
| DB | PostgreSQL + Sequelize (same as gxp-service) |
| Auth | `Authorization: Bearer <jwt>` — **verify the token properly** and put the real user on `req.user` |
| Frontend env var | `VITE_API_LIMS_BASE_URL` |

---

## 2. Endpoints every entity gets

Replace `{route}` with the entity route from §5 (e.g. `/lims-suppliers`).

| # | Method + path | Purpose | Request body | Response |
|---|---|---|---|---|
| 1 | `GET {route}` | Paginated list | — (query params, §3) | List envelope (§3) |
| 2 | `GET {route}/:id` | One full record | — | `{ data: <Entity> }` |
| 3 | `POST {route}` | Create | `<Entity>Payload` | Created `<Entity>` |
| 4 | `PATCH {route}/:id` | Update | `<Entity>Payload` (partial) | Updated `<Entity>` |
| 5 | `DELETE {route}/:id` | Soft delete one | `{ changeReason }` | `{ message }` |
| 6 | `POST {route}/bulk-delete` | Soft delete many | `{ ids: string[], changeReason }` | `{ message, count }` |
| 7 | `POST {route}/bulk-duplicate` | Clone many | `{ ids: string[] }` | `{ message, count }` |
| 8 | `PATCH {route}/restore/:id` | Undo a soft delete | `{ changeReason }` | Restored `<Entity>` |
| 9 | `GET {route}/:id/audit` | Audit trail | — | `{ audit: AuditEntry[] }` (§4) |
| 10 | `PATCH {route}/enable/:id`<br>`PATCH {route}/disable/:id` | Status toggle | — | Updated `<Entity>` |

Notes:
- **#7 clone naming** — a copy of `Acetone` becomes `Acetone-(1)`, then `Acetone-(2)`. Must be unique **among non-deleted rows only**.
- **#6/#7 take `ids`.** Later we may also send `{ filter: {...}, excludeIds: [...] }` for "select all 5000 matching" — the frontend hides that button until you support it, so it's not needed for v1.
- **#10 only** for entities with a status column.

---

## 3. List contract (identical on every `GET {route}`)

### Query params

| Param | Example | Required for v1 | Notes |
|---|---|---|---|
| `page` | `2` | ✅ | 1-based |
| `limit` | `20` | ✅ | page size |
| `search` | `aceto` | ✅ | case-insensitive, across the entity's main text fields |
| `sortBy` + `sortDir` | `name` + `asc` | ✅ | omit → default sort. **See note below** |
| `filter[<field>]` | `filter[status]=enabled` | ✅ | repeat key for OR. **See note below** |
| `includeRemoved` | `true` | ✅ | default `false` = hide soft-deleted |

### Response envelope — **must be exactly this shape**

```json
{
  "suppliers": [ { "id": "uuid", "supplierId": "SUP-001", "supplierName": "Merck" } ],
  "metadata": { "totalCount": 137, "currentPage": 2, "limit": 20, "totalPages": 7 }
}
```

> **Why sort and filter are day-one, not later.** Our existing services shipped
> without them, so column sorting is still disabled and "select all matching" is
> still hidden across the whole GxP area — retrofitting means touching every
> endpoint. Two implementation notes so it works first time:
>
> - `filter[...]` needs Express's **extended** query parser
>   (`app.set("query parser", "extended")`); Express 5 defaults to `simple`,
>   which does not parse brackets.
> - Whitelist the sortable/filterable fields per endpoint rather than passing
>   user input to the ORM.
>
> Same reasoning applies to `{ filter: … }` on the bulk endpoints (§2 note) — if
> it's cheap to add now, add it now and we'll never need "select all 5000".

- The array key is the entity's plural name (`suppliers`, `instruments`, …).
- `metadata` is **required** — pagination breaks without `totalCount` / `totalPages`.
- Every row carries a UUID **`id`** (not `_id`).
- **Return relations nested, not as bare ids** — this matters a lot:
  ```json
  "group":    { "id": "uuid", "name": "QC Lab" },
  "supplier": { "id": "uuid", "supplierName": "Merck" }
  ```
  With bare ids the dropdowns show raw UUIDs when editing a record.

---

## 4. Fields on every entity

Applied to all 26 — don't repeat them per entity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key |
| `createdOn` / `createdBy` | timestamp / user | |
| `modifiedOn` / `modifiedBy` | timestamp / user | |
| `deletedAt` | timestamp, null | soft delete (Sequelize `paranoid`) |
| `status` | `enabled` / `disabled` | only where §5 says so |

### Change reason + audit (GxP compliance — required)

Every **create, update, delete and restore** writes an audit row. Update/delete/restore carry a `changeReason` in the body; the frontend prompts the user for it.

```json
{
  "id": "uuid",
  "uniqueId": "SUP-001",
  "action": "UPDATE",
  "field": "supplierName",
  "oldValue": "Merk",
  "newValue": "Merck",
  "changeReason": "Corrected spelling",
  "who": "miten.patel",
  "when": "2026-08-08T10:32:00Z"
}
```

One row per changed field. `GET {route}/:id/audit` returns them newest first.

### Uniqueness rule (important)

Business keys (`supplierId`, `stockId`, `groupId`, …) are unique — but **only among non-deleted rows**. Use a partial index, otherwise deleting `SUP-001` blocks ever creating `SUP-001` again:

```sql
CREATE UNIQUE INDEX ON suppliers (supplier_id) WHERE deleted_at IS NULL;
```

---

## 5. Phase 1 entities — Administration + Master Data (20)

`Entity` = type name · `Payload` = `<Entity>Payload` · all get the §2 endpoints and §4 fields.

### Lab Access

| Route | Entity | Status? | Fields |
|---|---|---|---|
| `/lims-users` | `LimsUser` | ✅ | `userId`* (from main app), `name`, `description`, `email`, `mobileNumber`, `group`→Group, `location`→(main app), `accessGroups[]`→Group, `roles[]`→Role, `trainingCompleted`, `signature` |
| `/lims-roles` | `LimsRole` | ✅ | `roleId`*, `name`, `description`, `group`→Group, `entries[]` `{entry, canView, canCreate, canEdit, canRemove}` |
| `/lims-groups` | `LimsGroup` | ✅ | `groupId`* (`LIMS_` prefix), `name`, `description`, `ownedBy`→User, `parentGroup`→Group |

### Lab Setup — master data

| Route | Entity | Status? | Fields |
|---|---|---|---|
| `/lims-projects` | `LimsProject` | ✅ | `projectId`*, `name`, `code`, `details`, `group`→Group, `customer`→Customer, `customerContact`, `supervisor`→User, `attachments[]` |
| `/lims-studies` | `LimsStudy` | ✅ | `studyId`*, `name`, `studyCode`, `details`, `group`→Group, `project`→Project, `projectDetails`, `supervisor`→User, `attachments[]` |
| `/lims-suppliers` | `LimsSupplier` | ✅ | `supplierId`*, `supplierName`, `description`, `group`→Group, `rating`→Phrase, `website`, `contactName`, `contactPhone`, `email`, `address{line1,line2,town,state,zipcode,country}`, `attachments[]` |
| `/lims-customers` | `LimsCustomer` | ✅ | same as Supplier + `otherInformation`, `linkedProjects[]`→Project |
| `/lims-locations` | `LimsLocation` | ✅ | `locationId`*, `locationName`, `description`, `locationType`→Phrase, `group`→Group, `parentLocation`→Location, `subLocations[]`→Location, `otherInformation`, `attachments[]` |
| `/lims-stocks` | `LimsStock` | ✅ | `stockId`*, `stockName`, `description`, `group`→Group, `stockType`→Phrase, `operator`→User, `defaultLocation`→Location, `unit`, `targetAmount`, `preferredSupplier`→Supplier, `lowAmount`, `lowPercentage` (0–100), `suppliers[]`→Supplier, `inventory` (**server-computed** from stock batches, read-only), `parameters[]` `{identity,value,unit}`, `details`, `attachments[]` |
| `/lims-parameters` | `LimsParameter` | ✅ | `parameterId`*, `parameterName`, `parameterType`→Phrase, `defaultValue`, `unit` |
| `/lims-stock-batches` | `LimsStockBatch` | ✅ | `stock`→Stock, `batchNumber` (**auto-increment per stock**), `stockBatchId`* (**server-generated** `stockId/batchNumber`), `description`, `status`→Phrase, `project`→Project, `supplier`→Supplier, `manufacturingDate`, `expiryDate`, `supplierBatchNumber`, `sapBatchId`, `internalBatchId`, `initialAmount`, `currentAmount`, `unit`, `location`→Location, `consumptions[]` `{consumedOn,consumedBy,amount,unit,remarks}`, `parameters[]`, `attachments[]` |
| `/lims-aliquots` | `LimsAliquot` | ✅ | `stockBatch`→StockBatch, `aliquotsNumber`, `aliquots[]` `{aliquotId,description,quantity,unit}` |
| `/lims-instruments` | `LimsInstrument` | ✅ | `instrumentId`*, `name`, `description`, `type`→Phrase, `measurementType`→Phrase, `status`→Phrase, `group`→Group, `dateInstalled`, `sopReference`, `location`→Location, `supplier`→Supplier, `manufacturer`, `serialNumber`, `modelNumber`, `measuringInformation`, `msaInformation`, `lastMsaDate`, `parts[]`→InstrumentPart, `parameters[]`, `maintenance[]` `{maintenanceName,performedOn,performedBy,remarks}`, `details`, `attachments[]` |
| `/lims-instrument-parts` | `LimsInstrumentPart` | ✅ | `partId`*, `partName`, `description`, `status`→Phrase, `group`→Group, `dateInstalled`, `sopReference`, `location`→Location, `supplier`→Supplier, `manufacturer`, `serialNumber`, `modelNumber`, `measuringInformation`, `instrument`→Instrument, `maintenance[]`, `details`, `attachments[]` |
| `/lims-calibrations` | `LimsCalibration` | ✅ | `calibrationId`*, `instrument`→Instrument, `calibrationName`, `calibrationType`→Phrase, `status`→Phrase, `plan` (Daily/Monthly/Yearly), `planTime`, `leadTimeValue`, `leadTimeUnit` (Day/Hours/Min/Second), `analysis`→Analysis, `owner`→User, `contractor`, `autoLogin`, `lastMaintenanceDate`, `nextMaintenanceDate`, `associatedSamples[]` |
| `/lims-inspection-plans` | `LimsInspectionPlan` | ✅ | `inspectionId`*, `name`, `description`, `inspectionType` (Round robin/Linear), `group`→Group, `personnel[]` `{inspectionType:User\|Role, person, role}`, `details` |
| `/lims-analyses` | `LimsAnalysis` | ✅ | `analysisId`*, `name`, `description`, `group`→Group, `analysisType`→Phrase, `sopReference`, `inspectionPlan`→InspectionPlan, `approvalStatus`→Phrase, `components[]` (below), `details` |
| `/lims-test-groups` | `LimsTestGroup` | ✅ | `testGroupId`*, `name`, `description`, `group`→Group, `tests[]` `{testName,instrumentCategory,instrumentType,instrument,replicateCount}` |
| `/lims-specifications` | `LimsSpecification` | ✅ | `specId`*, `name`, `description`, `group`→Group, `limits[]` `{analysisName,componentName,min,max,text,phrase,boolean,calculation}`, `attachments[]` |
| `/lims-phrases` | `LimsPhrase` | ✅ | `phrase`*, `name`, `description`, `group`→Group, `isSystem` (pre-seeded, not deletable), `entries[]` `{phraseEntryId,name,description}` |

`*` = unique business key (partial index per §4) · `→X` = relation, return nested `{id, label}`

**Analysis `components[]`** — `{componentId, name, description, type, unit, calculation, formula, option, list, entity, entityCriteria, min, max}` where `type` ∈ Numeric, Text, Option, Boolean, Character, Date, Interval, Formula, File, Entity.

---

## 5b. Lab Executions — phase 2 (5 entities)

Same contract as §2–§4. Note the vocabulary difference: the functional spec calls these
actions **Login / Cancel / Reactivate** rather than Create / Remove / Restore. The endpoints
are identical — see the decision in §8.

| Route | Entity | Fields |
|---|---|---|
| `/lims-batches` | `LimsBatch` | `batchId`*, `batchName`, `description`, `group`→Group, `lots[]`→Lot, `attachments[]` |
| `/lims-lots` | `LimsLot` | `lotId`*, `lotName`, `description`, `group`→Group, `samples[]`→Sample, `attachments[]` |
| `/lims-samples` | `LimsSample` | `sampleId`*, `idNumeric` (**server-generated, auto-increment**), `idText`, `sampleName`, `project`→Project, `sampleType`→Phrase, `specification`→Specification, `testGroup`→TestGroup, `location`→Location, `group`→Group, `stockBatch`→StockBatch, `lotNumber`, `serialNumber`, `loginDate`, `loginBy`, `sampleStartDate`, `sampleStartBy`, `description`, `comments`, `testWindows[]` (below), `attachments[]` |
| `/lims-tests` | `LimsTest` | `testId`*, `testName`, `sample`→Sample, `analysis`→Analysis, `instrument`→Instrument, `group`→Group, `replicateCount`, `loginDate`, `loginBy`, `description`, `components[]` (below), `attachments[]` |
| `/lims-results` | `LimsResult` | `resultId`*, `test`→Test, `sample`→Sample, `analysis`→Analysis, `componentId`, `componentName`, `value`, `unit`, `version` (**server-managed**), `instrument`→Instrument, `stock`→Stock, `enteredOn`, `enteredBy`, `outOfRange` |

**Sample `testWindows[]`** — `{testWindowId, analysisName, componentId, componentName, description, value, unit, outOfRange, enteredOn, enteredBy, instrument, stock}`. Generated from the sample's Test Group on login.

**Test `components[]`** — `{componentId, componentName, value, unit, outOfRange, enteredOn, enteredBy}`.

---

## 5c. Schedulers — phase 3 (1 entity)

| Route | Entity | Fields |
|---|---|---|
| `/lims-schedulers` | `LimsScheduler` | `schedulerId`*, `name`, `scope` (`Sample` \| `Test` \| `Result`), `group`→Group, `project`→Project, `analysis`→Analysis, `testGroup`→TestGroup, `specification`→Specification, `sampleType`→Phrase, `owner`→User, `plan` (`Daily` \| `Monthly` \| `Yearly`), `planTime`, `leadTimeValue`, `leadTimeUnit` (`Day` \| `Hours` \| `Min` \| `Second`), `lastRunDate`, `nextRunDate`, `generatedCount` (**server-computed**), `description`, `autoLogin`, `isActive` |

One entity covers all three scopes — the spec lists Sample/Tests/Results under a single
Schedulers menu entry, and the fields are identical.

**This one needs a job runner**, not just CRUD: on schedule it creates the target record
(a Sample, Test or Result), advances `nextRunDate`, and increments `generatedCount`. The
same mechanism Calibration needs (spec p.21: *"Based on the defined schedule Sample need to
be generated and Instrument Status need to be changed to In Calibration"*).

---

## 6. Two extra endpoints

**Phrase entries** — powers every "pick from a list" dropdown (Rating, Stock Type, Instrument Status, …):

```
GET /lims-phrases/entries?phrase=RATING
→ { "entries": [ { "id": "uuid", "phraseEntryId": "A", "name": "Preferred" } ] }
```

Please seed these phrases: `RATING`, `LOCATION_TYPE`, `STOCK_TYPE`, `STOCK_BATCH_STATUS`, `PARAMETER_TYPE`, `INSTRUMENT_TYPE`, `MEASUREMENT_TYPE`, `INSTRUMENT_STATUS`, `CALIBRATION_TYPE`, `CALIBRATION_STATUS`, `ANALYSIS_TYPE`, `APPROVAL_STATUS`, `SAMPLE_TYPE` — with `isSystem: true`. **Send us the starting values for each.**

**Attachments** — multipart on create/update, same as gxp-service: record JSON in a `data` field, files as `attachments`. On update, `keptIds` lists the existing attachments to keep; delete the rest. Each attachment has an optional `comment`.

---

## 7. Permissions

`LIMS:<ACTION>:<ENTITY>` — e.g. `LIMS:VIEW:SUPPLIER`, `LIMS:CREATE:STOCK_BATCH`, `LIMS:DELETE:INSTRUMENT`. Actions: `CREATE`, `VIEW`, `UPDATE`, `DELETE`. 26 entities × 4 = **104**. `OPERATE:ALL` overrides everything.

These must be seeded as permissions, assignable to roles, and **returned in the JWT** so the UI can gate menus and buttons.

> ⚠️ `gxp-service`'s auth middleware currently accepts any token and hardcodes an ADMIN user, and has no permission checks at all. Please don't copy that into `lims-service` — verify the JWT and enforce permissions per route.

---

## 8. Decisions we need from you

1. **Business IDs** — does the backend generate `supplierId`, `stockId`, `projectId`, or does the user type them? (`stockBatchId`, `Sample.idNumeric` and `Result.version` are definitely server-generated.) If generated, give us the format per entity.
2. **Phrase seed values** — the actual dropdown options for each of the 13 phrases above.
3. **Restore + uniqueness** — restoring `SUP-001` when an active `SUP-001` now exists: rename, or reject with an error?
4. **Cancel vs Remove (phase 2).** The spec uses *Cancel / Reactivate* for Batches, Lots, Samples, Tests and Results, but *Remove / Restore* for master data. Are these the **same** state — i.e. is a cancelled sample just a soft-deleted one — or does a cancelled sample still appear in reports and audit views while a removed one does not? If they differ we need a separate `status` column alongside `deletedAt`, and the frontend needs relabelling. **Currently implemented as the same thing.**
5. **Result versioning.** The spec says *"View Result — Table from Versioned component"*. We expose `version` as read-only. Confirm the model: does editing a result create a new row (full history) or bump a counter on the existing row? Full history is the GxP-safe answer.
6. **Scheduler runner** — which service owns the cron/job that fires schedulers and creates the generated records?
7. **Priority order** — Frontend suggestion: Phrases → Groups → Locations → Suppliers first, since almost everything references them.

---

## 9. Build order suggestion

1. Phrases (+ `/entries`) — everything else has dropdowns fed by it
2. Groups, Locations, Suppliers, Customers, Users, Roles — the common relations
3. Projects, Studies, Parameters, Stocks
4. Stock Batches, Aliquots, Instruments, Instrument Parts, Calibrations
5. Inspection Plans, Analyses, Test Groups, Specifications
6. **Phase 2** — Samples, Lots, Batches, Tests, Results (in that order; Lots reference Samples, Batches reference Lots)
7. **Phase 3** — Schedulers + the job runner

One entity done fully (all 10 endpoints + audit) is more useful to us than 20 with only list+create — we can wire and verify a whole module against it.
