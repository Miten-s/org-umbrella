const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

jest.mock("../configs/db.sequelize", () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(async () => mockTransaction),
    query: jest.fn()
  }
}));
jest.mock("../models/permission.model", () => ({
  Permission: { findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() }
}));
jest.mock("../models/role.model", () => ({
  Role: { findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  RoleType: {
    CUSTOM: "Custom",
    BUILT_IN: "Built_In",
    GXP_SERVICE: "Gxp_Service",
    LIMS_SERVICE: "Lims_Service"
  }
}));
jest.mock("../models/user.model", () => ({ User: { findOne: jest.fn() } }));
jest.mock("../utils/common.util", () => ({
  isSuperAdmin: () => true,
  getUserPermissionNames: () => ["OPERATE:ALL"]
}));
jest.mock("../utils/pagination.util", () => ({}));
jest.mock("./rbac-invalidation.publisher", () => ({
  publishRbacInvalidation: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("./rbac-audit.service", () => ({
  recordRbacChange: jest.fn().mockResolvedValue(undefined),
  permissionNamesOf: (p: unknown[]) => p ?? []
}));

import { Request } from "express";
import permissionService from "./permission.service";
import roleService from "./role.service";
import { Permission } from "../models/permission.model";
import { Role } from "../models/role.model";

const asReq = (body: Record<string, unknown> = {}) =>
  ({
    params: { id: "target-1" },
    body,
    user: { id: "actor-1", email: "admin@example.com" }
  }) as unknown as Request;

describe("LIMS catalogue fixtures are protected", () => {
  beforeEach(() => jest.clearAllMocks());

  // Seeded fixtures are locked for everyone, Super Admin included — these tests run as a
  // super admin precisely to prove the lock is not merely a permission check.
  it("refuses to update the LIMS:OPERATE:ALL wildcard", async () => {
    (Permission.findByPk as jest.Mock).mockResolvedValue({
      id: "p1",
      name: "LIMS:OPERATE:ALL",
      update: jest.fn()
    });

    await expect(
      permissionService.updatePermission(asReq({ name: "hijacked" }))
    ).rejects.toThrow(/protected system permission/);
  });

  it("refuses to delete the LIMS:OPERATE:ALL wildcard", async () => {
    (Permission.findByPk as jest.Mock).mockResolvedValue({
      id: "p1",
      name: "LIMS:OPERATE:ALL",
      destroy: jest.fn()
    });

    await expect(permissionService.deletePermission(asReq())).rejects.toThrow(
      /protected system permission/
    );
  });

  it("refuses to update the LIMS Master Admin role", async () => {
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "r1",
      name: "LIMS Master Admin",
      type: "Lims_Service",
      permissions: [],
      update: jest.fn()
    });

    await expect(
      roleService.updateRole(asReq({ name: "hijacked" }))
    ).rejects.toThrow(/protected system role/);
  });

  it("refuses to delete the LIMS Master Admin role", async () => {
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "r1",
      name: "LIMS Master Admin",
      type: "Lims_Service",
      permissions: [],
      destroy: jest.fn()
    });

    await expect(roleService.deleteRole(asReq())).rejects.toThrow(
      /protected system role/
    );
  });

  it("still allows an ordinary LIMS permission to be edited", async () => {
    (Permission.findByPk as jest.Mock).mockResolvedValue({
      id: "p2",
      name: "LIMS:VIEW:SAMPLE",
      update: jest.fn().mockResolvedValue(undefined)
    });

    await expect(
      permissionService.updatePermission(asReq({ description: "tweaked" }))
    ).resolves.toBeDefined();
  });
});
