import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client for all server state.
 *
 * Client state (auth, theme, sidebar) stays in Redux/Context — see STANDARDS.md §4.
 * The axios instance + interceptors are unchanged; query fns wrap them and pass
 * React Query's `signal` through to axios for automatic request cancellation.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — lists/options are fresh briefly, then revalidate
      gcTime: 5 * 60_000, // 5m — keep unused caches around for quick revisits
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});
