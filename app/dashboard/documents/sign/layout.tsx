"use client";

import React from "react";

import { FieldsProvider } from "@/contexts/FieldsContext";

export default function SignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FieldsProvider>
      <div className="h-screen flex flex-col">{children}</div>
    </FieldsProvider>
  );
}
