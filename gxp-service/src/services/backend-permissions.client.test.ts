import {
  createPermissionsBreaker,
  PERMISSIONS_BREAKER_OPTIONS
} from "./backend-permissions.client";

const OK = { ok: true, permissions: ["GXP:VIEW:APPLICATION"] };

describe("permissions circuit breaker", () => {
  it("passes a successful result straight through", async () => {
    const request = jest.fn().mockResolvedValue(OK);
    const breaker = createPermissionsBreaker(request);

    await expect(breaker.fire("/p")).resolves.toEqual(OK);

    breaker.shutdown();
  });

  // The contract every caller depends on: a failure resolves to { ok: false } rather than
  // rejecting, so "couldn't determine" stays distinguishable from "no permissions".
  it("resolves a failed request to ok:false instead of rejecting", async () => {
    const request = jest.fn().mockRejectedValue(new Error("backend down"));
    const breaker = createPermissionsBreaker(request);

    await expect(breaker.fire("/p")).resolves.toEqual({
      ok: false,
      permissions: []
    });

    breaker.shutdown();
  });

  it("opens once the failure threshold is reached and then short-circuits", async () => {
    const request = jest.fn().mockRejectedValue(new Error("backend down"));
    const breaker = createPermissionsBreaker(request);

    const threshold = PERMISSIONS_BREAKER_OPTIONS.volumeThreshold;
    for (let i = 0; i < threshold; i++) {
      await breaker.fire("/p");
    }

    expect(breaker.opened).toBe(true);

    // Now that it is open, further calls must not reach the network at all.
    const callsBefore = request.mock.calls.length;
    await expect(breaker.fire("/p")).resolves.toEqual({
      ok: false,
      permissions: []
    });
    expect(request).toHaveBeenCalledTimes(callsBefore);

    breaker.shutdown();
  });

  it("half-opens after the reset window and closes again once backend recovers", async () => {
    const request = jest.fn().mockRejectedValue(new Error("backend down"));
    const breaker = createPermissionsBreaker(request, { resetTimeout: 50 });

    for (let i = 0; i < PERMISSIONS_BREAKER_OPTIONS.volumeThreshold; i++) {
      await breaker.fire("/p");
    }
    expect(breaker.opened).toBe(true);

    const halfOpened = new Promise<void>((resolve) =>
      breaker.once("halfOpen", () => resolve())
    );
    await halfOpened;

    // Backend is healthy again — the probe request should close the circuit.
    request.mockResolvedValue(OK);
    await expect(breaker.fire("/p")).resolves.toEqual(OK);

    expect(breaker.closed).toBe(true);
    expect(breaker.opened).toBe(false);

    breaker.shutdown();
  });

  it("keeps the breaker timeout above the request timeout", () => {
    // If the breaker gave up first it would record a failure while the request was still
    // in flight, leaving a dangling request the caller never learns about.
    expect(PERMISSIONS_BREAKER_OPTIONS.timeout).toBeGreaterThan(3000);
  });
});
