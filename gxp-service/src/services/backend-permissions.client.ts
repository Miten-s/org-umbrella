import CircuitBreaker from "opossum";
import ENV from "../utils/environment";

const REQUEST_TIMEOUT_MS = 3000;

/** Must stay above REQUEST_TIMEOUT_MS: if the breaker gave up first it would record a
 * failure and move on while the request was still in flight, leaving it dangling. */
const BREAKER_TIMEOUT_MS = 3500;

export const PERMISSIONS_BREAKER_OPTIONS = {
  timeout: BREAKER_TIMEOUT_MS,
  errorThresholdPercentage: 50,
  volumeThreshold: 5,
  resetTimeout: 30_000
};

/** `ok: false` means "couldn't determine" (timeout, network error, non-2xx, open breaker) —
 * distinct from a confirmed, genuinely empty permission set. Collapsing the two into a bare
 * `[]` previously made every caller's "fail closed" ambiguous with "this role/user really
 * has no permissions," which is the wrong default for some callers (e.g. a privilege-
 * escalation check must BLOCK on `ok: false`, not treat it as "nothing to escalate to").
 * Callers decide what "closed" means for their own check. */
export interface PermissionsFetchResult {
  ok: boolean;
  permissions: string[];
}

const FAILURE: PermissionsFetchResult = { ok: false, permissions: [] };

/** Throws on any failure — the breaker only counts rejections, so swallowing errors here
 * would make every outage look like a success and the circuit would never open. */
const requestPermissions = async (
  path: string
): Promise<PermissionsFetchResult> => {
  const response = await fetch(`${ENV.BACKEND_INTERNAL_URL}${path}`, {
    headers: { "x-internal-api-key": ENV.INTERNAL_API_KEY as string },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(
      `backend permissions API returned ${response.status} for ${path}`
    );
  }

  const body = (await response.json()) as { permissions?: string[] };
  return { ok: true, permissions: body.permissions ?? [] };
};

/** Exported so tests can build one with a short resetTimeout and observe the real
 * open -> half-open -> close cycle without waiting 30s. */
export const createPermissionsBreaker = (
  request: (path: string) => Promise<PermissionsFetchResult>,
  options: Partial<typeof PERMISSIONS_BREAKER_OPTIONS> = {}
) => {
  const breaker = new CircuitBreaker(request, {
    ...PERMISSIONS_BREAKER_OPTIONS,
    ...options
  });

  // With a fallback registered the breaker resolves instead of rejecting, which keeps the
  // "never throws, returns { ok: false }" contract callers rely on.
  breaker.fallback(() => FAILURE);
  return breaker;
};

const breaker = createPermissionsBreaker(requestPermissions);

breaker.on("open", () =>
  console.error("gxp-service: backend permissions API circuit opened")
);
breaker.on("close", () =>
  console.info("gxp-service: backend permissions API circuit closed")
);

/** Calls backend's internal permissions API (replaces the old direct read into
 * `auth-service`'s tables). Never throws — a timeout, network error, non-2xx response, or
 * an open breaker all resolve to `{ ok: false }` so callers can apply their own fail-closed
 * handling instead of silently receiving an indistinguishable empty result. */
const callBackend = async (path: string): Promise<PermissionsFetchResult> => {
  if (!ENV.INTERNAL_API_KEY || !ENV.BACKEND_INTERNAL_URL) {
    console.error("INTERNAL_API_KEY/BACKEND_INTERNAL_URL not configured");
    return FAILURE;
  }

  return breaker.fire(path);
};

export const fetchPermissionsForUser = (
  userId: string
): Promise<PermissionsFetchResult> =>
  callBackend(`/internal/permissions/user/${encodeURIComponent(userId)}`);

export const fetchPermissionsForRoleIds = (
  roleIds: string[]
): Promise<PermissionsFetchResult> => {
  if (roleIds.length === 0)
    return Promise.resolve({ ok: true, permissions: [] });
  const query = roleIds.map(encodeURIComponent).join(",");
  return callBackend(`/internal/permissions/by-roles?roleIds=${query}`);
};
