"use client";

import { DocumentTable } from "@/components/ui/DocumentTable/DocumentTable";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <DocumentTable />
    </div>
  );
}
