import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";

/**
 * TEMPORARY adapter between the LIMS frontend contract and `lims-service` as it
 * exists on branch `sp/lims-service` today.
 *
 * The 26 modules are written against the target contract in LIMS_BACKEND_SPEC.md.
 * The service currently ships five endpoints per entity under different paths,
 * a different verb, different column names and no nested relations. Rather than
 * rewrite 26 modules with work we would immediately undo, every divergence is
 * expressed once, here, as data.
 *
 * **Delete this whole file when LIMS_BACKEND_PUNCHLIST.md is closed out.**
 * Each entry below maps to a numbered item in that document.
 *
 * Active only when `VITE_ENABLE_LIMS_MOCKS` is off — mocks already implement the
 * target contract, so the shim must not run in front of them.
 */

export const LIMS_SHIM_ENABLED =
  import.meta.env.VITE_ENABLE_LIMS_MOCKS !== "true" &&
  import.meta.env.VITE_LIMS_BACKEND_SHIM !== "false";

/** Marker on synthetic errors so the interceptor can tell them from real ones. */
export const SHIM_ERROR = "LIMS_SHIM_UNAVAILABLE";

interface EntityShim {
  /** Backend path, or `null` when lims-service has no route for it yet (B2). */
  path: string | null;
  /** `ENTITY_NAME` the backend audits this entity under. */
  auditName?: string;
  /** Backend column holding the display name — used when emulating clone. */
  labelField?: string;
  /** Frontend scalar field → backend column (S1). Unlisted fields are dropped. */
  fields?: Record<string, string>;
  /** Frontend relation field → backend FK column. Frontend sends/receives ids. */
  relations?: Record<string, string>;
  /**
   * Frontend relation field → the backend's `include` alias, for the few where
   * they differ. When a repo nests the relation we use it; only the rest fall
   * back to the bare FK column.
   */
  aliases?: Record<string, string>;
}

/**
 * Frontend route → backend route + column mapping.
 *
 * `fields`/`relations` are a WHITELIST: anything not listed has no column in
 * lims-service and is dropped from the request body, because class-validator
 * rejects the shapes it does not know (an `address` object against
 * `@IsString()`, for example) with a 400 for the whole record.
 *
 * The `coverage` comment on each entry is how many of the module's form fields
 * survive the round trip. Everything else is punch-list item S1.
 */
const LIMS_SHIM: Record<string, EntityShim> = {
  // ---- Administration -----------------------------------------------------
  // B2 CLOSED — all four now exist and return 200.
  "/lims-groups": { path: "/lims-groups", auditName: "GROUP", labelField: "name" },
  "/lims-roles": { path: "/lims-roles", auditName: "ROLE", labelField: "name" },
  "/lims-users": { path: "/lims-users", auditName: "LIMS_USER" },
  "/lims-schedulers": { path: "/lims-schedulers", auditName: "SCHEDULER", labelField: "name" },

  // ---- Master data --------------------------------------------------------
  "/lims-phrases": {
    // coverage 4/6 — `phrase` (code) and `entries[]` have no route (§6)
    path: "/lims-phrases",
    auditName: "PHRASE",
    labelField: "name",
    fields: { name: "name", description: "description", isSystem: "isSystem" },
    relations: { group: "groupId" }
  },
  "/lims-customers": {
    // coverage 5/13 — no customerId, rating, website, contactName, address{}, attachments
    path: "/lims-customers",
    auditName: "CUSTOMER",
    labelField: "name",
    fields: {
      customerName: "name",
      email: "contactEmail",
      contactPhone: "contactPhone",
      description: "notes"
    },
    relations: { group: "groupId" }
  },
  "/lims-suppliers": {
    // coverage 6/14 — no supplierId, website, contactName, address{}, attachments
    path: "/lims-suppliers",
    auditName: "SUPPLIER",
    labelField: "name",
    fields: {
      supplierName: "name",
      email: "contactEmail",
      contactPhone: "contactPhone",
      description: "notes"
    },
    relations: { group: "groupId", rating: "ratingPhraseId" }
  },
  "/lims-projects": {
    // coverage 5/9 — no projectId, code, customerContact, attachments
    path: "/lims-projects",
    auditName: "PROJECT",
    labelField: "name",
    fields: { name: "name", details: "description" },
    relations: { customer: "customerId", supervisor: "supervisorId", group: "groupId" }
  },
  "/lims-studies": {
    // coverage 5/9 — no studyId, studyCode, projectDetails, attachments
    path: "/lims-studies",
    auditName: "STUDY",
    labelField: "name",
    fields: { name: "name", details: "description" },
    relations: { project: "projectId", supervisor: "supervisorId", group: "groupId" }
  },
  "/lims-locations": {
    // coverage 5/10 — no locationId, subLocations, otherInformation, status, attachments
    path: "/lims-locations",
    auditName: "LOCATION",
    labelField: "name",
    fields: { locationName: "name", description: "description" },
    relations: {
      parentLocation: "parentId",
      locationType: "locationTypePhraseId",
      group: "groupId"
    },
    // the repo includes the parent as `parent`, we call it `parentLocation`
    aliases: { parentLocation: "parent" }
  },
  "/lims-parameters": {
    // coverage 3/6 — no parameterId, parameterType, defaultValue
    path: "/lims-stock-parameters", // the one surviving name mismatch
    auditName: "STOCK_PARAMETER",
    labelField: "name",
    fields: { parameterName: "name" },
    relations: { unit: "unitPhraseId", group: "groupId" }
  },

  // ---- Stock & instruments -------------------------------------------------
  "/lims-stocks": {
    // coverage 6/17 — no stockId, operator, defaultLocation, suppliers[], targetAmount,
    // lowPercentage, inventory, details, parameters[], attachments
    path: "/lims-stocks",
    auditName: "STOCK",
    labelField: "name",
    fields: { stockName: "name", description: "description", lowAmount: "minThreshold" },
    relations: { stockType: "stockTypePhraseId", unit: "unitPhraseId", group: "groupId" }
  },
  "/lims-stock-batches": {
    // coverage 8/20 — no stockBatchId, status, project, manufacturingDate,
    // supplierBatchNumber, sapBatchId, internalBatchId, unit, description,
    // consumptions[], parameters[], attachments
    path: "/lims-stock-batches",
    auditName: "STOCK_BATCH",
    labelField: "batchNumber",
    fields: {
      batchNumber: "batchNumber",
      initialAmount: "initialAmount",
      currentAmount: "currentAmount",
      expiryDate: "expiryDate"
    },
    relations: {
      stock: "stockId",
      supplier: "supplierId",
      location: "locationId",
      group: "groupId"
    }
  },
  "/lims-aliquots": {
    // coverage 2/4 — backend models a single aliquot, the UI models an aliquot SET
    // with an `aliquots[]` child grid that has no route. See S2.
    path: "/lims-aliquots",
    auditName: "ALIQUOT",
    labelField: "aliquotLabel",
    fields: { aliquotSetId: "aliquotLabel" },
    relations: { stockBatch: "batchId", group: "groupId" },
    // the repo includes the stock batch as `batch`
    aliases: { stockBatch: "batch" }
  },
  "/lims-instruments": {
    // coverage 7/19 — no instrumentId, type, measurementType, dateInstalled,
    // lastMsaDate, sopReference, manufacturer, modelNumber, measuringInformation,
    // msaInformation, parameters[], maintenance[], attachments
    path: "/lims-instruments",
    auditName: "INSTRUMENT",
    labelField: "name",
    fields: { name: "name", details: "description", serialNumber: "serialNumber" },
    relations: {
      location: "locationId",
      supplier: "supplierId",
      status: "statusPhraseId",
      group: "groupId"
    }
  },
  "/lims-instrument-parts": {
    // coverage 5/17 — no status, location, supplier, sopReference, manufacturer,
    // serialNumber, modelNumber, measuringInformation, details, maintenance[], attachments
    path: "/lims-instrument-parts",
    auditName: "INSTRUMENT_PART",
    labelField: "partName",
    fields: {
      partName: "partName",
      partId: "partNumber",
      dateInstalled: "installationDate"
    },
    relations: { instrument: "instrumentId", group: "groupId" }
  },
  "/lims-calibrations": {
    // coverage 4/15 — pointed at `/calibration-schedules`, not `/calibrations`:
    // the UI models a recurring calibration PLAN, and `/calibrations` is a record
    // of one completed event. NEEDS CONFIRMING with the backend — if the module is
    // meant to be the event log instead, repoint this entry.
    //
    // Note the DTO marks instrumentId/title/frequencyDays/nextDueDate all
    // @IsNotEmpty, so a create 400s unless all four are filled.
    path: "/lims-calibration-schedules",
    auditName: "CALIBRATION_SCHEDULE",
    labelField: "title",
    fields: {
      calibrationName: "title",
      leadTimeValue: "frequencyDays",
      nextMaintenanceDate: "nextDueDate"
    },
    relations: { instrument: "instrumentId", group: "groupId" }
  },

  // ---- Analytical ----------------------------------------------------------
  "/lims-inspection-plans": {
    // coverage 4/8 — no inspectionId, inspectionType, details, personnel[]
    path: "/lims-inspection-plans",
    auditName: "INSPECTION_PLAN",
    labelField: "name",
    fields: { name: "name", description: "description" },
    relations: { group: "groupId" }
  },
  "/lims-analyses": {
    // coverage 6/11 — no analysisId, analysisType, details, components[]
    path: "/lims-analyses",
    auditName: "ANALYSIS",
    labelField: "name",
    fields: { name: "name", description: "description", sopReference: "sopReference" },
    relations: {
      approvalStatus: "approvalStatusPhraseId",
      inspectionPlan: "inspectionPlanId",
      group: "groupId"
    }
  },
  "/lims-test-groups": {
    // coverage 3/5 — no testGroupId, tests[]
    path: "/lims-test-groups",
    auditName: "TEST_GROUP",
    labelField: "name",
    fields: { name: "name", description: "description" },
    relations: { group: "groupId" }
  },
  "/lims-specifications": {
    // coverage 3/6 — no specId, limits[], attachments
    path: "/lims-specifications",
    auditName: "SPECIFICATION",
    labelField: "name",
    fields: { name: "name", description: "description" },
    relations: { group: "groupId" }
  },

  // ---- Lab executions ------------------------------------------------------
  "/lims-batches": {
    // coverage 3/6 — no batchName, lots[], attachments
    path: "/lims-batches",
    auditName: "BATCH",
    labelField: "batchNumber",
    fields: { batchId: "batchNumber", description: "description" },
    relations: { group: "groupId" }
  },
  "/lims-lots": {
    // coverage 3/6 — no lotName, samples[], attachments
    path: "/lims-lots",
    auditName: "LOT",
    labelField: "lotNumber",
    fields: { lotId: "lotNumber", description: "description" },
    relations: { group: "groupId" }
  },
  "/lims-samples": {
    // coverage 6/20 — no idText, sampleName, project, sampleType, specification,
    // location, stockBatch, lotNumber, serialNumber, sampleStart*, comments,
    // testWindows[], attachments
    path: "/lims-samples",
    auditName: "SAMPLE",
    labelField: "sampleNumber",
    fields: {
      sampleId: "sampleNumber",
      description: "description",
      loginDate: "loggedInAt",
      loginBy: "loggedInBy"
    },
    relations: { testGroup: "testGroupId", group: "groupId" }
  },
  "/lims-tests": {
    // coverage 4/12 — no testId, testName, replicateCount, loginDate, loginBy,
    // description, components[], attachments
    path: "/lims-tests",
    auditName: "TEST",
    relations: {
      sample: "sampleId",
      analysis: "analysisId",
      instrument: "instrumentId",
      group: "groupId"
    }
  },
  "/lims-results": {
    // coverage 3/14 — backend splits `value` into numeric/text/boolean/date columns
    // and keys off testWindowId; no resultId, version, unit, stock. See D4.
    path: "/lims-results",
    auditName: "RESULT",
    fields: { outOfRange: "isOos", enteredBy: "enteredBy", enteredOn: "enteredAt" },
    relations: { group: "groupId" }
  }
};

/** Query params lims-service does not read yet (M5, M6, B4) — dropped, never faked. */
const UNSUPPORTED_PARAMS = /^(includeRemoved|sortBy|sortDir|filter\[)/;

interface ParsedUrl {
  key: string;
  shim: EntityShim;
  /** Path after the entity prefix, e.g. `/:id/audit`. */
  rest: string;
}

/** Split `/lims-suppliers/123/audit` into its entity shim and remainder. */
export const parseLimsUrl = (url?: string): ParsedUrl | null => {
  if (!url) return null;
  const key = Object.keys(LIMS_SHIM).find(
    (route) => url === route || url.startsWith(`${route}/`)
  );
  return key ? { key, shim: LIMS_SHIM[key], rest: url.slice(key.length) } : null;
};

/** An error the interceptor recognises, shaped like a real Axios failure. */
export const shimUnavailable = (message: string): AxiosError => {
  const error = new Error(message) as AxiosError;
  error.name = SHIM_ERROR;
  error.response = {
    status: 501,
    statusText: "Not Implemented",
    data: { message },
    headers: {},
    config: {} as never
  } as AxiosResponse;
  return error;
};

const SKIP_KEYS = new Set(["id", "_id", "keptAttachmentIds"]);

/** Frontend payload → backend columns. Unmapped keys are dropped (see whitelist note). */
export const toBackendBody = (shim: EntityShim, body: unknown): unknown => {
  if (!body || typeof body !== "object" || body instanceof FormData) return body;

  const source = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (SKIP_KEYS.has(key) || value === undefined) continue;

    // The audit middleware reads this off the body for UPDATE and DELETE.
    if (key === "changeReason") {
      out.changeReason = value;
      continue;
    }

    const relationColumn = shim.relations?.[key];
    if (relationColumn) {
      // Forms submit relation ids as plain strings; be tolerant of `{ id }` too.
      const id =
        value && typeof value === "object"
          ? (value as { id?: string }).id
          : (value as string | undefined);
      // class-validator's @IsUUID rejects "", so send null to clear instead.
      out[relationColumn] = id ? id : null;
      continue;
    }

    const column = shim.fields?.[key];
    if (column) out[column] = value;
  }

  return out;
};

const DROP_FROM_ROW = new Set(["isDeleted", "deletedAt", "deletedBy"]);

/** Backend row → the shape the module's `.types.ts` expects. */
export const toFrontendRow = (shim: EntityShim, row: unknown): unknown => {
  if (!row || typeof row !== "object") return row;

  const source = row as Record<string, unknown>;
  const out: Record<string, unknown> = { id: source.id };

  const scalars = Object.entries(shim.fields ?? {});
  for (const [frontendKey, column] of scalars) {
    if (column in source) out[frontendKey] = source[column];
  }

  for (const [frontendKey, column] of Object.entries(shim.relations ?? {})) {
    // 19 repos DO `include` the relation with `attributes: ["id","name"]`. When
    // one does, take the real label from it.
    const nested = source[shim.aliases?.[frontendKey] ?? frontendKey];
    if (nested && typeof nested === "object" && (nested as { id?: string }).id) {
      const ref = nested as { id: string; name?: string };
      out[frontendKey] = { id: String(ref.id), name: String(ref.name ?? "") };
      continue;
    }
    // B3: the rest have no include, so only the id comes back. Emit the ref with
    // an empty name rather than inventing a label — the cell renders blank and
    // the select keeps the right id, which is honest about what we have.
    const id = source[column];
    if (id) out[frontendKey] = { id: String(id), name: "" };
  }

  // B4 CLOSED on the response side: `formatLimsEntity` already emits `isRemoved`
  // and `modifiedOn`. Only fill them in if an endpoint hasn't been converted yet.
  out.isRemoved = Boolean(source.isRemoved ?? source.isDeleted);
  out.modifiedOn = source.modifiedOn ?? source.updatedAt ?? source.createdAt;

  const consumed = new Set([
    ...scalars.map(([, column]) => column),
    ...Object.values(shim.relations ?? {}),
    ...Object.values(shim.aliases ?? {}),
    // Sequelize emits the snake_case FK alongside the camelCase one.
    ...Object.values(shim.relations ?? {}).map((c) =>
      c.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()
    )
  ]);

  for (const [key, value] of Object.entries(source)) {
    if (key in out || DROP_FROM_ROW.has(key) || consumed.has(key)) continue;
    // Pass through anything the map does not know about, so a column the backend
    // adds later shows up without a code change.
    out[key] = value;
  }

  return out;
};

interface BackendAuditLog {
  id?: string;
  action?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  changeReason?: string | null;
  performedByName?: string | null;
  performedAt?: string | null;
}

const display = (value: unknown): string =>
  value === null || value === undefined
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

/**
 * Backend `{ logs: [...] }` → the flat per-field rows AuditTrailDialog renders.
 *
 * G1: `oldValue` is always null today, so a change cannot be diffed and each log
 * collapses to a single row with no field breakdown. Once the backend records
 * the previous state this fans out into one row per changed field automatically.
 */
export const toFrontendAudit = (payload: unknown): { audit: LimsAuditEntry[] } => {
  // `GET {route}/:id/audit` returns `{ audit: [...] }`; the older global endpoint
  // returned `{ logs: [...] }`. Rows still carry performedByName/performedAt and
  // whole-object old/new values, so they need reshaping either way.
  const source = payload as { audit?: BackendAuditLog[]; logs?: BackendAuditLog[] };
  const logs = (source?.audit ?? source?.logs ?? []) as BackendAuditLog[];

  const entries = logs.flatMap<LimsAuditEntry>((log, index) => {
    const base = {
      id: log.id ?? `audit-${index}`,
      uniqueId: log.id ?? `audit-${index}`,
      action: log.action === "DELETE" ? "REMOVE" : (log.action ?? "UPDATE"),
      changeReason: log.changeReason ?? null,
      who: log.performedByName ?? null,
      when: log.performedAt ?? null
    };

    const before = log.oldValue ?? null;
    const after = log.newValue ?? null;
    if (!before || !after) {
      return [{ ...base, field: null, oldValue: null, newValue: null }];
    }

    const changed = Object.keys(after).filter(
      (key) => display(before[key]) !== display(after[key])
    );
    if (!changed.length) return [{ ...base, field: null, oldValue: null, newValue: null }];

    return changed.map((key) => ({
      ...base,
      id: `${base.id}-${key}`,
      uniqueId: `${base.id}-${key}`,
      field: key,
      oldValue: display(before[key]),
      newValue: display(after[key])
    }));
  });

  return { audit: entries };
};

/**
 * Rewrite an outgoing request onto the endpoints lims-service actually serves.
 * Throws `shimUnavailable` for operations that have no equivalent at all.
 */
export const applyRequestShim = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const parsed = parseLimsUrl(config.url);
  if (!parsed) return config;

  const { shim, rest } = parsed;

  if (!shim.path) {
    throw shimUnavailable(
      `${parsed.key.replace("/lims-", "")} is not built in lims-service yet (punch list B2).`
    );
  }

  // B1: `PATCH {route}/restore/:id` has no counterpart, and `PUT /:id` cannot
  // reach a removed row because the service filters `isDeleted` before updating.
  if (rest.startsWith("/restore/")) {
    throw shimUnavailable("Restore is not available in lims-service yet (punch list B1).");
  }

  const next: AxiosRequestConfig = { ...config };

  // §6: no upload handling exists yet, and multipart would reach `express.json()`
  // and fail as "No data provided" — say what actually happened instead.
  if (next.data instanceof FormData) {
    throw shimUnavailable(
      "File attachments are not supported by lims-service yet — save the record without files."
    );
  }

  next.url = `${shim.path}${rest}`;

  if (next.params) {
    next.params = Object.fromEntries(
      Object.entries(next.params as Record<string, unknown>).filter(
        ([key, value]) => !UNSUPPORTED_PARAMS.test(key) && value !== undefined
      )
    );
  }

  const method = next.method?.toLowerCase();
  if (method === "post" || method === "put") next.data = toBackendBody(shim, next.data);
  // DELETE carries `{ changeReason }`, which auditMiddleware(_, true) requires.
  if (method === "delete" && next.data) next.data = toBackendBody(shim, next.data);

  return next;
};

/** Map a response body back into the frontend contract. */
export const applyResponseShim = (response: AxiosResponse): AxiosResponse => {
  const requestUrl = (response.config as { _limsShimUrl?: string })?._limsShimUrl;
  const parsed = parseLimsUrl(requestUrl);
  if (!parsed?.shim.path) return response;

  if (requestUrl?.endsWith("/audit")) {
    response.data = toFrontendAudit(response.data);
    return response;
  }

  const body = response.data as { data?: unknown } | undefined;
  if (!body || typeof body !== "object") return response;

  if (Array.isArray(body.data)) {
    response.data = { ...body, data: body.data.map((row) => toFrontendRow(parsed.shim, row)) };
  } else if (body.data && typeof body.data === "object") {
    response.data = { ...body, data: toFrontendRow(parsed.shim, body.data) };
  }

  return response;
};

/**
 * `POST {route}/bulk-delete` and `bulk-duplicate` do not exist (B1). Both are
 * emulated with the per-record endpoints that do — every call below is a real
 * request, nothing is faked client-side. Selection by filter cannot be emulated
 * because the server never receives the filter, so it is refused outright.
 */
export const emulateBulk = async (
  operation: "bulk-delete" | "bulk-duplicate",
  url: string,
  body: unknown,
  request: <T>(config: AxiosRequestConfig) => Promise<AxiosResponse<T>>
) => {
  const parsed = parseLimsUrl(url);
  if (!parsed?.shim.path) throw shimUnavailable("Entity is not available in lims-service yet.");

  const payload = (body ?? {}) as { ids?: string[]; changeReason?: string };
  const ids = payload.ids;
  if (!Array.isArray(ids) || !ids.length) {
    throw shimUnavailable(
      'Select-all-matching needs the batch endpoints (punch list B1). Pick rows individually for now.'
    );
  }

  const base = parsed.key;

  if (operation === "bulk-delete") {
    for (const id of ids) {
      await request({
        method: "delete",
        url: `${base}/${id}`,
        data: { changeReason: payload.changeReason }
      });
    }
    return { data: { message: `Removed ${ids.length} record(s)` } };
  }

  for (const id of ids) {
    const existing = await request<{ data?: Record<string, unknown> }>({
      method: "get",
      url: `${base}/${id}`
    });
    const row = { ...(existing.data?.data ?? {}) } as Record<string, unknown>;
    delete row.id;
    delete row.isRemoved;
    delete row.modifiedOn;
    // Mirrors the mock's clone naming so the two behave the same.
    const labelKey = Object.entries(parsed.shim.fields ?? {}).find(
      ([, column]) => column === parsed.shim.labelField
    )?.[0];
    if (labelKey && typeof row[labelKey] === "string") {
      row[labelKey] = `${row[labelKey] as string} (Copy)`;
    }
    await request({ method: "post", url: base, data: row });
  }

  return { data: { message: `Copied ${ids.length} record(s)` } };
};

/**
 * B4: lims-service filters removed rows out unconditionally and has no restore,
 * so "Show removed" cannot work against the real service. The toggle is hidden
 * rather than left inert — STANDARDS.md §10, hide the affordance, never fake it.
 */
export const LIMS_SUPPORTS_REMOVED = !LIMS_SHIM_ENABLED;

/**
 * G4: lims-service parses `search` and then never passes it to a repo, so the
 * box would return the unfiltered list — worse than absent, because it looks
 * like it worked. Hidden until the parameter is actually honoured.
 */
export const LIMS_SUPPORTS_SEARCH = !LIMS_SHIM_ENABLED;

/** Entities with no backend route yet — surfaced in LIMS_FRONTEND_STATUS.md. */
export const LIMS_UNAVAILABLE_ENTITIES = Object.entries(LIMS_SHIM)
  .filter(([, shim]) => !shim.path)
  .map(([route]) => route);
