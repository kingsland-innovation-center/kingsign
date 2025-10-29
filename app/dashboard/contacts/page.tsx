"use client";

import { ContactsTable } from "@/components/ui/ContactsTable/ContactsTable";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Contacts</h1>
      <ContactsTable />
    </div>
  );
} 