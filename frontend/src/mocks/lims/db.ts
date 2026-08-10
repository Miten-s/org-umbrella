/**
 * In-memory stand-in for lims-service, implementing the contract in
 * LIMS_BACKEND_SPEC.md. Delete this folder once the real service is up.
 *
 * Deliberately generic: one engine drives every entity, so the mocks can't
 * drift entity-by-entity and there is no bespoke per-entity fake to maintain.
 */

export interface MockRow extends Record<string, unknown> {
  id: string;
  isRemoved?: boolean;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface MockAuditRow {
  id: string;
  uniqueId: string;
  action: "CREATE" | "UPDATE" | "REMOVE" | "RESTORE";
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changeReason?: string | null;
  who?: string;
  when?: string;
}

export interface MockEntity {
  /** Route segment, e.g. "lims-locations". */
  route: string;
  /** Key the array is returned under, e.g. "locations". */
  dataKey: string;
  /** Business key shown in the audit trail, e.g. "locationId". */
  uniqueField: string;
  /** Field the clone suffix is applied to, e.g. "locationName". */
  labelField: string;
  /** Fields `search` matches against. */
  searchFields: string[];
  rows: MockRow[];
}

const MOCK_USER = "mock.user";

export const nowIso = () => new Date().toISOString();
export const newId = () => crypto.randomUUID();

/** Registry of every mocked entity, keyed by route. */
const registry = new Map<string, MockEntity>();
const auditLog = new Map<string, MockAuditRow[]>();

export const registerEntity = (entity: MockEntity) => {
  registry.set(entity.route, entity);
  if (!auditLog.has(entity.route)) auditLog.set(entity.route, []);
};

export const getEntity = (route: string) => registry.get(route);

export const listEntities = () => [...registry.values()];

const pushAudit = (route: string, row: MockAuditRow) => {
  const log = auditLog.get(route) ?? [];
  log.unshift(row);
  auditLog.set(route, log);
};

export const getAudit = (route: string, recordId: string) => {
  const entity = registry.get(route);
  const record = entity?.rows.find((r) => r.id === recordId);
  const uniqueId = String(record?.[entity?.uniqueField ?? "id"] ?? recordId);
  return (auditLog.get(route) ?? []).filter((entry) => entry.uniqueId === uniqueId);
};

export const recordAudit = (
  route: string,
  record: MockRow,
  action: MockAuditRow["action"],
  changes: { field?: string; oldValue?: unknown; newValue?: unknown }[] = [],
  changeReason?: string
) => {
  const entity = registry.get(route);
  const uniqueId = String(record[entity?.uniqueField ?? "id"] ?? record.id);
  const base = { uniqueId, action, changeReason: changeReason ?? null, who: MOCK_USER, when: nowIso() };

  if (!changes.length) {
    pushAudit(route, { id: newId(), field: null, oldValue: null, newValue: null, ...base });
    return;
  }

  changes.forEach((change) =>
    pushAudit(route, {
      id: newId(),
      field: change.field ?? null,
      oldValue: change.oldValue == null ? null : String(change.oldValue),
      newValue: change.newValue == null ? null : String(change.newValue),
      ...base
    })
  );
};

/** Field-level diff so the audit trail shows one row per changed field. */
export const diffFields = (before: MockRow, after: Record<string, unknown>) =>
  Object.keys(after)
    .filter((key) => key !== "changeReason" && key !== "id")
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({ field: key, oldValue: before[key], newValue: after[key] }));

export interface ListArgs {
  page: number;
  limit: number;
  search?: string;
  includeRemoved: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const queryList = (entity: MockEntity, args: ListArgs) => {
  let rows = entity.rows.filter((row) => (args.includeRemoved ? true : !row.isRemoved));

  if (args.search) {
    const term = args.search.toLowerCase();
    rows = rows.filter((row) =>
      entity.searchFields.some((field) =>
        String(row[field] ?? "").toLowerCase().includes(term)
      )
    );
  }

  if (args.sortBy) {
    const dir = args.sortDir === "desc" ? -1 : 1;
    rows = [...rows].sort(
      (a, b) =>
        String(a[args.sortBy as string] ?? "").localeCompare(
          String(b[args.sortBy as string] ?? "")
        ) * dir
    );
  }

  const totalCount = rows.length;
  const start = (args.page - 1) * args.limit;

  return {
    rows: rows.slice(start, start + args.limit),
    metadata: {
      totalCount,
      currentPage: args.page,
      limit: args.limit,
      totalPages: Math.max(1, Math.ceil(totalCount / Math.max(1, args.limit)))
    }
  };
};

/** Clone naming: `Cold Room` → `Cold Room-(1)`, unique among active rows. */
export const cloneName = (entity: MockEntity, value: string) => {
  const base = value.replace(/-\(\d+\)$/, "");
  const taken = new Set(
    entity.rows.filter((r) => !r.isRemoved).map((r) => String(r[entity.labelField] ?? ""))
  );
  let index = 1;
  while (taken.has(`${base}-(${index})`)) index += 1;
  return `${base}-(${index})`;
};

export const createRow = (entity: MockEntity, payload: Record<string, unknown>) => {
  const row: MockRow = {
    ...payload,
    id: newId(),
    isRemoved: false,
    createdOn: nowIso(),
    createdBy: MOCK_USER,
    modifiedOn: nowIso(),
    modifiedBy: MOCK_USER
  };
  entity.rows.unshift(row);
  recordAudit(entity.route, row, "CREATE");
  return row;
};

export const updateRow = (
  entity: MockEntity,
  id: string,
  payload: Record<string, unknown>
) => {
  const row = entity.rows.find((r) => r.id === id);
  if (!row) return undefined;

  const { changeReason, ...rest } = payload as { changeReason?: string };
  const changes = diffFields(row, rest);
  Object.assign(row, rest, { modifiedOn: nowIso(), modifiedBy: MOCK_USER });
  recordAudit(entity.route, row, "UPDATE", changes, changeReason);
  return row;
};

export const softDelete = (entity: MockEntity, ids: string[], changeReason?: string) => {
  let count = 0;
  ids.forEach((id) => {
    const row = entity.rows.find((r) => r.id === id && !r.isRemoved);
    if (!row) return;
    row.isRemoved = true;
    row.modifiedOn = nowIso();
    recordAudit(entity.route, row, "REMOVE", [], changeReason);
    count += 1;
  });
  return count;
};

export const restoreRow = (entity: MockEntity, id: string, changeReason?: string) => {
  const row = entity.rows.find((r) => r.id === id);
  if (!row) return undefined;
  row.isRemoved = false;
  row.modifiedOn = nowIso();
  recordAudit(entity.route, row, "RESTORE", [], changeReason);
  return row;
};

export const duplicateRows = (entity: MockEntity, ids: string[]) => {
  const clones = ids
    .map((id) => entity.rows.find((r) => r.id === id))
    .filter(Boolean)
    .map((source) => {
      const clone: MockRow = {
        ...(source as MockRow),
        id: newId(),
        isRemoved: false,
        createdOn: nowIso(),
        modifiedOn: nowIso(),
        [entity.labelField]: cloneName(entity, String((source as MockRow)[entity.labelField] ?? ""))
      };
      return clone;
    });

  clones.forEach((clone) => {
    entity.rows.unshift(clone);
    recordAudit(entity.route, clone, "CREATE");
  });

  return clones.length;
};
