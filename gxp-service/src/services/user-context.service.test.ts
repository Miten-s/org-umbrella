import cache from "../configs/cache";
import GxpUser from "../models/gxp-service-users.model";
import {
  fetchPermissionsForUser,
  fetchPermissionsForRoleIds
} from "./backend-permissions.client";
import { getGxpUserContext } from "./user-context.service";

jest.mock("../configs/cache");
jest.mock("../models/gxp-service-users.model");
jest.mock("./backend-permissions.client");

const mockedCache = cache as jest.Mocked<typeof cache>;
const mockedGxpUserFindOne = GxpUser.findOne as jest.MockedFunction<
  typeof GxpUser.findOne
>;
const mockedFetchForUser = fetchPermissionsForUser as jest.MockedFunction<
  typeof fetchPermissionsForUser
>;
const mockedFetchForRoles = fetchPermissionsForRoleIds as jest.MockedFunction<
  typeof fetchPermissionsForRoleIds
>;

const GRACE_CACHED_CONTEXT = {
  gxpUserId: "gxp-user-1",
  platformUserId: "platform-user-1",
  userName: "Ada",
  isSuperAdmin: false,
  permissions: ["GXP:VIEW:APPLICATION"]
};

describe("getGxpUserContext — backend-unreachable fallback", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // No primary (fresh) cache entry in any of these scenarios — forces a live refresh
    // attempt, which is what we're exercising.
    mockedCache.get.mockImplementation(async (key: string) =>
      key.startsWith("gxp-user-ctx-grace:")
        ? (GRACE_CACHED_CONTEXT as any)
        : null
    );
    mockedGxpUserFindOne.mockResolvedValue({
      id: "gxp-user-1",
      userName: "Ada",
      roles: ["role-1"]
    } as any);
    // Backend unreachable on this refresh, for both calls the resolver makes.
    mockedFetchForUser.mockResolvedValue({ ok: false, permissions: [] });
    mockedFetchForRoles.mockResolvedValue({ ok: false, permissions: [] });
  });

  it("reads (allowGrace: true) serve the last confirmed-good permissions from the grace cache", async () => {
    const context = await getGxpUserContext("platform-user-1", {
      allowGrace: true
    });

    expect(context).not.toBeNull();
    expect(context?.isSuperAdmin).toBe(false);
    expect([...(context?.permissions ?? [])]).toEqual(["GXP:VIEW:APPLICATION"]);
  });

  it("writes (allowGrace: false) deny immediately even though a valid grace cache entry exists", async () => {
    const context = await getGxpUserContext("platform-user-1", {
      allowGrace: false
    });

    expect(context).not.toBeNull();
    expect(context?.isSuperAdmin).toBe(false);
    expect([...(context?.permissions ?? [])]).toEqual([]);
  });

  it("defaults to allowGrace: true when no options are passed (e.g. the /gxp-me read endpoint)", async () => {
    const context = await getGxpUserContext("platform-user-1");

    expect([...(context?.permissions ?? [])]).toEqual(["GXP:VIEW:APPLICATION"]);
  });

  it("denies (no gxpUser access at all) when there is no grace cache to fall back to, regardless of allowGrace", async () => {
    mockedCache.get.mockResolvedValue(null);

    const context = await getGxpUserContext("platform-user-1", {
      allowGrace: true
    });

    expect(context).not.toBeNull();
    expect([...(context?.permissions ?? [])]).toEqual([]);
  });
});
