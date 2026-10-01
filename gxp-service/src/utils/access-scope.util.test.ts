import { Model, Op, WhereOptions } from "sequelize";
import Application from "../models/gxp-service-applications.model";
import {
  AccessScope,
  contextToScope,
  groupWhere,
  withGroupScope
} from "./access-scope.util";
import { GxpUserContext } from "../services/user-context.service";

const UNASSIGNED_GROUP_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_GROUP_ID = "22222222-2222-2222-2222-222222222222";

/** Interprets the small, fully-enumerable set of WHERE shapes groupWhere() can actually
 * produce ({}, { id: null }, { [Op.or]: [{ accessGroupId }, { accessGroupId: null }] })
 * against an in-memory row set — a stand-in for what Postgres would evaluate, since this
 * suite has no live database to query against (see the migration-025 write-up: the
 * repo/service/controller layers built on top of groupWhere are thin pass-throughs, so
 * proving groupWhere itself proves the enforcement they wire in). */
const evaluate = (
  where: WhereOptions,
  row: { id: string; accessGroupId: string | null }
): boolean => {
  const orClause = (where as any)[Op.or as unknown as string];
  if (orClause) {
    return orClause.some((clause: any) => {
      if ("accessGroupId" in clause) {
        const value = clause.accessGroupId;
        return value === null
          ? row.accessGroupId === null
          : Array.isArray(value)
            ? value.includes(row.accessGroupId)
            : value === row.accessGroupId;
      }
      return false;
    });
  }
  if ("id" in where && (where as any).id === null) return false; // deny-all
  return true; // {} — unrestricted
};

/** The exact post-migration-025 state: every existing application/service_request row
 * landed in the Unassigned group, and every existing user was granted access to it. */
const postMigrationRows = [
  { id: "app-1", accessGroupId: UNASSIGNED_GROUP_ID },
  { id: "app-2", accessGroupId: UNASSIGNED_GROUP_ID },
  { id: "app-3", accessGroupId: UNASSIGNED_GROUP_ID }
];

const postMigrationUserScope: AccessScope = {
  accessGroupIds: [UNASSIGNED_GROUP_ID],
  bypass: false,
  resolved: true
};

describe("groupWhere / withGroupScope — migration 025 no-op guarantee", () => {
  it("before/after: a post-migration user sees the exact same rows with enforcement on as with it off", () => {
    const unfiltered = postMigrationRows; // "enforcement off" — no where clause at all

    const where = groupWhere(Application, postMigrationUserScope);
    const filtered = postMigrationRows.filter((row) => evaluate(where, row));

    expect(filtered).toEqual(unfiltered);
    expect(filtered).toHaveLength(3);
  });

  it("the mechanism actually restricts once a row lands in a different group (proves it isn't a no-op by construction)", () => {
    const rows = [
      ...postMigrationRows,
      { id: "app-4-segmented", accessGroupId: OTHER_GROUP_ID }
    ];

    const where = groupWhere(Application, postMigrationUserScope);
    const filtered = rows.filter((row) => evaluate(where, row));

    expect(filtered.map((r) => r.id)).toEqual(["app-1", "app-2", "app-3"]);
  });

  it("bypass (Super Admin / GXP:OPERATE:ALL) sees everything regardless of accessGroupIds", () => {
    const rows = [
      ...postMigrationRows,
      { id: "app-4-segmented", accessGroupId: OTHER_GROUP_ID }
    ];
    const superAdminScope: AccessScope = {
      accessGroupIds: [],
      bypass: true,
      resolved: true
    };

    const where = groupWhere(Application, superAdminScope);
    expect(where).toEqual({});
    expect(rows.filter((row) => evaluate(where, row))).toEqual(rows);
  });

  it("a resolved user with zero assigned groups sees everything (deliberate safety net, mirrors lims)", () => {
    const rows = postMigrationRows;
    const noGroupsScope: AccessScope = {
      accessGroupIds: [],
      bypass: false,
      resolved: true
    };

    const where = groupWhere(Application, noGroupsScope);
    expect(where).toEqual({});
    expect(rows.filter((row) => evaluate(where, row))).toEqual(rows);
  });

  it("an unresolved scope (authorize() never ran) denies everything, not silently allows", () => {
    const unresolvedScope: AccessScope = {
      accessGroupIds: [],
      bypass: false,
      resolved: false
    };

    const where = groupWhere(Application, unresolvedScope);
    expect(postMigrationRows.filter((row) => evaluate(where, row))).toEqual([]);
  });

  it("contextToScope: a real GxpUserContext with the migration-025 grant produces the expected scope", () => {
    const context: GxpUserContext = {
      gxpUserId: "gxp-user-1",
      platformUserId: "platform-user-1",
      userName: "Ada",
      isSuperAdmin: false,
      permissions: new Set(["GXP:VIEW:APPLICATION"]),
      accessGroupIds: [UNASSIGNED_GROUP_ID]
    };

    expect(contextToScope(context)).toEqual({
      accessGroupIds: [UNASSIGNED_GROUP_ID],
      bypass: false,
      resolved: true
    });
  });

  it("withGroupScope merges with an existing where (e.g. a search filter) via Op.and, without dropping either side", () => {
    const searchWhere = {
      [Op.or]: [{ applicationName: { [Op.iLike]: "%acme%" } }]
    } as WhereOptions;

    const merged = withGroupScope(
      Application,
      postMigrationUserScope,
      searchWhere
    );

    expect(merged).toEqual({
      [Op.and]: [
        searchWhere,
        {
          [Op.or]: [
            { accessGroupId: [UNASSIGNED_GROUP_ID] },
            { accessGroupId: null }
          ]
        }
      ]
    });
  });

  it("withGroupScope is a no-op passthrough when the scope bypasses (doesn't wrap in Op.and unnecessarily)", () => {
    const searchWhere = { status: "enabled" } as WhereOptions;
    const superAdminScope: AccessScope = {
      accessGroupIds: [],
      bypass: true,
      resolved: true
    };

    expect(withGroupScope(Application, superAdminScope, searchWhere)).toEqual(
      searchWhere
    );
  });
});
