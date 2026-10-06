jest.mock("../models/rbac-audit-log.model", () => ({
  __esModule: true,
  default: { create: jest.fn() }
}));

import RbacAuditLog from "../models/rbac-audit-log.model";
import { recordRbacChange, permissionNamesOf } from "./rbac-audit.service";
import { IUser } from "../models/user.model";

const mockedCreate = RbacAuditLog.create as jest.MockedFunction<
  typeof RbacAuditLog.create
>;

const ACTOR = { id: "actor-1", email: "admin@example.com" } as IUser;

describe("recordRbacChange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreate.mockResolvedValue({} as any);
  });

  it("records who did what, to which target, with before and after", async () => {
    await recordRbacChange({
      actor: ACTOR,
      action: "ROLE_UPDATE",
      targetType: "role",
      targetId: "role-1",
      targetName: "Analyst",
      beforeState: { permissions: ["LIMS:VIEW:SAMPLE"] },
      afterState: { permissions: [] },
      reason: "removed on request"
    });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "actor-1",
        actorEmail: "admin@example.com",
        action: "ROLE_UPDATE",
        targetType: "role",
        targetId: "role-1",
        targetName: "Analyst",
        beforeState: { permissions: ["LIMS:VIEW:SAMPLE"] },
        afterState: { permissions: [] },
        reason: "removed on request"
      }),
      expect.anything()
    );
  });

  it("passes the caller's transaction through so the row commits with the mutation", async () => {
    const transaction = { id: "txn" } as any;

    await recordRbacChange(
      { action: "ROLE_DELETE", targetType: "role", targetId: "r1" },
      transaction
    );

    expect(mockedCreate).toHaveBeenCalledWith(expect.anything(), {
      transaction
    });
  });

  // The whole point of taking the mutation's transaction: if the trail cannot be written,
  // the privilege change must not stand. This must propagate, never be swallowed.
  it("propagates a write failure instead of swallowing it", async () => {
    mockedCreate.mockRejectedValue(new Error("audit table unavailable"));

    await expect(
      recordRbacChange({
        action: "ROLE_CREATE",
        targetType: "role",
        targetId: "r1"
      })
    ).rejects.toThrow("audit table unavailable");
  });

  it("records a system action with no actor rather than refusing to log", async () => {
    await recordRbacChange({
      action: "ROLE_BULK_DELETE",
      targetType: "role",
      targetId: "r1"
    });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: null, actorEmail: null }),
      expect.anything()
    );
  });
});

describe("permissionNamesOf", () => {
  it("normalises ids and hydrated objects to a comparable list", () => {
    expect(permissionNamesOf(["GXP:VIEW:APPLICATION"])).toEqual([
      "GXP:VIEW:APPLICATION"
    ]);
    expect(permissionNamesOf([{ name: "LIMS:EDIT:SAMPLE" }])).toEqual([
      "LIMS:EDIT:SAMPLE"
    ]);
    expect(permissionNamesOf([{ id: "perm-1" }])).toEqual(["perm-1"]);
  });

  it("treats null and undefined as an empty list", () => {
    expect(permissionNamesOf(null)).toEqual([]);
    expect(permissionNamesOf(undefined)).toEqual([]);
  });
});
