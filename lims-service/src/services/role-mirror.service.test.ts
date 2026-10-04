const mockEnv: Record<string, string | undefined> = {};

jest.mock("../utils/environment", () => ({
  __esModule: true,
  default: mockEnv
}));
jest.mock("../configs/logger.config", () => ({
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn()
}));
jest.mock("../configs/db.sequelize", () => ({
  sequelize: {
    query: jest.fn(),
    transaction: jest.fn((run: (t: unknown) => unknown) =>
      run({ id: "catch-up" })
    )
  }
}));
jest.mock("../models/role.model", () => ({
  __esModule: true,
  default: { findAll: jest.fn(), update: jest.fn() }
}));
jest.mock("../models/role-entry.model", () => ({
  __esModule: true,
  default: {}
}));

import Role from "../models/role.model";
import { logError } from "../configs/logger.config";
import { sequelize } from "../configs/db.sequelize";
import {
  RoleMirrorRejected,
  RoleMirrorUnavailable,
  catchUpRolesWithBackend,
  mirrorRolesToBackend
} from "./role-mirror.service";

const mockedFindAll = Role.findAll as jest.Mock;
const mockedUpdate = Role.update as jest.Mock;
const fetchMock = jest.fn();

const TXN = { id: "txn" } as any;
const ARGS = {
  transaction: TXN,
  actor: { id: "actor-1" },
  changeReason: "added sample access"
};

const LAB_USER = {
  id: "lims-role-1",
  roleId: "LAB_USER",
  name: "Lab User",
  operateAll: false,
  isDeleted: false,
  deletedAt: null,
  backendRoleId: null,
  entries: [
    {
      entry: "SAMPLE",
      canView: true,
      canCreate: false,
      canEdit: false,
      canRemove: false
    }
  ]
};
const DELETED_ROLE = {
  ...LAB_USER,
  id: "lims-role-2",
  roleId: "OLD",
  name: "Old Role",
  isDeleted: true,
  deletedAt: new Date("2026-09-01T00:00:00Z"),
  backendRoleId: "backend-old",
  entries: []
};

const answer = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  }) as Response;

describe("mirrorRolesToBackend", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockEnv.LIMS_PERMISSION_SOURCE = "dual";
    mockEnv.INTERNAL_API_KEY = "secret";
    mockEnv.BACKEND_INTERNAL_URL = "http://backend:9000";
    mockedFindAll.mockResolvedValue([LAB_USER, DELETED_ROLE]);
    fetchMock.mockResolvedValue(
      answer(200, {
        pointers: [
          { limsRoleId: "lims-role-1", backendRoleId: "backend-lab-user" },
          { limsRoleId: "lims-role-2", backendRoleId: "backend-old" }
        ]
      })
    );
  });

  it("sends every role, deleted ones included, with who changed it and why", async () => {
    await mirrorRolesToBackend(ARGS);

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe("http://backend:9000/internal/lims-roles/sync");
    expect(init.method).toBe("PUT");
    expect(init.headers["x-internal-api-key"]).toBe("secret");
    expect(body.roles.map((r: any) => [r.id, r.roleCode, r.isDeleted])).toEqual(
      [
        ["lims-role-1", "LAB_USER", false],
        ["lims-role-2", "OLD", true]
      ]
    );
    expect(body.entries).toEqual([
      {
        roleId: "lims-role-1",
        entry: "SAMPLE",
        canView: true,
        canCreate: false,
        canEdit: false,
        canRemove: false
      }
    ]);
    expect(body.actor).toEqual({ id: "actor-1" });
    expect(body.changeReason).toBe("added sample access");
  });

  // What is pushed must be what is about to be committed, not what was there before.
  it("reads the roles through the write's own transaction", async () => {
    await mirrorRolesToBackend(ARGS);

    expect(mockedFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: TXN })
    );
  });

  it("stores a new backend pointer in the same transaction, and leaves unchanged ones", async () => {
    await mirrorRolesToBackend(ARGS);

    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).toHaveBeenCalledWith(
      { backendRoleId: "backend-lab-user" },
      { where: { id: "lims-role-1" }, transaction: TXN }
    );
  });

  // A conflict never resolves on its own, so the edit has to fail and say why — in any mode.
  it("fails the edit when backend rejects the change", async () => {
    fetchMock.mockResolvedValue(
      answer(409, {
        error:
          'LIMS role "Auditor" collides with an existing backend Custom role.'
      })
    );

    await expect(mirrorRolesToBackend(ARGS)).rejects.toBeInstanceOf(
      RoleMirrorRejected
    );
    await expect(mirrorRolesToBackend(ARGS)).rejects.toThrow(
      /collides with an existing/
    );
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  // While LIMS still enforces its own roles, a backend outage must not stop lab managers
  // editing them. The gap is logged, never silent.
  it("lets the edit through, loudly, when backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(mirrorRolesToBackend(ARGS)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      "LIMS role change saved but not mirrored to backend",
      expect.anything(),
      "mirrorRolesToBackend"
    );
  });

  it("treats a backend 500 the same as an outage", async () => {
    fetchMock.mockResolvedValue(answer(500, {}));

    await expect(mirrorRolesToBackend(ARGS)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });

  it("treats missing configuration as an outage rather than crashing", async () => {
    mockEnv.INTERNAL_API_KEY = undefined;

    await expect(mirrorRolesToBackend(ARGS)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalled();
  });

  it("does nothing at all in local mode", async () => {
    mockEnv.LIMS_PERMISSION_SOURCE = "local";

    await mirrorRolesToBackend(ARGS);

    expect(mockedFindAll).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Once backend is what LIMS enforces, a change that didn't reach it would be saved but
  // have no effect — or, for a revocation, leave access in place.
  it("fails the edit on an outage once backend is what LIMS enforces", async () => {
    mockEnv.LIMS_PERMISSION_SOURCE = "backend";
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(mirrorRolesToBackend(ARGS)).rejects.toBeInstanceOf(
      RoleMirrorUnavailable
    );
    await expect(mirrorRolesToBackend(ARGS)).rejects.toMatchObject({
      statusCode: 503
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });
});

describe("pushes are serialized and missed changes are caught up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockEnv.LIMS_PERMISSION_SOURCE = "dual";
    mockEnv.INTERNAL_API_KEY = "key";
    mockEnv.BACKEND_INTERNAL_URL = "http://backend";
    global.fetch = fetchMock as any;
    mockedFindAll.mockResolvedValue([LAB_USER]);
  });

  afterEach(() => jest.useRealTimers());

  it("takes the mirror lock in the write's transaction before reading roles", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ pointers: [] })
    });

    await mirrorRolesToBackend(ARGS);

    const lockCall = (sequelize.query as jest.Mock).mock.calls[0];
    expect(lockCall[0]).toContain("pg_advisory_xact_lock");
    expect(lockCall[1].transaction).toBe(TXN);
  });

  it("schedules a catch-up when an edit could not be mirrored in dual mode", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await mirrorRolesToBackend(ARGS);

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ pointers: [], changed: [{ limsRoleId: "x" }] })
    });
    await jest.advanceTimersByTimeAsync(30_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports failure without throwing when backend is still down", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(catchUpRolesWithBackend()).resolves.toBe(false);
  });

  it("does nothing in local mode", async () => {
    mockEnv.LIMS_PERMISSION_SOURCE = "local";

    await expect(catchUpRolesWithBackend()).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
