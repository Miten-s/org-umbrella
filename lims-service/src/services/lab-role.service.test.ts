jest.mock("../models/role-group.model", () => ({
  __esModule: true,
  default: { findAll: jest.fn(), upsert: jest.fn(), destroy: jest.fn() }
}));
jest.mock("../models/group.model", () => ({ __esModule: true, default: {} }));
jest.mock("../models/audit-log.model", () => ({
  __esModule: true,
  default: { findAndCountAll: jest.fn() }
}));
jest.mock("../utils/audit.util", () => ({ writeAudit: jest.fn() }));
jest.mock("./user-context.service", () => ({
  invalidateAllUserContexts: jest.fn(),
  LIMS_OPERATE_ALL: "LIMS:OPERATE:ALL"
}));
jest.mock("./backend-roles.client", () => ({
  BackendRoleRejected: class extends Error {},
  queryRoles: jest.fn(),
  lookupRoles: jest.fn(),
  createRole: jest.fn(),
  updateRole: jest.fn(),
  setRolesRemoved: jest.fn()
}));
jest.mock("./permission.service", () => ({
  toBackendPermission: (c: string) =>
    c === "OPERATE:ALL" ? "LIMS:OPERATE:ALL" : c,
  fromBackendPermission: (c: string) =>
    c === "LIMS:OPERATE:ALL" ? "OPERATE:ALL" : c
}));

import { Op } from "sequelize";
import RoleGroup from "../models/role-group.model";
import {
  createRole,
  lookupRoles,
  queryRoles,
  updateRole
} from "./backend-roles.client";
import { labRoleService } from "./lab-role.service";

const scoped = (
  accessGroupIds: string[],
  homeGroupId: string | null = null
) => ({
  actor: { id: "actor-1" },
  scope: { accessGroupIds, homeGroupId, operateAll: false, resolved: true }
});

const backendRole = (id: string, code = id.toUpperCase()) => ({
  id,
  code,
  name: `Role ${id}`,
  description: null,
  permissions: ["LIMS:VIEW:SAMPLE"],
  isRemoved: false,
  deletedAt: null,
  createdAt: "",
  updatedAt: ""
});

const links = (pairs: [string, string][]) =>
  (RoleGroup.findAll as jest.Mock).mockImplementation(async ({ where }) =>
    pairs
      .filter(([roleId, groupId]) => {
        if (where?.roleId) return where.roleId.includes(roleId);
        const notIn: string[] | undefined = where?.groupId?.[Op.notIn];
        return !notIn || !notIn.includes(groupId);
      })
      .map(([roleId, groupId]) => ({
        roleId,
        groupId,
        group: { id: groupId, name: groupId }
      }))
  );

beforeEach(() => jest.clearAllMocks());

describe("Lab Roles and lab groups", () => {
  it("hides roles in lab groups outside the caller's access from the list", async () => {
    links([
      ["in", "lab-a"],
      ["out", "lab-b"]
    ]);
    (queryRoles as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await labRoleService.getAll(
      {
        page: 1,
        limit: 10,
        sortDir: "ASC",
        includeRemoved: false,
        filters: {}
      } as any,
      scoped(["lab-a"]) as any
    );

    expect((queryRoles as jest.Mock).mock.calls[0][0].excludeIds).toEqual([
      "out"
    ]);
  });

  it("treats a role outside the caller's groups as not found", async () => {
    links([["out", "lab-b"]]);
    (lookupRoles as jest.Mock).mockResolvedValue([backendRole("out")]);

    expect(
      await labRoleService.getById("out", scoped(["lab-a"]) as any)
    ).toBeNull();
  });

  it("puts a new role in the caller's home group when none is given", async () => {
    links([]);
    (createRole as jest.Mock).mockResolvedValue(backendRole("new"));

    await labRoleService.create(
      { roleId: "NEW", name: "New", permissions: ["LIMS:VIEW:SAMPLE"] },
      scoped(["lab-a"], "lab-a") as any
    );

    expect(RoleGroup.upsert).toHaveBeenCalledWith({
      roleId: "new",
      groupId: "lab-a"
    });
  });

  it("refuses to put a role in a group outside the caller's access", async () => {
    await expect(
      labRoleService.create(
        { roleId: "NEW", name: "New", group: "lab-b" },
        scoped(["lab-a"]) as any
      )
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(createRole).not.toHaveBeenCalled();
  });

  it("sends OPERATE:ALL to backend as LIMS:OPERATE:ALL", async () => {
    links([]);
    (createRole as jest.Mock).mockResolvedValue(backendRole("new"));

    await labRoleService.create(
      { roleId: "ADM", name: "Admin", permissions: ["OPERATE:ALL"] },
      scoped([]) as any
    );

    expect((createRole as jest.Mock).mock.calls[0][0].permissions).toEqual([
      "LIMS:OPERATE:ALL"
    ]);
  });
});

describe("LIMS Master Admin", () => {
  it("cannot be edited", async () => {
    links([]);
    (lookupRoles as jest.Mock).mockResolvedValue([
      backendRole("master", "LIMS_MASTER_ADMIN")
    ]);

    await expect(
      labRoleService.update("master", { name: "x" }, scoped([]) as any)
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateRole).not.toHaveBeenCalled();
  });
});
