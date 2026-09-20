const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

jest.mock("../configs/db.sequelize", () => ({
  sequelize: {
    transaction: jest.fn().mockImplementation(async () => mockTransaction),
    query: jest.fn()
  }
}));
jest.mock("../models/role.model", () => ({
  Role: { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  RoleType: { CUSTOM: "Custom", BUILT_IN: "Built_In", GXP_SERVICE: "Gxp_Service" }
}));
jest.mock("../models/user.model", () => ({ User: { findOne: jest.fn() } }));
jest.mock("../models/permission.model", () => ({
  Permission: { findAll: jest.fn().mockResolvedValue([]) }
}));
jest.mock("../utils/common.util", () => ({
  isSuperAdmin: () => true,
  getUserPermissionNames: () => ["OPERATE:ALL"]
}));
jest.mock("./rbac-invalidation.publisher", () => ({
  publishRbacInvalidation: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("./rbac-audit.service", () => ({
  recordRbacChange: jest.fn(),
  permissionNamesOf: (p: unknown[]) => p ?? []
}));

import { Request } from "express";
import roleService from "./role.service";
import { Role } from "../models/role.model";
import { recordRbacChange } from "./rbac-audit.service";
import { publishRbacInvalidation } from "./rbac-invalidation.publisher";

const mockedRoleCreate = Role.create as jest.MockedFunction<typeof Role.create>;
const mockedRecord = recordRbacChange as jest.MockedFunction<
  typeof recordRbacChange
>;
const mockedPublish = publishRbacInvalidation as jest.MockedFunction<
  typeof publishRbacInvalidation
>;

const buildReq = () =>
  ({
    body: { name: "Analyst", type: "Custom", permissions: [] },
    user: { id: "actor-1", email: "admin@example.com" }
  }) as unknown as Request;

describe("createRole — audit is part of the mutation, not a side effect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRoleCreate.mockResolvedValue({ id: "role-1", name: "Analyst" } as any);
    (Role.findByPk as jest.Mock).mockResolvedValue({
      id: "role-1",
      name: "Analyst",
      permissions: []
    });
    mockedRecord.mockResolvedValue(undefined);
  });

  it("writes an audit row inside the same transaction, before commit", async () => {
    await roleService.createRole(buildReq());

    expect(mockedRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ROLE_CREATE",
        targetType: "role",
        targetId: "role-1",
        actor: expect.objectContaining({ id: "actor-1" })
      }),
      mockTransaction
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  // The guarantee that matters: if the change cannot be logged, the change does not stand.
  it("rolls the role back when the audit write fails", async () => {
    mockedRecord.mockRejectedValue(new Error("audit table unavailable"));

    await expect(roleService.createRole(buildReq())).rejects.toThrow(
      "audit table unavailable"
    );

    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(mockTransaction.commit).not.toHaveBeenCalled();
    // And nothing announces a change that was rolled back.
    expect(mockedPublish).not.toHaveBeenCalled();
  });
});
