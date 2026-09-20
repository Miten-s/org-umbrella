import { Request, Response } from "express";
import {
  preventRoleEscalation,
  preventSelfModification
} from "./access-guards.middleware";
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

describe("preventRoleEscalation — unparseable vs genuinely empty", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("denies with 400 when there is no body to read the roles out of", async () => {
    const req = {
      body: undefined,
      access: { isSuperAdmin: false, permissions: [] }
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as unknown as Response;
    const next = jest.fn();

    await preventRoleEscalation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("passes a payload that grants no roles at all (nothing to escalate with)", async () => {
    const { req, res, next } = buildReqRes({ status: "disabled" }, []);

    await preventRoleEscalation(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});

describe("preventSelfModification — unparseable vs genuinely empty", () => {
  const runWith = async (extracted: string[] | null) => {
    const req = {
      access: { isSuperAdmin: false, permissions: [] }
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as unknown as Response;
    const next = jest.fn();

    await preventSelfModification(() => extracted)(req, res, next);
    return { res, next };
  };

  // The actual hardening: an extractor that cannot find the ids must not hand the request
  // on to a controller that reads them from somewhere else.
  it("denies with 400 when the extractor cannot parse the request", async () => {
    const { res, next } = await runWith(null);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes when the request parsed cleanly and targets nobody", async () => {
    const { res, next } = await runWith([]);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("passes when every extracted id is falsy (nothing real to check)", async () => {
    const { res, next } = await runWith(["", ""]);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
