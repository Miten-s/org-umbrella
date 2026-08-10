import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AsyncSelect } from "./AsyncSelect";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { OptionsPage } from "@/lib/query/listTypes";

/** Component-shell smoke test: mounts, opens on click, wires search to the hook. */

const fetchPage = vi.fn(
  async (): Promise<OptionsPage> => ({
    options: [
      { value: "1", label: "Alpha" },
      { value: "2", label: "Beta" }
    ],
    nextPage: null
  })
);

const useTestOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({ queryKey: ["test-async"], fetchPage, ...args });

const wrap = (node: ReactNode) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>);
};

describe("AsyncSelect", () => {
  it("shows placeholder and opens a searchable menu on click", async () => {
    wrap(
      <AsyncSelect
        useOptions={useTestOptions}
        value=""
        onChange={() => {}}
        placeholder="Select designation"
      />
    );

    // trigger shows placeholder; menu (and its search box) is closed initially
    expect(screen.getByText("Select designation")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    // opening mounts the portal menu with a search input and triggers a fetch
    expect(await screen.findByPlaceholderText("Search…")).toBeInTheDocument();
    await waitFor(() => expect(fetchPage).toHaveBeenCalled());
  });

  it("shows the seeded label for a deep selected value WITHOUT loading its page (edit case)", () => {
    // simulates editing a user whose designation sits far past page 1: the label
    // comes from the record (initialSelectedOptions), never from a fetch.
    const neverCalled = vi.fn();
    const useNeverFetched = (args: {
      search: string;
      enabled?: boolean;
      selectedValues?: string[];
    }) => useAsyncOptions({ queryKey: ["seed"], fetchPage: neverCalled, ...args });

    wrap(
      <AsyncSelect
        useOptions={useNeverFetched}
        value="id-4999"
        onChange={() => {}}
        placeholder="Select designation"
        initialSelectedOptions={[{ value: "id-4999", label: "Senior Engineer" }]}
      />
    );

    // trigger shows the seeded label (not the placeholder, not the raw id)
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Select designation")).not.toBeInTheDocument();
    // closed dropdown must not have fetched anything (enabled:open)
    expect(neverCalled).not.toHaveBeenCalled();
  });
});
