import { Transaction } from "sequelize";
import ENV from "../utils/environment";
import { sequelize } from "../configs/db.sequelize";
import { logError, logInfo } from "../configs/logger.config";
import Role from "../models/role.model";
import RoleEntry from "../models/role-entry.model";
import { AuditActor } from "../utils/audit.util";
import { parsePermissionSource } from "./permission-parity";

/** Mirrors Lab Roles into backend's roles whenever one changes. LIMS's screens and tables
 * stay the place roles are edited; backend holds what each role grants and audits every
 * change. Runs inside the role write's own transaction (crud-factory's `beforeCommit`). */

const PUSH_TIMEOUT_MS = 5000;

/** Every push takes this lock in its own transaction, so pushes reach backend in commit
 * order — an older full set can never land after a newer one and undo it. */
const MIRROR_LOCK_KEY = 74_201_377;

/** How often the background catch-up runs, and how soon after a failed push. */
const CATCH_UP_INTERVAL_MS = 10 * 60 * 1000;
const CATCH_UP_RETRY_MS = 30 * 1000;

interface SyncResponse {
  pointers: { limsRoleId: string; backendRoleId: string }[];
  changed?: { limsRoleId: string; action: string }[];
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

type MirroredRole = Role & { entries?: RoleEntry[] };

/** Reads every Lab Role (deleted ones included: backend converges on the whole set) and
 * pushes it, holding the mirror lock until `transaction` ends. */
const pushAllRoles = async (
  transaction: Transaction,
  actor?: AuditActor,
  changeReason?: string
): Promise<{ roles: MirroredRole[]; result: SyncResponse }> => {
  await sequelize.query("SELECT pg_advisory_xact_lock(:key)", {
    replacements: { key: MIRROR_LOCK_KEY },
    transaction
  });

  const roles = (await Role.findAll({
    include: [{ model: RoleEntry, as: "entries", required: false }],
    transaction
  })) as MirroredRole[];

  const result = await pushRoles({
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
    actor: actor ? { id: actor.id } : undefined,
    changeReason
  });
  return { roles, result };
};

const savePointers = async (
  roles: MirroredRole[],
  result: SyncResponse,
  transaction: Transaction
) => {
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

let catchUpTimer: NodeJS.Timeout | null = null;

const scheduleCatchUp = (delayMs: number) => {
  if (catchUpTimer) clearTimeout(catchUpTimer);
  catchUpTimer = setTimeout(() => void catchUpRolesWithBackend(), delayMs);
  catchUpTimer.unref();
};

/** Pushes the current Lab Roles to backend outside of any edit. Repairs a change saved in
 * "dual" mode while backend was down, and any other drift. Never throws. */
export const catchUpRolesWithBackend = async (): Promise<boolean> => {
  if (parsePermissionSource(ENV.LIMS_PERMISSION_SOURCE) === "local")
    return true;
  try {
    const changed = await sequelize.transaction(async (transaction) => {
      const { roles, result } = await pushAllRoles(
        transaction,
        undefined,
        "LIMS catch-up after a missed role change"
      );
      await savePointers(roles, result, transaction);
      return result.changed?.length ?? 0;
    });
    if (changed) logInfo("LIMS roles caught up with backend", { changed });
    scheduleCatchUp(CATCH_UP_INTERVAL_MS);
    return true;
  } catch (error) {
    logError(
      "LIMS role catch-up with backend failed, will retry",
      { error: String(error) },
      "catchUpRolesWithBackend"
    );
    scheduleCatchUp(CATCH_UP_RETRY_MS);
    return false;
  }
};

/** Started once at boot: an early first run covers changes missed before a restart. */
export const startRoleMirrorCatchUp = () => scheduleCatchUp(CATCH_UP_RETRY_MS);

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

  let pushed: Awaited<ReturnType<typeof pushAllRoles>>;
  try {
    pushed = await pushAllRoles(transaction, actor, changeReason);
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
    // editing them: the catch-up carries this change across once backend answers again.
    logError(
      "LIMS role change saved but not mirrored to backend",
      { error: String(error) },
      "mirrorRolesToBackend"
    );
    scheduleCatchUp(CATCH_UP_RETRY_MS);
    return;
  }

  await savePointers(pushed.roles, pushed.result, transaction);
};
