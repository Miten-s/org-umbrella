jest.mock("./user-context.service", () => ({
  invalidateUserContext: jest.fn().mockResolvedValue(undefined),
  invalidateAllUserContexts: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../configs/redis.config", () => ({
  __esModule: true,
  default: { duplicate: jest.fn() },
  connectRedis: jest.fn()
}));

import {
  invalidateUserContext,
  invalidateAllUserContexts
} from "./user-context.service";
import { handleInvalidationMessage } from "./rbac-invalidation.subscriber";

const mockedUser = invalidateUserContext as jest.MockedFunction<
  typeof invalidateUserContext
>;
const mockedAll = invalidateAllUserContexts as jest.MockedFunction<
  typeof invalidateAllUserContexts
>;

describe("rbac invalidation routing", () => {
  beforeEach(() => jest.clearAllMocks());

  it("drops one user's context for a user-scoped message", async () => {
    await handleInvalidationMessage(
      JSON.stringify({ scope: "user", platformUserId: "user-1" })
    );

    expect(mockedUser).toHaveBeenCalledWith("user-1");
    expect(mockedAll).not.toHaveBeenCalled();
  });

  it("drops every context for an all-scoped message", async () => {
    await handleInvalidationMessage(JSON.stringify({ scope: "all" }));

    expect(mockedAll).toHaveBeenCalled();
    expect(mockedUser).not.toHaveBeenCalled();
  });

  // Over-invalidating costs a recompute; under-invalidating serves a permission that was
  // just revoked. Anything unrecognised has to fail towards the expensive side.
  it("drops every context when the message cannot be parsed", async () => {
    await handleInvalidationMessage("not json at all");

    expect(mockedAll).toHaveBeenCalled();
    expect(mockedUser).not.toHaveBeenCalled();
  });

  it("drops every context for an unknown scope", async () => {
    await handleInvalidationMessage(JSON.stringify({ scope: "something-new" }));

    expect(mockedAll).toHaveBeenCalled();
    expect(mockedUser).not.toHaveBeenCalled();
  });

  it("drops every context for a user-scoped message with no user id", async () => {
    await handleInvalidationMessage(JSON.stringify({ scope: "user" }));

    expect(mockedAll).toHaveBeenCalled();
    expect(mockedUser).not.toHaveBeenCalled();
  });
});
