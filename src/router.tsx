import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // In-app wallet browsers (Phantom, Solflare) fire focus/visibility
        // events every time the wallet sheet opens and closes. Refetching on
        // those events is what made the site look like it was reloading.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Warm the next route on hover/touch-intent so navigation feels instant.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    // Loader data stays fresh for a minute, so going back to a visited route
    // paints from cache instead of re-running the loader.
    defaultStaleTime: 60_000,
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
