import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";

/** Integration test for Lab Groups against the mocked lims-service. */

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
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

const { default: LimsGroupList } = await import("./LimsGroupList");

const renderList = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LimsGroupList />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("LimsGroupList (integration, mocked lims-service)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads lab groups from the server", async () => {
    renderList();

    // Group IDs are unique; the name "QC Lab" also appears as other rows' parent.
    expect(await screen.findByText("LIMS_QC")).toBeInTheDocument();
    expect(screen.getByText("LIMS_MB")).toBeInTheDocument();
  });

  it("renders nested relations as labels, not raw ids", async () => {
    renderList();

    await screen.findByText("LIMS_QC");
    // ownedBy / parentGroup arrive as { id, name } and must show the name.
    expect(screen.getByText("A. Shah")).toBeInTheDocument();
    // "QC Lab" appears once as its own row and again as three rows' parent.
    expect(screen.getAllByText("QC Lab").length).toBeGreaterThan(1);
  });

  it("narrows the list via server-side search", async () => {
    const user = userEvent.setup();
    renderList();

    await screen.findByText("LIMS_QC");

    await user.type(screen.getByPlaceholderText(/search lab groups/i), "Micro");

    expect(await screen.findByText("LIMS_MB")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("LIMS_RD")).not.toBeInTheDocument());
  });
});
