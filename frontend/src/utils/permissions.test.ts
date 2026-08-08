import { describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "@/types/common.types";
import {
  ADMIN_PERMISSIONS,
  GXP_PERMISSIONS,
  ROLES,
  getUserPermissions,
  getUserRoles,
  hasAnyPermission,
  hasAnyRole,
  hasPermission,
  hasRole
} from "./permissions";

/** Build a user carrying one role with the given permission names. */
const userWith = (roleName: string, ...permissions: string[]): AuthenticatedUser => ({
  id: "user-1",
  roles: [{ name: roleName, permissions: permissions.map((name) => ({ name })) }]
});

/** Build a user carrying several roles, so permission union is exercised. */
const userWithRoles = (
  ...roles: { name: string; permissions: string[] }[]
): AuthenticatedUser => ({
  id: "user-1",
  roles: roles.map((role) => ({
    name: role.name,
    permissions: role.permissions.map((name) => ({ name }))
  }))
});

describe("hasPermission", () => {
  it("grants a permission the user's role actually carries", () => {
    const user = userWith("GXP_OPERATOR", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST);
    expect(hasPermission(user, GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)).toBe(true);
  });

  it("denies a permission the user does not carry", () => {
    const user = userWith("GXP_OPERATOR", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST);
    expect(hasPermission(user, GXP_PERMISSIONS.DELETE_SERVICE_REQUEST)).toBe(false);
  });

  it("treats OPERATE:ALL as a wildcard granting every permission", () => {
    const superAdmin = userWith("SUPER_ADMIN", ADMIN_PERMISSIONS.OPERATE_ALL);
    expect(hasPermission(superAdmin, GXP_PERMISSIONS.DELETE_SERVICE_REQUEST)).toBe(true);
    expect(hasPermission(superAdmin, ADMIN_PERMISSIONS.DELETE_USER)).toBe(true);
  });

  it("unions permissions across multiple roles", () => {
    const user = userWithRoles(
      { name: "VIEWER", permissions: [GXP_PERMISSIONS.VIEW_SERVICE_REQUEST] },
      { name: "EDITOR", permissions: [GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST] }
    );
    expect(hasPermission(user, GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)).toBe(true);
    expect(hasPermission(user, GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST)).toBe(true);
    expect(hasPermission(user, GXP_PERMISSIONS.DELETE_SERVICE_REQUEST)).toBe(false);
  });

  it("denies everything for an anonymous or malformed user", () => {
    expect(hasPermission(null, GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)).toBe(false);
    expect(hasPermission(undefined, GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)).toBe(false);
    expect(hasPermission({} as AuthenticatedUser, GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)).toBe(false);
  });

  it("denies when a role carries no permissions at all", () => {
    const user: AuthenticatedUser = { id: "u", roles: [{ name: "EMPTY" }] };
    expect(hasPermission(user, GXP_PERMISSIONS.VIEW_SERVICE_REQUEST)).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("passes when the user holds at least one of the listed permissions", () => {
    const user = userWith("GXP_OPERATOR", GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST);
    expect(
      hasAnyPermission(user, [
        GXP_PERMISSIONS.CREATE_SERVICE_REQUEST,
        GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST
      ])
    ).toBe(true);
  });

  it("fails when the user holds none of them", () => {
    const user = userWith("GXP_OPERATOR", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST);
    expect(
      hasAnyPermission(user, [
        GXP_PERMISSIONS.CREATE_SERVICE_REQUEST,
        GXP_PERMISSIONS.DELETE_SERVICE_REQUEST
      ])
    ).toBe(false);
  });

  it("honours the OPERATE:ALL wildcard", () => {
    const superAdmin = userWith("SUPER_ADMIN", ADMIN_PERMISSIONS.OPERATE_ALL);
    expect(hasAnyPermission(superAdmin, [GXP_PERMISSIONS.DELETE_SERVICE_REQUEST])).toBe(true);
  });
});

describe("role helpers", () => {
  it("matches a role by name", () => {
    const user = userWith(ROLES.ADMIN, ADMIN_PERMISSIONS.VIEW_DASHBOARD);
    expect(hasRole(user, ROLES.ADMIN)).toBe(true);
    expect(hasRole(user, ROLES.SUPER_ADMIN)).toBe(false);
  });

  it("matches any of several roles", () => {
    const user = userWith(ROLES.USER, ADMIN_PERMISSIONS.VIEW_DASHBOARD);
    expect(hasAnyRole(user, [ROLES.ADMIN, ROLES.USER])).toBe(true);
    expect(hasAnyRole(user, [ROLES.ADMIN, ROLES.SUPER_ADMIN])).toBe(false);
  });

  it("reports the flattened permission and role names", () => {
    const user = userWithRoles(
      { name: "VIEWER", permissions: [GXP_PERMISSIONS.VIEW_SERVICE_REQUEST] },
      { name: "EDITOR", permissions: [GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST] }
    );
    expect(getUserRoles(user)).toEqual(["VIEWER", "EDITOR"]);
    expect(getUserPermissions(user)).toEqual([
      GXP_PERMISSIONS.VIEW_SERVICE_REQUEST,
      GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST
    ]);
  });

  it("returns empty lists for an anonymous user", () => {
    expect(getUserRoles(null)).toEqual([]);
    expect(getUserPermissions(null)).toEqual([]);
  });
});
