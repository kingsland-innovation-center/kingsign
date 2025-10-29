"use client";

import { TemplateTable } from "@/components/ui/TemplateTable/TemplateTable";
import { useFields } from "@/contexts/FieldsContext";
import { useEffect } from "react";
export default function TemplatesPage() {
  const { resetFields } = useFields();
  useEffect(() => {
    resetFields();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Templates</h1>
      <TemplateTable />
    </div>
  );
}
