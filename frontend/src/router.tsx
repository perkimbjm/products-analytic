import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { CACHE_CONFIG } from "./lib/cache-config";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Bound retries so an unreachable backend surfaces the offline UI quickly
        // instead of spinning through the default 3 back-off retries.
        retry: 1,
        retryDelay: 800,
        refetchOnWindowFocus: false,
        // Aggregates only change on re-import; don't refetch on network reconnect
        // either, so transient drops don't trigger a wave of background fetches.
        refetchOnReconnect: false,
        // Cache configuration from environment variables for faster data reuse.
        staleTime: CACHE_CONFIG.staleTime, // Keep data fresh for 5 min before background refetch
        gcTime: CACHE_CONFIG.gcTime, // Keep unused data in memory for 10 min
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
