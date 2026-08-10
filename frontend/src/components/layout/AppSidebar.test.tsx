import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

vi.mock("../../context/SidebarContext", () => ({
  useSidebar: () => ({
    isExpanded: true,
    isMobileOpen: false,
    isHovered: false,
    setIsHovered: vi.fn()
  })
}));

// Menu labels come back as raw i18n keys, which makes the assertions explicit.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { default: AppSidebar } = await import("./AppSidebar");

const userWith = (roleName: string, ...permissions: string[]): AuthenticatedUser => ({
  id: "user-1",
  roles: [{ name: roleName, permissions: permissions.map((name) => ({ name })) }]
});

const renderSidebar = (user: AuthenticatedUser | null) => {
  mockAuth.mockReturnValue({ user, isAuthenticated: !!user, isLoading: false });
  return render(
    <MemoryRouter>
      <AppSidebar />
    </MemoryRouter>
  );
};

describe("AppSidebar — menu visibility by permission", () => {
  beforeEach(() => mockAuth.mockReset());

  it("hides the GXP Service menu from a user with no GXP permissions", () => {
    renderSidebar(userWith("PLAIN_USER", ADMIN_PERMISSIONS.VIEW_DASHBOARD));

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByText("gxpService")).not.toBeInTheDocument();
  });

  it("shows the GXP Service menu once the user holds a single GXP permission", () => {
    renderSidebar(userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));

    expect(screen.getByText("gxpService")).toBeInTheDocument();
  });

  it("hides System IT Administration from a GXP-only user", () => {
    renderSidebar(userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));

    expect(screen.queryByText("systemITAdministration")).not.toBeInTheDocument();
  });

  it("shows System IT Administration to a user with admin user permissions", () => {
    renderSidebar(userWith("SYS_ADMIN", ADMIN_PERMISSIONS.VIEW_USER));

    expect(screen.getByText("systemITAdministration")).toBeInTheDocument();
    expect(screen.queryByText("gxpService")).not.toBeInTheDocument();
  });

  it("gates Company Setup behind OPERATE:ALL only", () => {
    renderSidebar(userWith("SYS_ADMIN", ADMIN_PERMISSIONS.VIEW_USER));
    expect(screen.queryByText("companySetup")).not.toBeInTheDocument();
  });

  it("shows every menu to an OPERATE:ALL super admin", () => {
    renderSidebar(userWith(ROLES.SUPER_ADMIN, ADMIN_PERMISSIONS.OPERATE_ALL));

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("systemITAdministration")).toBeInTheDocument();
    expect(screen.getByText("gxpService")).toBeInTheDocument();
    expect(screen.getByText("limsLabAccess")).toBeInTheDocument();
    expect(screen.getByText("limsLabSetup")).toBeInTheDocument();
    expect(screen.getByText("companySetup")).toBeInTheDocument();
    expect(screen.getByText("mySpace")).toBeInTheDocument();
  });

  it("hides both LIMS menus from a GXP-only user", () => {
    renderSidebar(userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));

    expect(screen.getByText("gxpService")).toBeInTheDocument();
    expect(screen.queryByText("limsLabAccess")).not.toBeInTheDocument();
    expect(screen.queryByText("limsLabSetup")).not.toBeInTheDocument();
  });

  it("shows only Lab Access for a user with a LIMS admin permission", () => {
    renderSidebar(userWith("LIMS_ADMIN", LIMS_PERMISSIONS.VIEW_USER));

    expect(screen.getByText("limsLabAccess")).toBeInTheDocument();
    expect(screen.queryByText("limsLabSetup")).not.toBeInTheDocument();
    expect(screen.queryByText("gxpService")).not.toBeInTheDocument();
  });

  it("shows only Lab Setup for a user with a master-data permission", () => {
    renderSidebar(userWith("LIMS_ANALYST", LIMS_PERMISSIONS.VIEW_INSTRUMENT));

    expect(screen.getByText("limsLabSetup")).toBeInTheDocument();
    expect(screen.queryByText("limsLabAccess")).not.toBeInTheDocument();
  });

  it("renders no menu groups at all when there is no signed-in user", () => {
    renderSidebar(null);

    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("gxpService")).not.toBeInTheDocument();
    expect(screen.queryByText("systemITAdministration")).not.toBeInTheDocument();
  });
});
