import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedUser } from "@/types/common.types";
import { ADMIN_PERMISSIONS, GXP_PERMISSIONS, ROLES } from "@/utils/permissions";

const mockAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuth()
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { default: Button } = await import("./Button");

const userWith = (roleName: string, ...permissions: string[]): AuthenticatedUser => ({
  id: "user-1",
  roles: [{ name: roleName, permissions: permissions.map((name) => ({ name })) }]
});

const signedInAs = (user: AuthenticatedUser) =>
  mockAuth.mockReturnValue({ user, isAuthenticated: true, isLoading: false });

describe("Button — permission gating", () => {
  beforeEach(() => mockAuth.mockReset());

  it("stays enabled when the user holds the required permission", () => {
    signedInAs(userWith("GXP_ADMIN", GXP_PERMISSIONS.DELETE_SERVICE_REQUEST));

    render(<Button permission={GXP_PERMISSIONS.DELETE_SERVICE_REQUEST}>Delete</Button>);

    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("disables — rather than hides — the action when the permission is missing", () => {
    signedInAs(userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));

    render(<Button permission={GXP_PERMISSIONS.DELETE_SERVICE_REQUEST}>Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });
    // The control is still discoverable, but inert.
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("swallows clicks on a permission-disabled action", () => {
    signedInAs(userWith("GXP_VIEWER", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));
    const onClick = vi.fn();

    render(
      <Button permission={GXP_PERMISSIONS.DELETE_SERVICE_REQUEST} onClick={onClick}>
        Delete
      </Button>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires the handler when the permission is held", () => {
    signedInAs(userWith("GXP_ADMIN", GXP_PERMISSIONS.DELETE_SERVICE_REQUEST));
    const onClick = vi.fn();

    render(
      <Button permission={GXP_PERMISSIONS.DELETE_SERVICE_REQUEST} onClick={onClick}>
        Delete
      </Button>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("lets an OPERATE:ALL super admin through", () => {
    signedInAs(userWith(ROLES.SUPER_ADMIN, ADMIN_PERMISSIONS.OPERATE_ALL));

    render(<Button permission={GXP_PERMISSIONS.DELETE_SERVICE_REQUEST}>Delete</Button>);

    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("requires every permission under the default 'all' logic", () => {
    signedInAs(userWith("GXP_PARTIAL", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));

    render(
      <Button
        permission={[
          GXP_PERMISSIONS.VIEW_SERVICE_REQUEST,
          GXP_PERMISSIONS.DELETE_SERVICE_REQUEST
        ]}
      >
        Delete
      </Button>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("accepts a single match under 'any' logic", () => {
    signedInAs(userWith("GXP_PARTIAL", GXP_PERMISSIONS.VIEW_SERVICE_REQUEST));

    render(
      <Button
        permissionLogic="any"
        permission={[
          GXP_PERMISSIONS.VIEW_SERVICE_REQUEST,
          GXP_PERMISSIONS.DELETE_SERVICE_REQUEST
        ]}
      >
        Delete
      </Button>
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("is unrestricted when no permission is declared", () => {
    signedInAs(userWith("PLAIN_USER"));

    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
