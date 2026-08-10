import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/types/common.types";
import { ADMIN_PERMISSIONS, GXP_PERMISSIONS, ROLES } from "@/utils/permissions";

const mockAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuth()
}));

// react-loader-spinner pulls in styled-components, which blows up under jsdom.
// The spinner is irrelevant to access control, so stub it.
vi.mock("@/components/common/LoadingSpinner", () => {
  const Stub = () => <div data-testid="loading-spinner" />;
  return { __esModule: true, default: Stub, LoadingSpinner: Stub };
});

// Imported after the mock so ProtectedRoute picks up the stubbed useAuth.
const { default: ProtectedRoute } = await import("./Protected");

const userWith = (roleName: string, ...permissions: string[]): AuthenticatedUser => ({
  id: "user-1",
  roles: [{ name: roleName, permissions: permissions.map((name) => ({ name })) }]
});

const setAuth = (state: {
  user: AuthenticatedUser | Record<string, never>;
  isAuthenticated: boolean;
  isLoading?: boolean;
}) => mockAuth.mockReturnValue({ isLoading: false, ...state });

/**
 * Renders the guarded page at `/gxp-service/users` with a stand-in sign-in
 * route, so a redirect is observable as rendered content.
 */
const renderGuarded = (props: { requiredPermission?: string; requiredRole?: string }) =>
  render(
    <MemoryRouter initialEntries={["/gxp-service/users"]}>
      <Routes>
        <Route path="/sign-in" element={<div>Sign in page</div>} />
        <Route
          path="/gxp-service/users"
          element={
            <ProtectedRoute {...props}>
              <div>GXP Users page</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  beforeEach(() => mockAuth.mockReset());

  it("redirects an unauthenticated visitor to the sign-in page", () => {
    setAuth({ user: {}, isAuthenticated: false });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.VIEW_USER });

    expect(screen.getByText("Sign in page")).toBeInTheDocument();
    expect(screen.queryByText("GXP Users page")).not.toBeInTheDocument();
  });

  it("redirects when the session is empty even if the flag says authenticated", () => {
    setAuth({ user: {}, isAuthenticated: true });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.VIEW_USER });

    expect(screen.getByText("Sign in page")).toBeInTheDocument();
  });

  it("shows Access Denied — not a redirect — when signed in without the permission", () => {
    setAuth({
      user: userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST),
      isAuthenticated: true
    });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.VIEW_USER });

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You don't have permission to access this page")
    ).toBeInTheDocument();
    // The user stays put rather than bouncing to sign-in.
    expect(screen.queryByText("Sign in page")).not.toBeInTheDocument();
    expect(screen.queryByText("GXP Users page")).not.toBeInTheDocument();
  });

  it("offers Go Back and Go Home escape hatches on the denial screen", () => {
    setAuth({ user: userWith("GXP_VIEWER"), isAuthenticated: true });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.VIEW_USER });

    expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Home" })).toBeInTheDocument();
  });

  it("renders the page when the user holds the required permission", () => {
    setAuth({
      user: userWith("GXP_ADMIN", GXP_PERMISSIONS.VIEW_USER),
      isAuthenticated: true
    });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.VIEW_USER });

    expect(screen.getByText("GXP Users page")).toBeInTheDocument();
  });

  it("lets an OPERATE:ALL super admin through any permission gate", () => {
    setAuth({
      user: userWith(ROLES.SUPER_ADMIN, ADMIN_PERMISSIONS.OPERATE_ALL),
      isAuthenticated: true
    });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.DELETE_SERVICE_REQUEST });

    expect(screen.getByText("GXP Users page")).toBeInTheDocument();
  });

  it("denies when the required ROLE is missing, even with the permission", () => {
    setAuth({
      user: userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_USER),
      isAuthenticated: true
    });

    renderGuarded({
      requiredPermission: GXP_PERMISSIONS.VIEW_USER,
      requiredRole: ROLES.ADMIN
    });

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("waits while the session is still resolving instead of bouncing to sign-in", () => {
    setAuth({ user: {}, isAuthenticated: false, isLoading: true });

    renderGuarded({ requiredPermission: GXP_PERMISSIONS.VIEW_USER });

    // Neither the page nor a premature redirect.
    expect(screen.queryByText("GXP Users page")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign in page")).not.toBeInTheDocument();
  });
});
