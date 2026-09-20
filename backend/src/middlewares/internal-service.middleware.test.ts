import { Request, Response, NextFunction } from "express";
import ENV from "../utils/environment";
import { authenticateInternalService } from "./internal-service.middleware";

jest.mock("../utils/environment", () => ({
  __esModule: true,
  default: { INTERNAL_API_KEY: undefined as string | undefined }
}));

const mockedEnv = ENV as { INTERNAL_API_KEY: string | undefined };

const buildReqRes = (headerValue?: string) => {
  const req = {
    headers: headerValue === undefined ? {} : { "x-internal-api-key": headerValue }
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  } as unknown as Response;

  return { req, res, next: jest.fn() as NextFunction };
};

const expectRejected = (res: Response, next: NextFunction) => {
  expect(res.status).toHaveBeenCalledWith(401);
  expect(next).not.toHaveBeenCalled();
};

describe("authenticateInternalService", () => {
  beforeEach(() => {
    mockedEnv.INTERNAL_API_KEY = "correct-secret";
  });

  it("admits a request carrying the configured key", () => {
    const { req, res, next } = buildReqRes("correct-secret");

    authenticateInternalService(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a request with no key header at all", () => {
    const { req, res, next } = buildReqRes();

    authenticateInternalService(req, res, next);

    expectRejected(res, next);
  });

  it("rejects a wrong key rather than falling through", () => {
    const { req, res, next } = buildReqRes("wrong-secret");

    authenticateInternalService(req, res, next);

    expectRejected(res, next);
  });

  it("rejects an empty-string key", () => {
    const { req, res, next } = buildReqRes("");

    authenticateInternalService(req, res, next);

    expectRejected(res, next);
  });

  // The important one: an unconfigured server must not become an open door. A missing
  // INTERNAL_API_KEY has to deny everything, including a caller sending no key at all,
  // rather than letting undefined === undefined admit the request.
  it("denies every request when INTERNAL_API_KEY is not configured", () => {
    mockedEnv.INTERNAL_API_KEY = undefined;

    const noHeader = buildReqRes();
    authenticateInternalService(noHeader.req, noHeader.res, noHeader.next);
    expectRejected(noHeader.res, noHeader.next);

    const someHeader = buildReqRes("anything");
    authenticateInternalService(someHeader.req, someHeader.res, someHeader.next);
    expectRejected(someHeader.res, someHeader.next);
  });
});
