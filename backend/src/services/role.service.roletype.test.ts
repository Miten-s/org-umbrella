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

describe("Lims_Service role type authority", () => {
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

  it("lets a LIMS role admin create a Lims_Service role", async () => {
    currentPermissions = ["LIMS:CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Lims_Service"))
    ).resolves.toBeDefined();
  });

  // The type gate is the whole point: holding some ROLE permission must not be enough to
  // reach another service's roles.
  it("blocks a GXP-only admin from creating a Lims_Service role", async () => {
    currentPermissions = ["GXP:CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Lims_Service"))
    ).rejects.toThrow(/not authorized to manage Lims_Service roles/);
  });

  it("blocks a LIMS-only admin from creating a Gxp_Service role", async () => {
    currentPermissions = ["LIMS:CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Gxp_Service"))
    ).rejects.toThrow(/not authorized to manage Gxp_Service roles/);
  });

  it("blocks a LIMS-only admin from creating a platform Built_In role", async () => {
    currentPermissions = ["LIMS:CREATE:ROLE"];

    await expect(
      roleService.createRole(buildReq("Built_In"))
    ).rejects.toThrow(/not authorized to manage Built_In roles/);
  });

  it("lets a super admin create a Lims_Service role", async () => {
    superAdmin = true;

    await expect(
      roleService.createRole(buildReq("Lims_Service"))
    ).resolves.toBeDefined();
  });
});
