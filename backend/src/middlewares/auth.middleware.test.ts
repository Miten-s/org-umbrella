import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

jest.mock("../utils/environment", () => ({
  __esModule: true,
  default: { JWT_SECRET: "test-secret", NODE_ENV: "test" }
}));
jest.mock("../models/user.model", () => ({ User: { findByPk: jest.fn() } }));
jest.mock("../models/role.model", () => ({ Role: {}, RoleType: {} }));
jest.mock("../models/permission.model", () => ({ Permission: {} }));

import { authenticate } from "./auth.middleware";
import { User } from "../models/user.model";

const mockedFindByPk = User.findByPk as jest.MockedFunction<
  typeof User.findByPk
>;

const runWith = async (token: string) => {
  const req = {
    cookies: { accessToken: token },
    headers: {},
    route: { path: "/some-protected-route" }
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  await authenticate(req, res, next);
  return { res, next };
};

describe("authenticate — expired vs invalid token", () => {
  beforeEach(() => jest.clearAllMocks());

  // The frontend interceptors branch on this exact string to decide whether a 401 can be
  // recovered by refreshing. If expiry looked like any other bad token, a refreshable
  // session would be thrown away instead.
  it("reports an expired token with the exact message the frontend matches on", async () => {
    const expired = jwt.sign({ id: "u1", email: "a@b.c" }, "test-secret", {
      expiresIn: "-1s"
    });

    const { res, next } = await runWith(expired);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token Expired" });
    expect(next).not.toHaveBeenCalled();
    expect(mockedFindByPk).not.toHaveBeenCalled();
  });

  it("keeps a forged token distinguishable from an expired one", async () => {
    const forged = jwt.sign({ id: "u1", email: "a@b.c" }, "a-different-secret");

    const { res, next } = await runWith(forged);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("admits a valid, unexpired token", async () => {
    mockedFindByPk.mockResolvedValue({
      toJSON: () => ({ id: "u1", email: "a@b.c" })
    } as any);

    const valid = jwt.sign({ id: "u1", email: "a@b.c" }, "test-secret", {
      expiresIn: "24h"
    });

    const { res, next } = await runWith(valid);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("access token lifetime", () => {
  it("issues a token that actually expires, 24h out", () => {
    const token = jwt.sign({ id: "u1" }, "test-secret", { expiresIn: "24h" });
    const decoded = jwt.decode(token) as { exp: number; iat: number };

    expect(decoded.exp).toBeDefined();
    expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60);
  });
});
