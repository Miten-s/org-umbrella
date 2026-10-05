jest.mock("../configs/db.sequelize", () => ({
  sequelize: { query: jest.fn().mockResolvedValue([]) }
}));
jest.mock("../configs/cache", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPrefix: jest.fn()
  }
}));
jest.mock("../configs/logger.config", () => ({
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn()
}));
jest.mock("../models/lims-user.model", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../models/user-role.model", () => ({
  __esModule: true,
  default: {}
}));
jest.mock("../models/group.model", () => ({ __esModule: true, default: {} }));
jest.mock("./platform-access.service", () => ({
  platformSuperAdminStatus: jest.fn()
}));
jest.mock("./backend-permissions.client", () => ({
  fetchPermissionsForRoleIds: jest.fn()
}));

import cache from "../configs/cache";
import LimsUser from "../models/lims-user.model";
import { platformSuperAdminStatus } from "./platform-access.service";
import { fetchPermissionsForRoleIds } from "./backend-permissions.client";
import {
  PermissionsUnavailable,
  getUserContext,
  permissionCodesForRoleIds
} from "./user-context.service";

const mockedFetch = fetchPermissionsForRoleIds as jest.Mock;
const mockedFindOne = LimsUser.findOne as jest.Mock;
const mockedStatus = platformSuperAdminStatus as jest.Mock;
const mockedGet = cache.get as jest.Mock;

const LAB_USER = {
  id: "lims-user-1",
  userName: "Priya",
  groupId: null,
  accessGroups: [],
  roleLinks: [{ roleId: "backend-role-1" }]
};

const GRACE = {
  limsUserId: "lims-user-1",
  platformUserId: "platform-1",
  userName: "Priya",
  homeGroupId: null,
  accessGroupIds: [],
  operateAll: false,
  permissions: ["LIMS:VIEW:SAMPLE"]
};

const SUPER_ADMIN_GRACE = {
  ...GRACE,
  limsUserId: "",
  operateAll: true,
  permissions: []
};

const graceOnly = (value: unknown) =>
  mockedGet.mockImplementation(async (key: string) =>
    key.startsWith("user-ctx-grace:") ? value : null
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedGet.mockResolvedValue(null);
  mockedStatus.mockResolvedValue("no");
  mockedFindOne.mockResolvedValue(LAB_USER);
});

describe("getUserContext", () => {
  it("grants what backend says the assigned roles grant", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE", "LIMS:CREATE:SAMPLE", "GXP:VIEW:USER"]
    });

    const context = await getUserContext("platform-1");

    expect(mockedFetch).toHaveBeenCalledWith(["backend-role-1"]);
    expect([...(context?.permissions ?? [])].sort()).toEqual([
      "LIMS:CREATE:SAMPLE",
      "LIMS:VIEW:SAMPLE"
    ]);
    expect(context?.operateAll).toBe(false);
  });

  it("treats LIMS:OPERATE:ALL as LIMS-wide access", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:OPERATE:ALL"]
    });

    expect((await getUserContext("platform-1"))?.operateAll).toBe(true);
  });

  it("returns null for a platform user with no lab user row", async () => {
    mockedFindOne.mockResolvedValue(null);

    expect(await getUserContext("platform-1")).toBeNull();
  });

  it("serves a read from the grace copy while backend is unreachable", async () => {
    mockedFetch.mockResolvedValue({ ok: false, permissions: [] });
    graceOnly(GRACE);

    const context = await getUserContext("platform-1");

    expect([...(context?.permissions ?? [])]).toEqual(["LIMS:VIEW:SAMPLE"]);
  });

  it("refuses a write as unavailable while backend is unreachable", async () => {
    mockedFetch.mockResolvedValue({ ok: false, permissions: [] });
    graceOnly(GRACE);

    await expect(
      getUserContext("platform-1", { allowGrace: false })
    ).rejects.toBeInstanceOf(PermissionsUnavailable);
  });

  it("refuses a read as unavailable when there is no grace copy", async () => {
    mockedFetch.mockResolvedValue({ ok: false, permissions: [] });

    await expect(getUserContext("platform-1")).rejects.toBeInstanceOf(
      PermissionsUnavailable
    );
  });

  it("gives Super Admin full access without a lab user row", async () => {
    mockedStatus.mockResolvedValue("yes");
    mockedFindOne.mockResolvedValue(null);

    expect((await getUserContext("platform-1"))?.operateAll).toBe(true);
  });

  it("lets a Super Admin read from their grace copy during an outage", async () => {
    mockedStatus.mockResolvedValue("unknown");
    mockedFindOne.mockResolvedValue(null);
    graceOnly(SUPER_ADMIN_GRACE);

    expect((await getUserContext("platform-1"))?.operateAll).toBe(true);
  });

  it("answers unavailable, not no-access, when Super Admin status is unknown and there is no lab user row", async () => {
    mockedStatus.mockResolvedValue("unknown");
    mockedFindOne.mockResolvedValue(null);

    await expect(getUserContext("platform-1")).rejects.toBeInstanceOf(
      PermissionsUnavailable
    );
  });
});

describe("permissionCodesForRoleIds", () => {
  it("asks backend what the roles grant", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:TEST", "LIMS:OPERATE:ALL"]
    });

    const result = await permissionCodesForRoleIds(["r1"]);

    expect([...result.permissions]).toEqual(["LIMS:VIEW:TEST"]);
    expect(result.operateAll).toBe(true);
  });

  it("refuses rather than assuming nothing when backend can't answer", async () => {
    mockedFetch.mockResolvedValue({ ok: false, permissions: [] });

    await expect(permissionCodesForRoleIds(["r1"])).rejects.toBeInstanceOf(
      PermissionsUnavailable
    );
  });
});
