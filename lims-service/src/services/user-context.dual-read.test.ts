const mockEnv: { LIMS_PERMISSION_SOURCE?: string } = {};

jest.mock("../utils/environment", () => ({
  __esModule: true,
  default: mockEnv
}));
jest.mock("../configs/db.sequelize", () => ({
  sequelize: { query: jest.fn() }
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
jest.mock("../models/role.model", () => ({ __esModule: true, default: {} }));
jest.mock("../models/role-entry.model", () => ({
  __esModule: true,
  default: {}
}));
jest.mock("../models/group.model", () => ({ __esModule: true, default: {} }));
jest.mock("./platform-access.service", () => ({
  platformSuperAdminStatus: jest.fn().mockResolvedValue("no")
}));
jest.mock("./backend-permissions.client", () => ({
  fetchPermissionsForRoleIds: jest.fn()
}));

import cache from "../configs/cache";
import LimsUser from "../models/lims-user.model";
import { logError, logInfo, logWarn } from "../configs/logger.config";
import { fetchPermissionsForRoleIds } from "./backend-permissions.client";
import { platformSuperAdminStatus } from "./platform-access.service";
import {
  PermissionsUnavailable,
  compareWithBackend,
  getUserContext,
  invalidateUserContext
} from "./user-context.service";

const mockedFetch = fetchPermissionsForRoleIds as jest.MockedFunction<
  typeof fetchPermissionsForRoleIds
>;
const mockedFindOne = LimsUser.findOne as jest.Mock;
const mockedCacheSet = cache.set as jest.Mock;

// A lab user whose only role grants VIEW on samples, already migrated to backend.
const LAB_USER = {
  id: "lims-user-1",
  userName: "Priya",
  groupId: null,
  accessGroups: [],
  roles: [
    {
      name: "Lab User",
      backendRoleId: "backend-lab-user",
      operateAll: false,
      entries: [
        {
          entry: "SAMPLE",
          canView: true,
          canCreate: false,
          canEdit: false,
          canRemove: false
        }
      ]
    }
  ]
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("getUserContext in dual mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.LIMS_PERMISSION_SOURCE = "dual";
    (cache.get as jest.Mock).mockResolvedValue(null);
    mockedFindOne.mockResolvedValue(LAB_USER);
  });

  // The rule the whole dual-read phase rests on: enforcement is unchanged. Backend grants
  // something LIMS doesn't, and the context must still carry only LIMS's own answer.
  it("enforces LIMS's own permissions even when backend disagrees", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: [
        "LIMS:VIEW:SAMPLE",
        "LIMS:DELETE:SAMPLE",
        "LIMS:OPERATE:ALL"
      ]
    });

    const context = await getUserContext("platform-1");

    expect([...context!.permissions]).toEqual(["LIMS:VIEW:SAMPLE"]);
    expect(context!.operateAll).toBe(false);
  });

  it("returns without waiting for backend, so a slow backend adds no latency", async () => {
    mockedFetch.mockReturnValue(new Promise(() => {})); // never resolves

    await expect(getUserContext("platform-1")).resolves.not.toBeNull();
  });

  it("logs a mismatch with exactly what differs", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE", "LIMS:DELETE:SAMPLE"]
    });

    await getUserContext("platform-1");
    await flush();

    expect(logWarn).toHaveBeenCalledWith(
      "LIMS permission mismatch",
      expect.objectContaining({
        platformUserId: "platform-1",
        onlyLocal: [],
        onlyBackend: ["LIMS:DELETE:SAMPLE"]
      }),
      "compareWithBackend"
    );
  });

  it("logs a match as well, so zero mismatches is evidence and not silence", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE"]
    });

    await getUserContext("platform-1");
    await flush();

    expect(logInfo).toHaveBeenCalledWith(
      "LIMS permission parity ok",
      { platformUserId: "platform-1" },
      "compareWithBackend"
    );
  });

  it("caches with a TTL so a missed invalidation cannot leave the comparison stale forever", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE"]
    });

    await getUserContext("platform-1");

    expect(mockedCacheSet).toHaveBeenCalledWith(
      "user-ctx:platform-1",
      expect.anything(),
      5 * 60
    );
  });
});

describe("getUserContext in local mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.LIMS_PERMISSION_SOURCE = "local";
    (cache.get as jest.Mock).mockResolvedValue(null);
    mockedFindOne.mockResolvedValue(LAB_USER);
  });

  it("never contacts backend, and caches exactly as before", async () => {
    await getUserContext("platform-1");
    await flush();

    expect(mockedFetch).not.toHaveBeenCalled();
    expect(mockedCacheSet).toHaveBeenCalledWith(
      "user-ctx:platform-1",
      expect.anything(),
      undefined
    );
  });
});

describe("compareWithBackend", () => {
  beforeEach(() => jest.clearAllMocks());

  // An outage is not a mismatch: counting it as one would make the soak look worse than it
  // is, and counting it as a match would make it look better.
  it("reports an unreachable backend separately from a mismatch", async () => {
    mockedFetch.mockResolvedValue({ ok: false, permissions: [] });

    await compareWithBackend(
      "platform-1",
      { permissions: new Set(), operateAll: false },
      [{ name: "Lab User", backendRoleId: "backend-lab-user" }]
    );

    expect(logWarn).toHaveBeenCalledWith(
      "LIMS dual-read: backend unreachable, comparison skipped",
      { platformUserId: "platform-1" },
      "compareWithBackend"
    );
    expect(logWarn).not.toHaveBeenCalledWith(
      "LIMS permission mismatch",
      expect.anything(),
      expect.anything()
    );
  });

  it("never throws, even if the client does", async () => {
    mockedFetch.mockRejectedValue(new Error("boom"));

    await expect(
      compareWithBackend(
        "platform-1",
        { permissions: new Set(), operateAll: false },
        [{ name: "Lab User", backendRoleId: "backend-lab-user" }]
      )
    ).resolves.toBeUndefined();
  });

  // The GXP pattern: assignments stay in LIMS, and backend is asked what those exact roles
  // grant — not what the platform user holds in backend's own user_roles.
  it("asks backend about the roles assigned in LIMS, by their backend ids", async () => {
    mockedFetch.mockResolvedValue({ ok: true, permissions: [] });

    await compareWithBackend(
      "platform-1",
      { permissions: new Set(), operateAll: false },
      [
        { name: "Lab User", backendRoleId: "backend-lab-user" },
        { name: "Scheduler", backendRoleId: "backend-scheduler" }
      ]
    );

    expect(mockedFetch).toHaveBeenCalledWith([
      "backend-lab-user",
      "backend-scheduler"
    ]);
  });

  // After the cutover such a role would grant nothing, so it must surface now.
  it("reports a role with no backend copy as a mismatch, without calling backend", async () => {
    await compareWithBackend(
      "platform-1",
      { permissions: new Set(["LIMS:VIEW:SAMPLE"]), operateAll: false },
      [{ name: "New Role", backendRoleId: null }]
    );

    expect(mockedFetch).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith(
      "LIMS permission mismatch",
      { platformUserId: "platform-1", unmigratedRoles: ["New Role"] },
      "compareWithBackend"
    );
  });
});

describe("getUserContext in backend mode", () => {
  const GRACE = {
    limsUserId: "lims-user-1",
    platformUserId: "platform-1",
    userName: "Priya",
    homeGroupId: null,
    accessGroupIds: [],
    operateAll: false,
    permissions: ["LIMS:VIEW:SAMPLE"]
  };
  const withGrace = (present: boolean) =>
    (cache.get as jest.Mock).mockImplementation(async (k: string) =>
      present && k.startsWith("user-ctx-grace:") ? GRACE : null
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.LIMS_PERMISSION_SOURCE = "backend";
    withGrace(false);
    mockedFindOne.mockResolvedValue(LAB_USER);
  });

  // The switch-over itself: backend's answer is what the request is judged against, even
  // where LIMS's own tables say something different.
  it("enforces what backend says the assigned roles grant", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE", "LIMS:DELETE:SAMPLE"]
    });

    const context = await getUserContext("platform-1");

    expect(mockedFetch).toHaveBeenCalledWith(["backend-lab-user"]);
    expect([...context!.permissions].sort()).toEqual([
      "LIMS:DELETE:SAMPLE",
      "LIMS:VIEW:SAMPLE"
    ]);
  });

  it("logs the difference when LIMS's own calculation disagrees — the mirror has drifted", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE", "LIMS:DELETE:SAMPLE"]
    });

    await getUserContext("platform-1");

    expect(logWarn).toHaveBeenCalledWith(
      "LIMS permission mismatch",
      expect.objectContaining({ onlyBackend: ["LIMS:DELETE:SAMPLE"] }),
      "getUserContext"
    );
  });

  it("keeps a 30-minute grace copy alongside the 5-minute primary entry", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["LIMS:VIEW:SAMPLE"]
    });

    await getUserContext("platform-1");

    expect(mockedCacheSet).toHaveBeenCalledWith(
      "user-ctx:platform-1",
      expect.anything(),
      5 * 60
    );
    expect(mockedCacheSet).toHaveBeenCalledWith(
      "user-ctx-grace:platform-1",
      expect.anything(),
      30 * 60
    );
  });

  // A role that never reached backend must not fall back to LIMS's own definition —
  // that would make LIMS's tables the authority again, silently.
  it("grants nothing for an assigned role that has no backend copy", async () => {
    mockedFindOne.mockResolvedValue({
      ...LAB_USER,
      roles: [{ ...LAB_USER.roles[0], backendRoleId: null }]
    });
    mockedFetch.mockResolvedValue({ ok: true, permissions: [] });

    const context = await getUserContext("platform-1");

    expect([...context!.permissions]).toEqual([]);
    expect(mockedFetch).toHaveBeenCalledWith([]);
    expect(logError).toHaveBeenCalledWith(
      "LIMS role(s) with no backend copy grant nothing in backend mode",
      expect.objectContaining({ roles: ["Lab User"] }),
      "getUserContext"
    );
  });

  describe("when backend is unreachable", () => {
    beforeEach(() => {
      mockedFetch.mockResolvedValue({ ok: false, permissions: [] });
    });

    it("lets a read through on the last backend-confirmed permissions", async () => {
      withGrace(true);

      const context = await getUserContext("platform-1", { allowGrace: true });

      expect([...context!.permissions]).toEqual(["LIMS:VIEW:SAMPLE"]);
    });

    // The rule that makes the grace window safe: stale permissions may show data, never
    // change it.
    it("refuses a write even though a grace copy exists", async () => {
      withGrace(true);

      await expect(
        getUserContext("platform-1", { allowGrace: false })
      ).rejects.toBeInstanceOf(PermissionsUnavailable);
    });

    it("refuses a read too once there is no grace copy left", async () => {
      await expect(
        getUserContext("platform-1", { allowGrace: true })
      ).rejects.toBeInstanceOf(PermissionsUnavailable);
    });

    it("answers 503, not a misleading 403", async () => {
      await expect(getUserContext("platform-1")).rejects.toMatchObject({
        statusCode: 503
      });
    });

    it("does not cache anything from a failed resolution", async () => {
      withGrace(true);

      await getUserContext("platform-1");

      expect(mockedCacheSet).not.toHaveBeenCalled();
    });
  });
});

describe("invalidation", () => {
  // Otherwise a refresh that fails right after a revocation would serve the pre-change
  // permissions from the grace copy.
  it("drops the grace copy along with the primary entry", async () => {
    jest.clearAllMocks();

    await invalidateUserContext("platform-1");

    expect(cache.del).toHaveBeenCalledWith("user-ctx:platform-1");
    expect(cache.del).toHaveBeenCalledWith("user-ctx-grace:platform-1");
  });
});

describe("getUserContext when backend cannot say whether this is Super Admin", () => {
  const SUPER_ADMIN_GRACE = {
    limsUserId: "",
    platformUserId: "super-admin",
    userName: null,
    homeGroupId: null,
    accessGroupIds: [],
    operateAll: true,
    permissions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.LIMS_PERMISSION_SOURCE = "dual";
    (platformSuperAdminStatus as jest.Mock).mockResolvedValue("unknown");
    mockedFindOne.mockResolvedValue(null);
  });

  afterAll(() => {
    (platformSuperAdminStatus as jest.Mock).mockResolvedValue("no");
  });

  const graceOnly = (value: unknown) =>
    (cache.get as jest.Mock).mockImplementation(async (key: string) =>
      key.startsWith("user-ctx-grace:") ? value : null
    );

  it("lets a Super Admin read from the grace copy", async () => {
    graceOnly(SUPER_ADMIN_GRACE);

    const context = await getUserContext("super-admin");

    expect(context?.operateAll).toBe(true);
  });

  it("refuses a Super Admin write as unavailable", async () => {
    graceOnly(SUPER_ADMIN_GRACE);

    await expect(
      getUserContext("super-admin", { allowGrace: false })
    ).rejects.toBeInstanceOf(PermissionsUnavailable);
  });

  it("lets a Super Admin who is also a lab user write with their own roles in dual mode", async () => {
    graceOnly(SUPER_ADMIN_GRACE);
    mockedFindOne.mockResolvedValue(LAB_USER);

    const context = await getUserContext("super-admin", { allowGrace: false });

    expect([...(context?.permissions ?? [])]).toEqual(["LIMS:VIEW:SAMPLE"]);
  });

  it("answers unavailable, not no-access, for a user with no lab user row", async () => {
    graceOnly(null);

    await expect(getUserContext("someone")).rejects.toBeInstanceOf(
      PermissionsUnavailable
    );
  });

  it("still resolves a lab user from LIMS's own roles in dual mode", async () => {
    graceOnly(null);
    mockedFindOne.mockResolvedValue(LAB_USER);

    const context = await getUserContext("lab-user");

    expect([...(context?.permissions ?? [])]).toEqual(["LIMS:VIEW:SAMPLE"]);
  });
});
