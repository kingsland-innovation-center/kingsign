'use client';

import { AuthProvider } from "@/providers/AuthProvider";
import ReactQueryProvider from "@/providers/QueryClientProvider";
import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import { DocumentProvider } from "@/providers/DocumentProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <SessionProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <DocumentProvider>
                <MantineProvider>{children}</MantineProvider>
            </DocumentProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </SessionProvider>
    </ReactQueryProvider>
  );
} 