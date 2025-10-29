"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconFileUpload, IconHelpCircle, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useTemplates } from "@/hooks/useTemplates";

export default function CreateTemplatePage() {
  const router = useRouter();
  const { uploadAndCreateTemplate } = useTemplates();
  const { currentAccount, currentWorkspace } = useWorkspace();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);

      if(!currentWorkspace?._id){
        toast.error("No workspace.");
        return;
      }

      await uploadAndCreateTemplate(selectedFile, {
        name,
        description,
        workspaceId: currentWorkspace?._id,
      });
      console.log(`---${currentAccount?._id}`);
      toast.success("Template created successfully");
      router.push("/dashboard/templates");
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Create Template</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Upload a template file and add details to create a new template.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            File (PDF only)
            <span className="text-red-500">*</span>
            <IconHelpCircle className="w-4 h-4 text-gray-400" />
          </label>

          {selectedFile ? (
            <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <IconFileUpload className="w-5 h-5 text-gray-500" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
              <Button
                type="button"
                onClick={() => setSelectedFile(null)}
                variant="ghost"
              >
                <IconX className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-md p-6">
              <input
                type="file"
                id="file"
                className="hidden"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              <label
                htmlFor="file"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <IconFileUpload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PDF files only
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Template Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            Name
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Enter template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">Description</label>
          <textarea
            className="flex w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm min-h-[100px]"
            placeholder="Enter template description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            className="w-32 bg-[#0A2472] hover:bg-gradient-to-r hover:from-[#0A2472]/90 hover:to-[#4A6FA5]/90"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-32"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
