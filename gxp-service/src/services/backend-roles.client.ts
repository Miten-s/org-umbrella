import ENV from "../utils/environment";

/** Backend is the only store of GXP role definitions. GXP decides who may change them
 * (its own permissions) and calls backend's internal service-roles API through this. */

const REQUEST_TIMEOUT_MS = 5000;

export interface BackendRole {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  permissions: string[];
  isRemoved: boolean;
}

export interface BackendRoleInput {
  name?: string;
  description?: string | null;
  permissions?: string[];
}

export interface RoleChangeActor {
  id?: string;
  email?: string;
}

/** Backend refused the request itself — shown to the user with backend's status. */
export class BackendRoleRejected extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export class BackendRolesUnavailable extends Error {
  statusCode = 503;
  constructor() {
    super(
      "GXP roles are temporarily unavailable, so nothing was changed. Please try again shortly."
    );
  }
}

const call = async <T>(
  path: string,
  body: unknown,
  method = "POST"
): Promise<T> => {
  if (!ENV.INTERNAL_API_KEY || !ENV.BACKEND_INTERNAL_URL) {
    console.error("INTERNAL_API_KEY/BACKEND_INTERNAL_URL not configured");
    throw new BackendRolesUnavailable();
  }
  let response: Response;
  try {
    response = await fetch(
      `${ENV.BACKEND_INTERNAL_URL}/internal/service-roles/gxp${path}`,
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
  if (!response.ok) throw new BackendRolesUnavailable();
  return payload as T;
};

export const queryRoles = (query: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  excludeIds?: string[];
}) => call<{ rows: BackendRole[]; count: number }>("/query", query);

export const lookupRoles = async (ids: string[]) =>
  ids.length
    ? (await call<{ roles: BackendRole[] }>("/lookup", { ids })).roles
    : [];

export const listPermissions = async () =>
  (
    await call<{
      permissions: { id: string; name: string; description: string | null }[];
    }>("/permissions", {})
  ).permissions;

export const createRole = async (
  role: BackendRoleInput,
  actor: RoleChangeActor
) => (await call<{ role: BackendRole }>("", { role, actor })).role;

export const updateRole = async (
  id: string,
  role: BackendRoleInput,
  actor: RoleChangeActor
) =>
  (
    await call<{ role: BackendRole }>(
      `/${encodeURIComponent(id)}`,
      { role, actor },
      "PATCH"
    )
  ).role;

export const removeRoles = async (ids: string[], actor: RoleChangeActor) =>
  ids.length
    ? (await call<{ count: number }>("/remove", { ids, actor })).count
    : 0;
