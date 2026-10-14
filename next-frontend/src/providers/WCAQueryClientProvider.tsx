"use client";

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import React from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        refetchOnMount: "always",
        retry: false,
      },
    },
  });
}

// Queries that a server component seeds with `initialData` should opt out of
// the `refetchOnMount: "always"` default by passing `refetchOnMount: true` and
// this staleTime: the server fetched that data for this very render, so
// refetching on mount only duplicates the request. A remount after this window
// still refreshes, which `refetchOnMount: false` would not.
export const SERVER_SEEDED_STALE_TIME = 30 * 1000;

// Lazily initialized: this module is also evaluated on the server during SSR,
// and an eager `const` would construct a throwaway client on every server render.
// The `??=` defers construction until we're actually in the browser.
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // On the server, the module scope is shared across requests, so a
  // module-level client would serve every request stale data from the
  // first render (and leak data between users). Always make a fresh one.
  if (environmentManager.isServer()) return makeQueryClient();

  return (browserQueryClient ??= makeQueryClient());
}

export default function WCAQueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
