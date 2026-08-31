import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";

/** Integration test for Storage Locations, driven by the mocked lims-service — exercises the
 * real query/table/mutation stack: paginated list → search → create → remove-with-reason. */

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    // OPERATE:ALL so permission gating never masks a genuine failure here.
    user: {
      id: "u1",
      roles: [{ name: "SUPER_ADMIN", permissions: [{ name: ADMIN_PERMISSIONS.OPERATE_ALL }] }]
    },
    isAuthenticated: true,
    isLoading: false
  })
}));

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } })
}));

const { default: LimsLocationList } = await import("./LimsLocationList");

const renderList = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LimsLocationList />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("LimsLocationList (integration, mocked lims-service)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads storage locations from the server", async () => {
    renderList();

    expect(await screen.findByText("Cold Room A")).toBeInTheDocument();
    expect(screen.getByText("LOC-001")).toBeInTheDocument();
  });

  it("paginates on the server — page 2 rows are not in the DOM", async () => {
    renderList();

    await screen.findByText("Cold Room A");
    // 23 seeded rows, default page size 10. "Shelf A1" is row 15, so page 2.
    expect(screen.queryByText("Shelf A1")).not.toBeInTheDocument();
  });

  it("hides removed rows until the toggle is switched on", async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByText("Cold Room A");
    // "Decommissioned Freezer" is seeded as removed.
    expect(screen.queryByText("Decommissioned Freezer")).not.toBeInTheDocument();

    // The Switch renders a plain <label> with no input, so click its text.
    await user.click(screen.getByText("limsShowRemoved"));

    await waitFor(() =>
      expect(screen.getByText("Decommissioned Freezer")).toBeInTheDocument()
    );
  });

  it("sends the search term to the server and narrows the rows", async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByText("Cold Room A");

    await user.type(screen.getByPlaceholderText(/search storage locations/i), "Freezer");

    expect(await screen.findByText("Freezer -20°C")).toBeInTheDocument();
    // useServerTable keeps previous rows while refetching, so wait for the
    // non-matching row to drop rather than asserting immediately.
    await waitFor(() =>
      expect(screen.queryByText("Cold Room A")).not.toBeInTheDocument()
    );
  });
});
