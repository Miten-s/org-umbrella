import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useAsyncOptions } from "./useAsyncOptions";
import type { OptionsPage } from "@/lib/query/listTypes";

/**
 * Runtime smoke test for the highest-risk primitive (STANDARDS.md §5).
 * Drives useAsyncOptions against a throwaway in-memory endpoint of 5,000 rows,
 * covering: enabled:open gating, debounce→query-key, infinite scroll paging,
 * and resolve-selected-by-id (single AND multi).
 */

const PAGE_SIZE = 20;
const ALL = Array.from({ length: 5000 }, (_, i) => ({
  id: `id-${i}`,
  name: `Option ${i}`
}));

const makeFetchPage = () =>
  vi.fn(
    async ({ search, page }: { search: string; page: number }): Promise<OptionsPage> => {
      const filtered = ALL.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
      );
      const start = (page - 1) * PAGE_SIZE;
      const slice = filtered.slice(start, start + PAGE_SIZE);
      return {
        options: slice.map((o) => ({ value: o.id, label: o.name })),
        nextPage: start + PAGE_SIZE < filtered.length ? page + 1 : null
      };
    }
  );

const makeResolveByIds = () =>
  vi.fn(async (ids: string[]) =>
    ids.map((id) => ({ value: id, label: `Resolved ${id}` }))
  );

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAsyncOptions", () => {
  it("does not fetch until enabled (dropdown open)", async () => {
    const fetchPage = makeFetchPage();
    renderHook(
      () =>
        useAsyncOptions({
          queryKey: ["t"],
          fetchPage,
          search: "",
          enabled: false
        }),
      { wrapper: createWrapper() }
    );

    // give React Query a tick; it must NOT fetch while disabled
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("loads the first page when opened", async () => {
    const fetchPage = makeFetchPage();
    const { result } = renderHook(
      () => useAsyncOptions({ queryKey: ["t"], fetchPage, search: "", enabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.options).toHaveLength(PAGE_SIZE));
    expect(result.current.hasNextPage).toBe(true);
    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: "" }),
      expect.anything()
    );
  });

  it("appends pages via infinite scroll (fetchNextPage)", async () => {
    const fetchPage = makeFetchPage();
    const { result } = renderHook(
      () => useAsyncOptions({ queryKey: ["t"], fetchPage, search: "", enabled: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.options).toHaveLength(PAGE_SIZE));
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.options).toHaveLength(PAGE_SIZE * 2));
  });

  it("debounces search into the query key and filters server-side", async () => {
    const fetchPage = makeFetchPage();
    const { result, rerender } = renderHook(
      ({ search }: { search: string }) =>
        useAsyncOptions({
          queryKey: ["t"],
          fetchPage,
          search,
          enabled: true,
          debounceMs: 50
        }),
      { wrapper: createWrapper(), initialProps: { search: "" } }
    );

    await waitFor(() => expect(result.current.options.length).toBeGreaterThan(0));

    // rapid typing — only the settled value should drive a fetch
    rerender({ search: "Option 123" });
    rerender({ search: "Option 1234" });

    await waitFor(() =>
      expect(
        result.current.options.every((o) => o.label.includes("Option 1234"))
      ).toBe(true)
    );
    // the debounced term "Option 1234" was used; intermediate "Option 123" never settled
    const searchedTerms = fetchPage.mock.calls.map((c) => c[0].search);
    expect(searchedTerms).toContain("Option 1234");
    expect(searchedTerms).not.toContain("Option 123");
  });

  it("resolves a single selected value by id when it isn't on the loaded page", async () => {
    const fetchPage = makeFetchPage();
    const resolveByIds = makeResolveByIds();
    const { result } = renderHook(
      () =>
        useAsyncOptions({
          queryKey: ["t"],
          fetchPage,
          resolveByIds,
          selectedValues: ["id-4999"], // far past page 1
          search: "",
          enabled: true
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(result.current.resolvedSelected).toEqual([
        { value: "id-4999", label: "Resolved id-4999" }
      ])
    );
    expect(resolveByIds).toHaveBeenCalledWith(["id-4999"], expect.anything());
  });

  it("resolves MULTIPLE selected ids and skips ones already loaded", async () => {
    const fetchPage = makeFetchPage();
    const resolveByIds = makeResolveByIds();
    const { result } = renderHook(
      () =>
        useAsyncOptions({
          queryKey: ["t"],
          fetchPage,
          resolveByIds,
          // id-0 is on page 1 (loaded); the other two are not → only those two resolve
          selectedValues: ["id-0", "id-4000", "id-4999"],
          search: "",
          enabled: true
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.options).toHaveLength(PAGE_SIZE));
    await waitFor(() => expect(result.current.resolvedSelected).toHaveLength(2));

    const resolvedValues = result.current.resolvedSelected.map((o) => o.value).sort();
    expect(resolvedValues).toEqual(["id-4000", "id-4999"]);
    // id-0 (already loaded) must NOT be sent to resolveByIds
    expect(resolveByIds).toHaveBeenCalledWith(
      ["id-4000", "id-4999"],
      expect.anything()
    );
  });
});
