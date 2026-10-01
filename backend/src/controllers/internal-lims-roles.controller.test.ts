jest.mock("../services/lims-role-sync.service", () => {
  class LimsRoleSyncBlocked extends Error {
    statusCode = 409;
    constructor(public blockers: { kind: string; detail: string }[]) {
      super(blockers.map((b) => b.detail).join(" "));
    }
  }
  return { LimsRoleSyncBlocked, syncLimsRoles: jest.fn() };
});

import { Request, Response } from "express";
import {
  LimsRoleSyncBlocked,
  syncLimsRoles
} from "../services/lims-role-sync.service";
import { syncLimsRolesHandler } from "./internal-lims-roles.controller";

const mockedSync = syncLimsRoles as jest.MockedFunction<typeof syncLimsRoles>;

const ROLE_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR_ID = "22222222-2222-4222-8222-222222222222";

const run = async (body: unknown) => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  } as unknown as Response;
  const next = jest.fn();
  await syncLimsRolesHandler({ body } as Request, res, next);
  return { res, next };
};

const validBody = () => ({
  roles: [
    { id: ROLE_ID, roleCode: "LAB_USER", name: "Lab User", operateAll: false }
  ],
  entries: [{ roleId: ROLE_ID, entry: "SAMPLE", canView: true }],
  actor: { id: ACTOR_ID, email: "manager@example.com" },
  changeReason: "added sample access"
});

describe("PUT /internal/lims-roles/sync", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the roles, entries, actor and reason through to the sync", async () => {
    mockedSync.mockResolvedValue({ pointers: [], changed: [] });

    const { res } = await run(validBody());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedSync).toHaveBeenCalledWith(
      {
        roles: [
          expect.objectContaining({
            id: ROLE_ID,
            name: "Lab User",
            isDeleted: false
          })
        ],
        entries: [
          {
            roleId: ROLE_ID,
            entry: "SAMPLE",
            canView: true,
            canCreate: false,
            canEdit: false,
            canRemove: false
          }
        ]
      },
      {
        actor: { id: ACTOR_ID, email: "manager@example.com" },
        reason: "added sample access"
      }
    );
  });

  // lims-service rolls its own edit back on this answer, so a blocked sync must be a clear
  // 409 that changed nothing — never a 200 with a partial result.
  it("answers 409 with the blockers when the sync is blocked", async () => {
    mockedSync.mockRejectedValue(
      new LimsRoleSyncBlocked([
        {
          kind: "name_collision",
          detail:
            'LIMS role "Auditor" collides with an existing backend Custom role.'
        } as any
      ])
    );

    const { res } = await run(validBody());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        blockers: [expect.objectContaining({ kind: "name_collision" })]
      })
    );
  });

  it("rejects a body without role and entry arrays", async () => {
    const { res } = await run({ roles: "nope" });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedSync).not.toHaveBeenCalled();
  });

  it("rejects a role with no usable id", async () => {
    const { res } = await run({
      roles: [{ id: "not-a-uuid", name: "X" }],
      entries: []
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedSync).not.toHaveBeenCalled();
  });

  it("records a system reason when LIMS sends none", async () => {
    mockedSync.mockResolvedValue({ pointers: [], changed: [] });

    await run({ ...validBody(), changeReason: undefined, actor: undefined });

    expect(mockedSync).toHaveBeenCalledWith(expect.anything(), {
      actor: undefined,
      reason: "Lab Role changed in LIMS"
    });
  });
});
