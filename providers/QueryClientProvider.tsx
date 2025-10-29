// src/ReactQueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";

interface ReactQueryProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient(
//   {
//   defaultOptions: {
//     queries: {
//       staleTime: 0, // Data is considered stale immediately
//       cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
//       refetchOnMount: true, // Refetch on component mount
//       refetchOnWindowFocus: true, // Refetch when window regains focus
//       refetchOnReconnect: true, // Refetch on network reconnection
//       retry: 1, // Retry failed requests once
//     },
//   },
// }
);

export default function ReactQueryProvider({
  children,
}: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
