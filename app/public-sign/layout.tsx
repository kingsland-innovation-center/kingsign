"use client";

import { FieldsProvider } from "@/contexts/FieldsContext";

export default function PublicSignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FieldsProvider>
      {children}
    </FieldsProvider>
  );
} 