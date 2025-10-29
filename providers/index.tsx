"use client";

import QueryClientProvider from "./QueryClientProvider";
import { AuthProvider } from "./AuthProvider";
import { WorkspaceProvider } from "./WorkspaceProvider";
import { DocumentProvider } from "./DocumentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <DocumentProvider>
            {children}
          </DocumentProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
} 