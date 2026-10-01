import {
  comparePermissions,
  fromBackendPermissions,
  parsePermissionSource
} from "./permission-parity";

const set = (...names: string[]) => new Set(names);

describe("fromBackendPermissions", () => {
  it("keeps only LIMS permissions from backend's cross-service answer", () => {
    const result = fromBackendPermissions([
      "LIMS:VIEW:SAMPLE",
      "GXP:VIEW:APPLICATION",
      "VIEW:ROLE"
    ]);

    expect([...result.permissions]).toEqual(["LIMS:VIEW:SAMPLE"]);
    expect(result.operateAll).toBe(false);
  });

  it("reads LIMS:OPERATE:ALL as operate_all and drops it from the list", () => {
    const result = fromBackendPermissions([
      "LIMS:OPERATE:ALL",
      "LIMS:VIEW:SAMPLE"
    ]);

    expect(result.operateAll).toBe(true);
    expect([...result.permissions]).toEqual(["LIMS:VIEW:SAMPLE"]);
  });

  // Platform super admin is resolved on its own path before either side runs. Reading the
  // bare string as LIMS operate_all here would reintroduce the collision migration 021
  // was written to avoid.
  it("does not treat the platform's bare OPERATE:ALL as LIMS operate_all", () => {
    expect(fromBackendPermissions(["OPERATE:ALL"]).operateAll).toBe(false);
  });
});

describe("comparePermissions", () => {
  it("matches identical permission sets", () => {
    const result = comparePermissions(
      { permissions: set("LIMS:VIEW:SAMPLE"), operateAll: false },
      { permissions: set("LIMS:VIEW:SAMPLE"), operateAll: false }
    );
    expect(result.match).toBe(true);
  });

  it("reports what each side has that the other lacks", () => {
    const result = comparePermissions(
      {
        permissions: set("LIMS:VIEW:SAMPLE", "LIMS:CREATE:SAMPLE"),
        operateAll: false
      },
      {
        permissions: set("LIMS:VIEW:SAMPLE", "LIMS:DELETE:SAMPLE"),
        operateAll: false
      }
    );

    expect(result.match).toBe(false);
    expect(result.onlyLocal).toEqual(["LIMS:CREATE:SAMPLE"]);
    expect(result.onlyBackend).toEqual(["LIMS:DELETE:SAMPLE"]);
  });

  it("flags an operate_all difference even when the lists agree", () => {
    const result = comparePermissions(
      { permissions: set(), operateAll: true },
      { permissions: set(), operateAll: false }
    );
    expect(result.match).toBe(false);
  });

  // When both sides grant the wildcard, what the lists say cannot change what the user may
  // do — so a list difference there is not a real mismatch.
  it("treats list differences under operate_all on both sides as a match", () => {
    const result = comparePermissions(
      { permissions: set("LIMS:VIEW:SAMPLE"), operateAll: true },
      { permissions: set(), operateAll: true }
    );
    expect(result.match).toBe(true);
  });

  it("matches a user with no LIMS access on either side", () => {
    expect(
      comparePermissions(
        { permissions: set(), operateAll: false },
        { permissions: set(), operateAll: false }
      ).match
    ).toBe(true);
  });
});

describe("parsePermissionSource", () => {
  it("defaults to dual", () => {
    expect(parsePermissionSource(undefined)).toBe("dual");
    expect(parsePermissionSource("")).toBe("dual");
    expect(parsePermissionSource("dual")).toBe("dual");
  });

  it("honours local", () => {
    expect(parsePermissionSource("local")).toBe("local");
  });

  it("honours backend, the mode where backend's answer is enforced", () => {
    expect(parsePermissionSource("backend")).toBe("backend");
  });

  // A typo must never silently hand enforcement somewhere unexpected: "local" is the one
  // mode with no dependency on backend.
  it("falls back to local for anything unrecognised", () => {
    expect(parsePermissionSource("DUAL")).toBe("local");
    expect(parsePermissionSource("Backend")).toBe("local");
    expect(parsePermissionSource("remote")).toBe("local");
  });
});
