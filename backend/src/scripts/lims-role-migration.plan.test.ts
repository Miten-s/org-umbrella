import fs from "fs";
import path from "path";
import {
  ACTION_COLUMN,
  LIMS_ACTIONS,
  LIMS_OPERATE_ALL,
  PLATFORM_OPERATE_ALL,
  BackendRole,
  BackendState,
  LimsEntryRow,
  LimsRoleRow,
  buildMigrationPlan,
  deterministicUuid,
  permissionsForEntries
} from "./lims-role-migration.plan";

const LIMS_PERMISSIONS_SOURCE = path.resolve(
  __dirname,
  "../../../lims-service/src/utils/permissions.ts"
);

const ENTITIES = ["SAMPLE", "RESULT", "USER"];

const allPermissions = () => {
  const names = [LIMS_OPERATE_ALL];
  for (const e of ENTITIES)
    for (const a of LIMS_ACTIONS) names.push(`LIMS:${a}:${e}`);
  return new Map(names.map((n, i) => [n, `perm-${i}`]));
};

const SEEDED_MASTER: BackendRole = {
  id: "seeded-master",
  name: "LIMS Master Admin",
  type: "Lims_Service",
  deleted: false,
  permissions: [LIMS_OPERATE_ALL]
};

const backend = (
  extraRoles: BackendRole[] = [],
  overrides: Partial<BackendState> = {}
): BackendState => {
  const roles = [SEEDED_MASTER, ...extraRoles];
  return {
    permissionIdsByName: allPermissions(),
    rolesByName: new Map(roles.map((r) => [r.name, r])),
    rolesById: new Map(roles.map((r) => [r.id, r])),
    alreadyMigrated: new Map(),
    ...overrides
  };
};

const role = (overrides: Partial<LimsRoleRow> = {}): LimsRoleRow => ({
  id: "lims-role-1",
  roleCode: "LAB_USER",
  name: "Lab User",
  operateAll: false,
  isDeleted: false,
  deletedAt: null,
  backendRoleId: null,
  ...overrides
});

const entry = (overrides: Partial<LimsEntryRow> = {}): LimsEntryRow => ({
  roleId: "lims-role-1",
  entry: "SAMPLE",
  canView: false,
  canCreate: false,
  canEdit: false,
  canRemove: false,
  ...overrides
});

// A Lab User already migrated with VIEW:SAMPLE, used by the sync tests.
const MIGRATED_ID = "backend-lab-user";
const migratedBackend = (current: Partial<BackendRole> = {}) =>
  backend(
    [
      {
        id: MIGRATED_ID,
        name: "Lab User",
        type: "Lims_Service",
        deleted: false,
        permissions: ["LIMS:VIEW:SAMPLE"],
        ...current
      }
    ],
    { alreadyMigrated: new Map([["lims-role-1", MIGRATED_ID]]) }
  );

describe("ACTION_COLUMN parity with lims-service", () => {
  // The plan says reuse the existing mapping, not a subtly different one. rootDir stops
  // backend importing it, so compare against lims-service's actual source instead.
  it("matches lims-service/src/utils/permissions.ts exactly", () => {
    const source = fs.readFileSync(LIMS_PERMISSIONS_SOURCE, "utf8");
    const block = source.match(
      /export const ACTION_COLUMN[\s\S]*?=\s*\{([\s\S]*?)\};/
    );
    expect(block).not.toBeNull();

    const lims = Object.fromEntries(
      [...block![1].matchAll(/(\w+)\s*:\s*"(\w+)"/g)].map((m) => [m[1], m[2]])
    );
    expect(lims).toEqual(ACTION_COLUMN);
  });

  it("matches lims-service's LIMS_ACTIONS exactly", () => {
    const source = fs.readFileSync(LIMS_PERMISSIONS_SOURCE, "utf8");
    const actions = source.match(/export const LIMS_ACTIONS = \[([^\]]*)\]/);
    expect(actions).not.toBeNull();
    expect([...actions![1].matchAll(/"(\w+)"/g)].map((m) => m[1])).toEqual([
      ...LIMS_ACTIONS
    ]);
  });
});

describe("permission conversion", () => {
  // UPDATE comes from canEdit and DELETE from canRemove — the wire names differ from the
  // column names, which is exactly where a reimplementation would go subtly wrong.
  it("maps each boolean through ACTION_COLUMN", () => {
    expect(
      permissionsForEntries([
        entry({ canView: true, canEdit: true }),
        entry({ entry: "RESULT", canRemove: true })
      ])
    ).toEqual(["LIMS:DELETE:RESULT", "LIMS:UPDATE:SAMPLE", "LIMS:VIEW:SAMPLE"]);
  });

  it("grants nothing for an entry with every flag off", () => {
    expect(permissionsForEntries([entry()])).toEqual([]);
  });
});

describe("operate_all", () => {
  it("becomes the namespaced LIMS wildcard, never the platform one", () => {
    const plan = buildMigrationPlan(
      [
        role({
          name: "LIMS Administrator",
          roleCode: "LIMS_ADMIN",
          operateAll: true
        })
      ],
      [],
      backend()
    );

    expect(plan.roles[0].permissions).toEqual([LIMS_OPERATE_ALL]);
    expect(plan.roles[0].permissions).not.toContain(PLATFORM_OPERATE_ALL);
    expect(plan.blockers).toEqual([]);
  });

  it("keeps the namespaced constant distinct from the platform super-admin string", () => {
    expect(LIMS_OPERATE_ALL).not.toBe(PLATFORM_OPERATE_ALL);
  });
});

describe("creating roles", () => {
  it("creates a new role with a deterministic id and asks for its LIMS pointer", () => {
    const plan = buildMigrationPlan(
      [role()],
      [entry({ canView: true })],
      backend()
    );

    expect(plan.roles[0]).toMatchObject({
      action: "create",
      backendRoleId: deterministicUuid("lims-role:lims-role-1"),
      permissions: ["LIMS:VIEW:SAMPLE"],
      pointerWrite: true
    });
  });

  it("carries a soft-deleted role across as deleted, keeping its permissions as history", () => {
    const deletedAt = new Date("2026-09-01T00:00:00Z");
    const plan = buildMigrationPlan(
      [role({ isDeleted: true, deletedAt })],
      [entry({ canView: true })],
      backend()
    );

    expect(plan.roles[0].action).toBe("create");
    expect(plan.roles[0].deletedAt).toEqual(deletedAt);
    expect(plan.roles[0].permissions).toEqual(["LIMS:VIEW:SAMPLE"]);
    expect(plan.warnings.join(" ")).toMatch(/permanently unavailable/);
  });
});

describe("LIMS Master Admin", () => {
  const masterAdmin = (overrides: Partial<LimsRoleRow> = {}) =>
    role({
      id: "lma",
      roleCode: "LIMS_MASTER_ADMIN",
      name: "LIMS Master Admin",
      operateAll: true,
      ...overrides
    });

  it("maps onto the role migration 022 seeded instead of creating a duplicate", () => {
    const plan = buildMigrationPlan([masterAdmin()], [], backend());

    expect(plan.roles[0]).toMatchObject({
      action: "map_to_master_admin",
      backendRoleId: "seeded-master",
      pointerWrite: true
    });
    expect(plan.blockers).toEqual([]);
  });

  // It is a protected fixture: pointed at, never edited, even if LIMS's copy has entries.
  it("is never synced once mapped", () => {
    const plan = buildMigrationPlan(
      [masterAdmin({ backendRoleId: "seeded-master" })],
      [entry({ roleId: "lma", canView: true })],
      backend([], { alreadyMigrated: new Map([["lma", "seeded-master"]]) })
    );

    expect(plan.roles[0]).toMatchObject({
      action: "in_sync",
      pointerWrite: false
    });
  });

  it("blocks the run if the seeded role is missing", () => {
    const plan = buildMigrationPlan([masterAdmin()], [], {
      ...backend(),
      rolesByName: new Map()
    });

    expect(plan.blockers.map((b) => b.kind)).toEqual(["master_admin_missing"]);
  });
});

describe("collisions are detected before anything is written", () => {
  it("blocks on a name already used by an active backend role", () => {
    const plan = buildMigrationPlan(
      [role()],
      [],
      backend([
        {
          id: "x",
          name: "Lab User",
          type: "Custom",
          deleted: false,
          permissions: []
        }
      ])
    );

    expect(plan.blockers.map((b) => b.kind)).toEqual(["name_collision"]);
    expect(plan.roles).toEqual([]);
  });

  // roles.name has a full (not partial) unique index, so a deleted row still blocks it.
  it("blocks on a name held by a soft-deleted backend role", () => {
    const plan = buildMigrationPlan(
      [role()],
      [],
      backend([
        {
          id: "x",
          name: "Lab User",
          type: "Custom",
          deleted: true,
          permissions: []
        }
      ])
    );

    expect(plan.blockers.map((b) => b.kind)).toEqual(["name_collision"]);
  });

  it("blocks when two LIMS roles share a name", () => {
    const plan = buildMigrationPlan(
      [role({ id: "a" }), role({ id: "b", isDeleted: true })],
      [],
      backend()
    );

    expect(plan.blockers.map((b) => b.kind)).toContain("duplicate_lims_name");
  });

  it("blocks on a permission missing from backend's catalogue", () => {
    const plan = buildMigrationPlan(
      [role()],
      [entry({ entry: "NOT_AN_ENTITY", canView: true })],
      backend()
    );

    expect(plan.blockers.map((b) => b.kind)).toEqual(["unknown_permission"]);
  });
});

describe("syncing roles already migrated", () => {
  it("leaves a role alone when backend already matches", () => {
    const plan = buildMigrationPlan(
      [role({ backendRoleId: MIGRATED_ID })],
      [entry({ canView: true })],
      migratedBackend()
    );

    expect(plan.roles[0]).toMatchObject({
      action: "in_sync",
      pointerWrite: false
    });
  });

  // Without this the dual-read could never reach zero: any edit a lab manager makes in
  // LIMS during the soak would stay a mismatch forever.
  it("grants and revokes to match permission edits made in LIMS since the last run", () => {
    const plan = buildMigrationPlan(
      [role({ backendRoleId: MIGRATED_ID })],
      [entry({ canEdit: true })],
      migratedBackend()
    );

    expect(plan.roles[0].action).toBe("sync");
    expect(plan.roles[0].changes).toMatchObject({
      grant: ["LIMS:UPDATE:SAMPLE"],
      revoke: ["LIMS:VIEW:SAMPLE"]
    });
  });

  it("renames to follow a rename in LIMS", () => {
    const plan = buildMigrationPlan(
      [role({ name: "Lab Analyst", backendRoleId: MIGRATED_ID })],
      [entry({ canView: true })],
      migratedBackend()
    );

    expect(plan.roles[0].changes?.rename).toEqual({
      from: "Lab User",
      to: "Lab Analyst"
    });
  });

  it("blocks a rename onto a name another backend role already holds", () => {
    const state = migratedBackend();
    state.rolesByName.set("Auditor", {
      id: "other",
      name: "Auditor",
      type: "Custom",
      deleted: false,
      permissions: []
    });

    const plan = buildMigrationPlan(
      [role({ name: "Auditor", backendRoleId: MIGRATED_ID })],
      [entry({ canView: true })],
      state
    );

    expect(plan.blockers.map((b) => b.kind)).toEqual(["name_collision"]);
  });

  it("soft-deletes the backend copy when the LIMS role is deleted", () => {
    const plan = buildMigrationPlan(
      [
        role({
          isDeleted: true,
          deletedAt: new Date(),
          backendRoleId: MIGRATED_ID
        })
      ],
      [entry({ canView: true })],
      migratedBackend()
    );

    expect(plan.roles[0].changes?.softDelete).toBe(true);
  });

  it("restores the backend copy when the LIMS role is restored", () => {
    const plan = buildMigrationPlan(
      [role({ backendRoleId: MIGRATED_ID })],
      [entry({ canView: true })],
      migratedBackend({ deleted: true })
    );

    expect(plan.roles[0].changes?.restore).toBe(true);
  });

  it("blocks if the ledger points at a backend role that no longer exists", () => {
    const plan = buildMigrationPlan(
      [role({ backendRoleId: MIGRATED_ID })],
      [],
      backend([], { alreadyMigrated: new Map([["lims-role-1", MIGRATED_ID]]) })
    );

    expect(plan.blockers.map((b) => b.kind)).toEqual(["migrated_role_missing"]);
  });

  it("repairs a missing LIMS pointer without touching the backend role", () => {
    const plan = buildMigrationPlan(
      [role({ backendRoleId: null })],
      [entry({ canView: true })],
      migratedBackend()
    );

    expect(plan.roles[0]).toMatchObject({
      action: "in_sync",
      pointerWrite: true
    });
  });
});

describe("deterministicUuid", () => {
  it("is stable and RFC 4122 v4-shaped", () => {
    const id = deterministicUuid("lims-role:abc");
    expect(id).toBe(deterministicUuid("lims-role:abc"));
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
