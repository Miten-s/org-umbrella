import ENV from "../utils/environment";

const REQUEST_TIMEOUT_MS = 3000;
const FAILURE_THRESHOLD = 5;
const OPEN_COOLDOWN_MS = 30_000;

let consecutiveFailures = 0;
let openUntil = 0;

const isOpen = () => Date.now() < openUntil;

const recordFailure = () => {
  consecutiveFailures += 1;
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    openUntil = Date.now() + OPEN_COOLDOWN_MS;
  }
};

const recordSuccess = () => {
  consecutiveFailures = 0;
  openUntil = 0;
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

/** Calls backend's internal permissions API (replaces the old direct read into
 * `auth-service`'s tables). Never throws — a timeout, network error, non-2xx response, or
 * an open breaker all resolve to `{ ok: false }` so callers can apply their own fail-closed
 * handling instead of silently receiving an indistinguishable empty result. */
const callBackend = async (path: string): Promise<PermissionsFetchResult> => {
  if (!ENV.INTERNAL_API_KEY || !ENV.BACKEND_INTERNAL_URL) {
    console.error("INTERNAL_API_KEY/BACKEND_INTERNAL_URL not configured");
    return FAILURE;
  }

  if (isOpen()) return FAILURE;

  try {
    const response = await fetch(`${ENV.BACKEND_INTERNAL_URL}${path}`, {
      headers: { "x-internal-api-key": ENV.INTERNAL_API_KEY },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!response.ok) {
      recordFailure();
      return FAILURE;
    }

    const body = (await response.json()) as { permissions?: string[] };
    recordSuccess();
    return { ok: true, permissions: body.permissions ?? [] };
  } catch (error) {
    recordFailure();
    console.error("backend permissions API call failed:", error);
    return FAILURE;
  }
};

export const fetchPermissionsForUser = (
  userId: string
): Promise<PermissionsFetchResult> =>
  callBackend(`/internal/permissions/user/${encodeURIComponent(userId)}`);
