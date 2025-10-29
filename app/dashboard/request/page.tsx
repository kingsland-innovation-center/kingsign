"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDocument } from "@/providers/DocumentProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconFileUpload,
  IconHelpCircle,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { DocumentStatus } from "@/repositories/DocumentsRepository";
import { appPath } from "@/lib/utils";

export default function RequestPage() {
  const router = useRouter();
  const { uploadAndCreateDocument } = useDocument();
  const { currentAccount, getAccountsWithUsers } = useWorkspace();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedSigner, setSelectedSigner] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const availableSigners = getAccountsWithUsers().filter(
    (account) => account._id !== currentAccount?._id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !note || !selectedSigner) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      await uploadAndCreateDocument(selectedFile, {
        title,
        note,
        status: DocumentStatus.PENDING,
        assignedAccountId: selectedSigner,
        templateId: undefined,
      });
      toast.success("Document request created successfully");
      router.push(appPath.dashboard.documents.root);
    } catch (error) {
      toast.error("Failed to create document request");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Request signatures</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Use this form to request signatures from others and yourself together.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            File (pdf, png, jpg, jpeg, docx)
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
                accept=".pdf,.png,.jpg,.jpeg,.docx"
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
                  PDF, PNG, JPG, JPEG or DOCX
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Document Title */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            Document title
            <span className="text-red-500">*</span>
          </label>
          <Input 
            type="text" 
            placeholder="Enter document title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>

        {/* Signers */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            Signers
            <span className="text-red-500">*</span>
            <IconHelpCircle className="w-4 h-4 text-gray-400" />
          </label>
          <div className="flex items-center gap-2">
            <select
              className={`flex h-9 w-full text-sm rounded-md border border-gray-200 bg-transparent px-3 py-1 shadow-sm ${
                !selectedSigner ? "text-gray-400" : ""
              }`}
              onChange={(e) => setSelectedSigner(e.target.value)}
              value={selectedSigner}
              required
            >
              <option value="">Select a signer...</option>
              {availableSigners.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.user?.name || account.user?.email || "Unknown User"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            Note
            <span className="text-red-500">*</span>
          </label>
          <textarea
            className="flex w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm min-h-[100px]"
            placeholder="Please review and sign this document"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            className="w-32 bg-[#0A2472] hover:bg-gradient-to-r hover:from-[#0A2472]/90 hover:to-[#4A6FA5]/90"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Submit"}
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
