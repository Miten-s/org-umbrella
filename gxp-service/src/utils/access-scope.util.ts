import { Model, ModelStatic, Op, WhereOptions } from "sequelize";
import { GxpUserContext } from "../services/user-context.service";

/** Mirrors lims-service's AccessScope/groupWhere/withGroupScope (src/utils/crud-factory.ts)
 * — same semantics, ported to gxp's column name (`accessGroupId`, not `groupId` — see
 * migration 025's naming note) and context shape. Backend-only for now: nothing in gxp's
 * create/update payloads sets accessGroupId yet (no group selector in any form), so there
 * is deliberately no write-side `assertGroupInScope` counterpart here yet — add one only
 * once a group selector actually exists for a caller to misuse. */
export interface AccessScope {
  accessGroupIds: string[];
  /** Full bypass — mirrors hasPermission()'s own wildcard rule (Super Admin or
   * GXP:OPERATE:ALL) so nobody who already bypasses permission checks entirely is then
   * blocked by group scope on top of that. */
  bypass: boolean;
  /** False only if authorize() never ran for this request — deny-all, not "sees nothing
   * filtered," in that case: a route wired without authorize() is a bug, not a query with
   * legitimately zero access. */
  resolved: boolean;
}

export const contextToScope = (
  context: GxpUserContext | null | undefined
): AccessScope => {
  if (!context) return { accessGroupIds: [], bypass: false, resolved: false };

  return {
    accessGroupIds: [...context.accessGroupIds],
    bypass: context.isSuperAdmin || context.permissions.has("GXP:OPERATE:ALL"),
    resolved: true
  };
};

/** Builds the group-scoping predicate for `model`. Empty object means "no restriction." */
export const groupWhere = <M extends Model>(
  model: ModelStatic<M>,
  scope: AccessScope
): WhereOptions => {
  if (scope.bypass) return {};
  if (!Object.keys(model.getAttributes()).includes("accessGroupId")) return {};
  if (!scope.resolved) return { id: null } as WhereOptions;
  // A real, resolved member with zero assigned groups sees everything — deliberate,
  // matching lims: this is the safety net that keeps a user who predates group
  // enforcement (or a future user nobody's gotten around to granting a group to) from
  // being silently locked out rather than just ungrouped.
  if (scope.accessGroupIds.length === 0) return {};

  return {
    [Op.or]: [{ accessGroupId: scope.accessGroupIds }, { accessGroupId: null }]
  } as WhereOptions;
};

/** Merges the group scope into an existing `where` without clobbering it (e.g. an
 * existing Op.or from a search filter) — wraps both under Op.and. */
export const withGroupScope = <M extends Model>(
  model: ModelStatic<M>,
  scope: AccessScope,
  where: WhereOptions
): WhereOptions => {
  const scoped = groupWhere(model, scope);
  if (
    !Object.keys(scoped).length &&
    !Object.getOwnPropertySymbols(scoped).length
  ) {
    return where;
  }
  return { [Op.and]: [where, scoped] } as WhereOptions;
};
