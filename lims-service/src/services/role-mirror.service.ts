import { Transaction } from "sequelize";
import ENV from "../utils/environment";
import { logError } from "../configs/logger.config";
import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import { AuditActor } from "../utils/audit.util";
import { parsePermissionSource } from "./permission-parity";

/** Mirrors Lab Roles into backend's roles whenever one changes. LIMS's screens and tables
 * stay the place roles are edited; backend holds what each role grants and audits every
 * change. Runs inside the role write's own transaction (crud-factory's `beforeCommit`). */

const PUSH_TIMEOUT_MS = 5000;

interface SyncResponse {
  pointers: { limsRoleId: string; backendRoleId: string }[];
}

/** Backend refused the change itself (e.g. the name is already used by another backend
 * role). Not an outage: retrying won't help, so the edit must fail and say why. */
export class RoleMirrorRejected extends Error {
  statusCode = 409;
}

/** Backend could not be reached or answered with an error. */
export class RoleMirrorUnavailable extends Error {
  statusCode = 503;
}

const pushRoles = async (body: unknown): Promise<SyncResponse> => {
  if (!ENV.INTERNAL_API_KEY || !ENV.BACKEND_INTERNAL_URL) {
    throw new RoleMirrorUnavailable(
      "INTERNAL_API_KEY/BACKEND_INTERNAL_URL not configured"
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${ENV.BACKEND_INTERNAL_URL}/internal/lims-roles/sync`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-internal-api-key": ENV.INTERNAL_API_KEY
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PUSH_TIMEOUT_MS)
      }
    );
  } catch (error) {
    throw new RoleMirrorUnavailable(`backend unreachable: ${String(error)}`);
  }

  if (response.status === 409) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new RoleMirrorRejected(
      payload.error ?? "Backend rejected this role change."
    );
  }
  if (!response.ok) {
    throw new RoleMirrorUnavailable(`backend answered ${response.status}`);
  }
  return (await response.json()) as SyncResponse;
};

export const mirrorRolesToBackend = async ({
  transaction,
  actor,
  changeReason
}: {
  transaction: Transaction;
  actor: AuditActor;
  changeReason?: string;
}): Promise<void> => {
  // "local" is the mode with no dependency on backend at all; migrate-lims-roles.ts
  // catches backend up if mirroring is switched back on later.
  const source = parsePermissionSource(ENV.LIMS_PERMISSION_SOURCE);
  if (source === "local") return;

  // Read through the write's own transaction, so this is the state about to be committed.
  // Every role is sent, deleted ones included: backend converges on the whole set.
  const roles = (await Role.findAll({
    include: [{ model: RoleEntry, as: "entries", required: false }],
    transaction
  })) as (Role & { entries?: RoleEntry[] })[];

  let result: SyncResponse;
  try {
    result = await pushRoles({
      roles: roles.map((role) => ({
        id: role.id,
        roleCode: role.roleId,
        name: role.name,
        operateAll: role.operateAll,
        isDeleted: role.isDeleted,
        deletedAt: role.deletedAt,
        backendRoleId: role.backendRoleId ?? null
      })),
      entries: roles.flatMap((role) =>
        (role.entries ?? []).map((entry) => ({
          roleId: role.id,
          entry: entry.entry,
          canView: entry.canView,
          canCreate: entry.canCreate,
          canEdit: entry.canEdit,
          canRemove: entry.canRemove
        }))
      ),
      actor: { id: actor.id },
      changeReason
    });
  } catch (error) {
    // A conflict fails the edit in any mode — it would never resolve on its own.
    if (error instanceof RoleMirrorRejected) throw error;

    // Once backend is what LIMS enforces, a change that didn't reach it would be saved but
    // have no effect — or, for a revocation, leave access in place. So the edit fails.
    if (source === "backend") {
      throw new RoleMirrorUnavailable(
        "This role change could not be applied to access control, so nothing was saved. Please try again shortly."
      );
    }

    // While LIMS still enforces its own roles, a backend outage must not stop lab managers
    // editing them: the next successful push (or migrate-lims-roles.ts) carries this change
    // across, and the parity check shows the gap meanwhile.
    logError(
      "LIMS role change saved but not mirrored to backend",
      { error: String(error) },
      "mirrorRolesToBackend"
    );
    return;
  }

  const pointers = new Map(
    result.pointers.map((p) => [p.limsRoleId, p.backendRoleId])
  );
  for (const role of roles) {
    const backendRoleId = pointers.get(role.id);
    if (backendRoleId && backendRoleId !== role.backendRoleId) {
      await Role.update(
        { backendRoleId },
        { where: { id: role.id }, transaction }
      );
    }
  }
};
