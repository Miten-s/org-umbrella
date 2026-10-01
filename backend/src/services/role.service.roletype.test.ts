const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
let currentPermissions: string[] = [];
let superAdmin = false;

jest.mock("../configs/db.sequelize", () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(async () => mockTransaction),
    query: jest.fn()
  }
}));
jest.mock("../models/role.model", () => ({
  Role: { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  RoleType: {
    CUSTOM: "Custom",
    BUILT_IN: "Built_In",
    GXP_SERVICE: "Gxp_Service",
    LIMS_SERVICE: "Lims_Service"
  }
}));
jest.mock("../models/user.model", () => ({ User: { findOne: jest.fn() } }));
jest.mock("../models/permission.model", () => ({
  Permission: { findAll: jest.fn().mockResolvedValue([]) }
}));
jest.mock("../utils/common.util", () => ({
  isSuperAdmin: () => superAdmin,
  getUserPermissionNames: () => currentPermissions
}));
jest.mock("./rbac-invalidation.publisher", () => ({
  publishRbacInvalidation: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("./rbac-audit.service", () => ({
  recordRbacChange: jest.fn().mockResolvedValue(undefined),
  permissionNamesOf: (p: unknown[]) => p ?? []
}));

import { Request } from "express";
import roleService from "./role.service";
import { Role } from "../models/role.model";

const buildReq = (type: string) =>
  ({
    body: { name: "Lab Analyst", type, permissions: [] },
    user: { id: "actor-1", email: "admin@example.com" }
  }) as unknown as Request;

describe("Lims_Service roles are written only by lims-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    superAdmin = false;
    currentPermissions = [];
    (Role.create as jest.Mock).mockResolvedValue({
      id: "role-1",
      name: "Lab Analyst"
    });
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "role-1",
      name: "Lab Analyst",
      permissions: []
    });
  });

  const MANAGED = /managed from the LIMS Roles screen/;

  // LIMS mirrors its Lab Roles into backend. A role created or edited here would be
  // invisible to LIMS's own screens and overwritten by the next sync — so nobody may.
  it("refuses a LIMS role admin creating a Lims_Service role through the public API", async () => {
    currentPermissions = ["LIMS:CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Lims_Service"))
    ).rejects.toThrow(MANAGED);
    expect(Role.create).not.toHaveBeenCalled();
  });

  it("refuses even a super admin", async () => {
    superAdmin = true;

    await expect(
      roleService.createRole(buildReq("Lims_Service"))
    ).rejects.toThrow(MANAGED);
  });

  it("refuses editing an existing Lims_Service role", async () => {
    superAdmin = true;
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "role-1",
      name: "Lab User",
      type: "Lims_Service",
      permissions: [],
      update: jest.fn()
    });

    await expect(
      roleService.updateRole({
        params: { id: "role-1" },
        body: { name: "Renamed" },
        user: { id: "actor-1" }
      } as unknown as Request)
    ).rejects.toThrow(MANAGED);
  });

  it("refuses retyping another role into Lims_Service", async () => {
    superAdmin = true;
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "role-1",
      name: "Custom Role",
      type: "Custom",
      permissions: [],
      update: jest.fn()
    });

    await expect(
      roleService.updateRole({
        params: { id: "role-1" },
        body: { type: "Lims_Service" },
        user: { id: "actor-1" }
      } as unknown as Request)
    ).rejects.toThrow(MANAGED);
  });

  it("refuses deleting a Lims_Service role", async () => {
    superAdmin = true;
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "role-1",
      name: "Lab User",
      type: "Lims_Service",
      permissions: [],
      destroy: jest.fn()
    });

    await expect(
      roleService.deleteRole({
        params: { id: "role-1" },
        body: {},
        user: { id: "actor-1" }
      } as unknown as Request)
    ).rejects.toThrow(MANAGED);
  });

  it("still lets a platform admin create an ordinary Custom role", async () => {
    currentPermissions = ["CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Custom"))
    ).resolves.toBeDefined();
  });

  it("still blocks a LIMS-only admin from GXP and platform Built_In roles", async () => {
    currentPermissions = ["LIMS:CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Gxp_Service"))
    ).rejects.toThrow(/not authorized to manage Gxp_Service roles/);
    await expect(roleService.createRole(buildReq("Built_In"))).rejects.toThrow(
      /not authorized to manage Built_In roles/
    );
  });
});
