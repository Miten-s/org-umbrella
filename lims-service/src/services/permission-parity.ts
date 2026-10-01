/** Compares LIMS's own permission resolution with backend's, for the C6 dual-read. Pure —
 * no I/O — so the definition of "match" is pinned down by tests. */

export const LIMS_OPERATE_ALL = "LIMS:OPERATE:ALL";

export type PermissionSource = "local" | "dual" | "backend";

export interface ResolvedPermissions {
  permissions: Set<string>;
  operateAll: boolean;
}

export interface ParityResult {
  match: boolean;
  localOperateAll: boolean;
  backendOperateAll: boolean;
  onlyLocal: string[];
  onlyBackend: string[];
}

/** - "local":   LIMS enforces its own roles and never contacts backend.
 *  - "dual":    LIMS enforces its own roles and compares with backend in the background.
 *  - "backend": LIMS enforces what backend says the assigned roles grant.
 * Defaults to "dual". Anything unrecognised falls back to "local", the one mode with no
 * dependency on backend at all. */
export const parsePermissionSource = (
  raw: string | undefined
): PermissionSource => {
  if (raw === undefined || raw === "" || raw === "dual") return "dual";
  if (raw === "backend") return "backend";
  return "local";
};

/** Backend answers with every permission the platform user holds, across all services.
 * Only LIMS ones count here, and the namespaced wildcard is LIMS's operate_all. The bare
 * platform OPERATE:ALL is deliberately not treated as operate_all: platform Super Admin is
 * handled on its own path before either resolution runs. */
export const fromBackendPermissions = (
  names: string[]
): ResolvedPermissions => {
  const lims = names.filter((name) => name.startsWith("LIMS:"));
  return {
    operateAll: lims.includes(LIMS_OPERATE_ALL),
    permissions: new Set(lims.filter((name) => name !== LIMS_OPERATE_ALL))
  };
};

/** A mismatch is a difference in what the user could actually do. When both sides grant
 * operate_all the individual permission lists are irrelevant — the wildcard covers them —
 * so differences there are not reported as mismatches. */
export const comparePermissions = (
  local: ResolvedPermissions,
  backend: ResolvedPermissions
): ParityResult => {
  const onlyLocal = [...local.permissions]
    .filter((p) => !backend.permissions.has(p))
    .sort();
  const onlyBackend = [...backend.permissions]
    .filter((p) => !local.permissions.has(p))
    .sort();

  const bothWildcard = local.operateAll && backend.operateAll;
  const match =
    local.operateAll === backend.operateAll &&
    (bothWildcard || (onlyLocal.length === 0 && onlyBackend.length === 0));

  return {
    match,
    localOperateAll: local.operateAll,
    backendOperateAll: backend.operateAll,
    onlyLocal,
    onlyBackend
  };
};
