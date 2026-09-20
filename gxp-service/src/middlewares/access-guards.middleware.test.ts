import { Request, Response } from "express";
import { preventRoleEscalation } from "./access-guards.middleware";
import { fetchPermissionNamesForRoleIds } from "../services/inter-service-calls.service";

jest.mock("../services/inter-service-calls.service");

const mockedFetch = fetchPermissionNamesForRoleIds as jest.MockedFunction<
  typeof fetchPermissionNamesForRoleIds
>;

const buildReqRes = (body: Record<string, unknown>, granted: string[]) => {
  const req = {
    body,
    access: { isSuperAdmin: false, permissions: granted }
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  } as unknown as Response;

  const next = jest.fn();

  return { req, res, next };
};

describe("preventRoleEscalation", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("blocks with 503 and does not call next when the permissions lookup fails (backend unreachable)", async () => {
    mockedFetch.mockResolvedValue({ ok: false, permissions: [] });

    const { req, res, next } = buildReqRes(
      { roles: ["role-with-unknown-permissions"] },
      ["GXP:VIEW:APPLICATION"]
    );

    await preventRoleEscalation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks with 403 when the lookup succeeds and the requested role grants more than the actor holds", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["GXP:VIEW:APPLICATION", "GXP:DELETE:APPLICATION"]
    });

    const { req, res, next } = buildReqRes(
      { roles: ["role-with-delete"] },
      ["GXP:VIEW:APPLICATION"]
    );

    await preventRoleEscalation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the lookup succeeds and the requested role grants nothing beyond the actor's own permissions", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      permissions: ["GXP:VIEW:APPLICATION"]
    });

    const { req, res, next } = buildReqRes(
      { roles: ["role-view-only"] },
      ["GXP:VIEW:APPLICATION"]
    );

    await preventRoleEscalation(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
