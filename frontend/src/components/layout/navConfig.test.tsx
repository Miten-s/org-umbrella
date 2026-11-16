import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/types/common.types";
import {
  ADMIN_PERMISSIONS,
  GXP_PERMISSIONS,
  LIMS_PERMISSIONS,
  ROLES
} from "@/utils/permissions";

const mockAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuth()
}));

// Menu labels come back as raw i18n keys, which makes the assertions explicit.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { useNavItems, serviceOf } = await import("./navConfig");

const userWith = (
  roleName: string,
  ...permissions: string[]
): AuthenticatedUser => ({
  id: "user-1",
  roles: [
    { name: roleName, permissions: permissions.map((name) => ({ name })) }
  ]
});

/** Every visible label: top-level entries and their groups. */
const labelsFor = (user: AuthenticatedUser | null) => {
  mockAuth.mockReturnValue({ user, isAuthenticated: !!user, isLoading: false });
  const { result } = renderHook(() => useNavItems());
  return result.current.flatMap((item) => [
    item.name,
    ...(item.groups ?? []).map((group) => group.name)
  ]);
};

describe("navigation — visibility by permission", () => {
  beforeEach(() => mockAuth.mockReset());

  it("hides GXP from a user with no GXP permissions", () => {
    const labels = labelsFor(
      userWith("PLAIN_USER", ADMIN_PERMISSIONS.VIEW_DASHBOARD)
    );
    expect(labels).toContain("dashboard");
    expect(labels).not.toContain("gxpService");
  });

  it("shows GXP once the user holds a single GXP permission", () => {
    expect(
      labelsFor(userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST))
    ).toContain("gxpService");
  });

  it("hides System IT Administration and LIMS from a GXP-only user", () => {
    const labels = labelsFor(
      userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)
    );
    expect(labels).not.toContain("systemITAdministration");
    expect(labels).not.toContain("limsLabAccess");
    expect(labels).not.toContain("limsLabSetup");
  });

  it("shows System IT Administration to a user with admin user permissions", () => {
    const labels = labelsFor(
      userWith("SYS_ADMIN", ADMIN_PERMISSIONS.VIEW_USER)
    );
    expect(labels).toContain("systemITAdministration");
    expect(labels).not.toContain("gxpService");
    expect(labels).not.toContain("companySetup");
  });

  it("shows every menu to an OPERATE:ALL super admin", () => {
    const labels = labelsFor(
      userWith(ROLES.SUPER_ADMIN, ADMIN_PERMISSIONS.OPERATE_ALL)
    );
    for (const label of [
      "dashboard",
      "systemITAdministration",
      "gxpService",
      "limsLabAccess",
      "limsLabSetup",
      "companySetup",
      "mySpace"
    ])
      expect(labels).toContain(label);
  });

  it("shows only the LIMS groups a user holds permissions for", () => {
    const admin = labelsFor(userWith("LIMS_ADMIN", LIMS_PERMISSIONS.VIEW_USER));
    expect(admin).toContain("limsLabAccess");
    expect(admin).not.toContain("limsLabSetup");

    const analyst = labelsFor(
      userWith("LIMS_ANALYST", LIMS_PERMISSIONS.VIEW_INSTRUMENT)
    );
    expect(analyst).toContain("limsLabSetup");
    expect(analyst).not.toContain("limsLabAccess");
  });

  it("shows nothing when there is no signed-in user", () => {
    expect(labelsFor(null)).toEqual([]);
  });
});

describe("serviceOf", () => {
  it("names the service a page belongs to", () => {
    expect(serviceOf("/lims/samples/abc")).toBe("lims");
    expect(serviceOf("/gxp-service/users")).toBe("gxp");
    expect(serviceOf("/client/system/users")).toBe("admin");
    expect(serviceOf("/dashboard")).toBeNull();
  });
});
