"use client";

import { FieldsProvider } from "@/contexts/FieldsContext";

export default function TemplatesPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FieldsProvider isTemplate>{children}</FieldsProvider>;
}
