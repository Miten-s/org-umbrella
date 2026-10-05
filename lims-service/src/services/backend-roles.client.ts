import ENV from "../utils/environment";

/** Backend is the only store of Lab Role definitions (name, code, description, what each
 * grants). LIMS decides who may change them — its own permissions and lab groups — and then
 * calls backend's internal service-roles API through this client. */

const REQUEST_TIMEOUT_MS = 5000;

/** A role as backend stores it. `permissions` are backend names: "LIMS:VIEW:SAMPLE", and
 * "LIMS:OPERATE:ALL" for the LIMS-wide wildcard. */
export interface BackendRole {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  permissions: string[];
  isRemoved: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendRoleInput {
  code?: string | null;
  name?: string;
  description?: string | null;
  permissions?: string[];
}

export interface BackendRoleQuery {
  search?: string;
  filters?: Record<string, string>;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  page?: number;
  limit?: number;
  includeRemoved?: boolean;
  excludeIds?: string[];
}

export interface RoleChangeActor {
  id?: string;
  email?: string;
}

/** Backend refused the request itself (bad input, conflict, protected role) — shown to the
 * user as-is with backend's status. */
export class BackendRoleRejected extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

/** Backend could not be reached or failed. Nothing was saved. */
export class BackendRolesUnavailable extends Error {
  statusCode = 503;
  constructor() {
    super(
      "Lab Roles are temporarily unavailable, so nothing was changed. Please try again shortly."
    );
  }
}

const call = async <T>(
  method: "POST" | "PATCH" | "PUT",
  path: string,
  body: unknown
): Promise<T> => {
  if (!ENV.INTERNAL_API_KEY || !ENV.BACKEND_INTERNAL_URL) {
    console.error("INTERNAL_API_KEY/BACKEND_INTERNAL_URL not configured");
    throw new BackendRolesUnavailable();
  }

  let response: Response;
  try {
    response = await fetch(
      `${ENV.BACKEND_INTERNAL_URL}/internal/service-roles/lims${path}`,
      {
        method,
        headers: {
          "content-type": "application/json",
          "x-internal-api-key": ENV.INTERNAL_API_KEY
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      }
    );
  } catch (error) {
    console.error("backend service-roles API unreachable:", error);
    throw new BackendRolesUnavailable();
  }

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (response.status >= 400 && response.status < 500) {
    throw new BackendRoleRejected(
      String(payload.error ?? "Backend refused this role change."),
      response.status
    );
  }
  if (!response.ok) {
    console.error(`backend service-roles API answered ${response.status}`);
    throw new BackendRolesUnavailable();
  }
  return payload as T;
};

export const queryRoles = (query: BackendRoleQuery) =>
  call<{ rows: BackendRole[]; count: number }>("POST", "/query", query);

export const lookupRoles = async (
  ids: string[],
  includeRemoved = true
): Promise<BackendRole[]> => {
  if (!ids.length) return [];
  return (
    await call<{ roles: BackendRole[] }>("POST", "/lookup", {
      ids,
      includeRemoved
    })
  ).roles;
};

export const createRole = async (
  role: BackendRoleInput,
  actor: RoleChangeActor,
  reason?: string
) =>
  (await call<{ role: BackendRole }>("POST", "", { role, actor, reason })).role;

export const updateRole = async (
  id: string,
  role: BackendRoleInput,
  actor: RoleChangeActor,
  reason?: string
) =>
  (
    await call<{ role: BackendRole }>("PATCH", `/${encodeURIComponent(id)}`, {
      role,
      actor,
      reason
    })
  ).role;

export const setRolesRemoved = async (
  ids: string[],
  removed: boolean,
  actor: RoleChangeActor,
  reason?: string
): Promise<number> => {
  if (!ids.length) return 0;
  return (
    await call<{ count: number }>("POST", removed ? "/remove" : "/restore", {
      ids,
      actor,
      reason
    })
  ).count;
};

export const registerCatalogue = (
  permissions: { name: string; description: string }[]
) =>
  call<{ added: number; updated: number; removed: number }>(
    "PUT",
    "/catalogue",
    { permissions }
  );

/** The role with this code (any state), or one created with `input` — for seed scripts. */
export const ensureRole = async (
  code: string,
  input: BackendRoleInput
): Promise<BackendRole> => {
  const { rows } = await queryRoles({
    search: code,
    includeRemoved: true,
    limit: 500
  });
  const existing = rows.find(
    (row) => row.code?.toLowerCase() === code.toLowerCase()
  );
  if (existing) return existing;
  return createRole({ ...input, code }, {}, "Seeded");
};
