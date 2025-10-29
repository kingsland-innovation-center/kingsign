// /* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/ui/Document/DocumentViewer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagManager } from "@/components/ui/TagManager/TagManager";

import { useFields, Field } from "@/contexts/FieldsContext";
import { useTemplates } from "@/hooks/useTemplates";
import { useDocument } from "@/providers/DocumentProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import {
  FieldType,
  TemplateFieldData,
  TemplateFieldPatch,
} from "@/repositories/TemplateFieldsRepository";
import { DocumentStatus } from "@/repositories/DocumentsRepository";
import {
  templateFieldsRepository,
  TemplateField,
} from "@/repositories/TemplateFieldsRepository";
import { documentFieldsRepository } from "@/repositories/DocumentFieldsRepository";
import {
  IconAbc,
  IconCalendar,
  IconCheckbox,
  IconPlus,
  IconRotate2,
  IconRotateClockwise2,
  IconSignature,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
  IconEdit,
  IconCheck,
  IconX,
  IconFileText,
} from "@tabler/icons-react";
import { appPath } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContent,
  DialogDescription as AlertDialogDescription,
  DialogFooter as AlertDialogFooter,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogClose as AlertDialogClose,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesRepository } from "@/repositories/TemplatesRepository";

// Editable Field Name Component
function EditableFieldName({ 
  initialName, 
  onSave, 
  className = "" 
}: { 
  initialName: string; 
  onSave: (newName: string) => void; 
  className?: string; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [tempName, setTempName] = useState(initialName);

  // Update local state when initialName changes
  React.useEffect(() => {
    setName(initialName);
    setTempName(initialName);
  }, [initialName]);

  const handleSave = () => {
    if (tempName.trim() && tempName !== name) {
      setName(tempName.trim());
      onSave(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 text-sm px-1"
          autoFocus
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleSave}
        >
          <IconCheck size={12} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCancel}
        >
          <IconX size={12} />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm">{name}</span>
      <IconEdit size={12} className="opacity-50" />
    </div>
  );
}

export default function EditTemplatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditTemplatePageContent />
    </Suspense>
  );
}

function EditTemplatePageContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    file,
    template,
    createField,
    updateField,
    removeField: deleteField,
    templateFields,
    isTemplateFieldsLoading,
  } = useTemplates(templateId || undefined);
  const isTemplate = true; // This page is always a template

  const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const { createDocumentFromTemplate } = useDocument();
  const { currentAccount } = useWorkspace();

  const {
    setCurrentPdfFile,
    addSignatureToPage,
    currentPage,
    addTextFieldToPage,
    addCheckboxToPage,
    addDateFieldToPage,
    fields,
    getFieldsForPage,
    removeField,
    setIsLoading,
    zoomIn,
    zoomOut,
    updateFieldName,
  } = useFields();

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!templateId) throw new Error("No template ID provided");
      await templatesRepository.remove(templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted successfully");
      router.push(appPath.dashboard.templates);
    },
    onError: (error) => {
      toast.error("Failed to delete template");
      console.error("Delete template error:", error);
    },
  });

  // Tag management handlers
  const handleTagsChange = async (tagIds: string[]) => {
    if (!templateId) return;
    
    try {
      await templatesRepository.patch(templateId, {
        tagIds: tagIds
      });
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
      toast.success("Tags updated successfully");
    } catch (error) {
      console.error("Failed to update tags:", error);
      toast.error("Failed to update tags. Please try again.");
    }
  };

  useEffect(() => {
    if (file) {
      setCurrentPdfFile(file.fileUrl);
    }
  }, [file, setCurrentPdfFile]);

  useEffect(() => {
    if (isTemplateFieldsLoading) {
      setIsLoading(isTemplateFieldsLoading);
    }
  }, [setIsLoading, isTemplateFieldsLoading]);

  // Load existing template fields into the document fields context
  useEffect(() => {
    if (templateFields && templateFields.length > 0) {
      // Clear existing fields first
      fields.forEach((field) => {
        if (field._id) {
          removeField(field._id);
        }
      });

      // Add template fields
      templateFields.forEach((field) => {
        const fieldData = {
          _id: field._id,
          temporary_id: field._id || "",
          page: 1,
          xPosition: field.xPosition,
          yPosition: field.yPosition,
          width: field.width,
          height: field.height,
          fieldType: field.fieldType,
          fieldName: field.fieldName,
          placeholder: field.placeholder,
          required: field.required,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        switch (field.fieldType) {
          case "signature":
            addSignatureToPage({
              page:
                typeof field.metadata?.page === "number"
                  ? field.metadata?.page
                  : 1,
              signature: null,
              isTemplateOverride: true,
              templateFieldId: field._id,
              fieldData,
            });
            break;
          case "text":
            addTextFieldToPage({
              page:
                typeof field.metadata?.page === "number"
                  ? field.metadata?.page
                  : 1,
              defaultText: null,
              isTemplateOverride: true,
              templateFieldId: field._id,
              fieldData,
            });
            break;
          case "checkbox":
            addCheckboxToPage({
              page:
                typeof field.metadata?.page === "number"
                  ? field.metadata?.page
                  : 1,
              isChecked: false,
              isTemplateOverride: true,
              templateFieldId: field._id,
              fieldData,
            });
            break;
          case "date":
            addDateFieldToPage({
              page:
                typeof field.metadata?.page === "number"
                  ? field.metadata?.page
                  : 1,
              isTemplateOverride: true,
              templateFieldId: field._id,
              fieldData,
            });
            break;
        }
      });
    }
  }, [templateFields]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleAddSignature = () => {
    addSignatureToPage({
      page: currentPage,
      signature: null,
      isTemplateOverride: isTemplate,
    });
  };

  const handleAddTextField = () => {
    addTextFieldToPage({
      page: currentPage,
      defaultText: null,
      isTemplateOverride: isTemplate,
    });
  };

  const handleAddCheckbox = () => {
    addCheckboxToPage({
      page: currentPage,
      isChecked: false,
      isTemplateOverride: isTemplate,
    });
  };

  const handleAddDateField = () => {
    addDateFieldToPage({
      page: currentPage,
      isTemplateOverride: isTemplate,
    });
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateId) return;
      let toBeDeleted = templateFields;
      // Get all fields for all pages
      const allFields = fields;
      // Process each field
      for (const field of allFields) {
        if (field._id) {
          const fieldData = {
            templateId: templateId,
            fieldType: field.fieldType as FieldType,
            fieldName: field.fieldName,
            placeholder: field.placeholder || "placeholder",
            xPosition: field.xPosition,
            yPosition: field.yPosition,
            width: field.width,
            height: field.height,
            required: field.required || false,
            metadata: {
              page: field.page,
              fontSize: field.fontSize,
              isBold: field.isBold,
              isItalic: field.isItalic,
              checkboxSize: field.checkboxSize,
            },
          } as TemplateFieldPatch;
          await updateField(field._id, fieldData);
          toBeDeleted = toBeDeleted.filter((tf) => tf._id !== field._id);
        } else {
          // Create new field
          const fieldData = {
            templateId: templateId,
            fieldType: field.fieldType as FieldType,
            fieldName: field.fieldName,
            placeholder: field.placeholder || "placeholder",
            xPosition: field.xPosition,
            yPosition: field.yPosition,
            width: field.width,
            height: field.height,
            required: field.required || false,
            metadata: {
              page: field.page,
              isBold: field.isBold,
              isItalic: field.isItalic,
              checkboxSize: field.checkboxSize,
            },
          } as TemplateFieldData;
          await createField(fieldData);
        }
      }
      for (const field of toBeDeleted) {
        await deleteField(field._id);
      }
      toast.success("Template saved successfully");
    } catch (error) {
      console.error("Error saving template fields:", error);
      toast.error("Failed to save template fields. Please try again.");
    }
  };

  const handleDeleteTemplate = () => {
    deleteTemplateMutation.mutate();
  };

  const handleCreateDocument = async () => {
    if (!templateId || !template) {
      toast.error("Template not found");
      return;
    }

    if (!documentTitle.trim() || !documentDescription.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreatingDocument(true);
      
      // Create document from template
      const document = await createDocumentFromTemplate({
        title: documentTitle.trim(),
        note: documentDescription.trim(),
        status: DocumentStatus.PENDING,
        creatorAccountId: String(currentAccount?._id || ""),
        templateId: template._id,
        fileId: template.fileId,
      });

      // Create document fields based on template fields
      const templateFields = await templateFieldsRepository.find({
        query: {
          templateId: template._id,
        },
      });

      // Create document fields for each template field
      const createFieldPromises = templateFields.data.map(
        (templateField: TemplateField) =>
          documentFieldsRepository.create({
            documentId: document._id,
            fieldId: templateField._id,
            value: null, // Initialize with null value
            fileId: template.fileId,
          })
      );

      await Promise.all(createFieldPromises);

      toast.success("Document created successfully");
      setIsCreateDocumentModalOpen(false);
      setDocumentTitle("");
      setDocumentDescription("");
    } catch (error) {
      toast.error("Failed to create document");
      console.error("Error creating document:", error);
    } finally {
      setIsCreatingDocument(false);
    }
  };



  return (
    <div className="h-full flex">
      {/* Left Toolbar */}
      <div className="w-16 border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        <Button variant="ghost" size="icon" onClick={zoomIn}>
          <IconZoomIn className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={zoomOut}>
          <IconZoomOut className="h-5 w-5" />
        </Button>
        <div className="h-px w-8 bg-gray-200 my-2" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <IconTrash className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Warning: This action will permanently delete this template. This action cannot be undone. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </AlertDialogClose>
              <Button
                onClick={handleDeleteTemplate}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete Template
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Document Viewer */}
        <div
          className="flex-1 bg-gray-50 overflow-auto relative"
          ref={containerRef}
        >
          <DocumentViewer
            onFinish={handleSaveTemplate}
            isTemplate={isTemplate}
          />
        </div>

        {/* Right Fields Panel */}
        <div className="w-72 border-l border-gray-200 p-4">
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Tags Section */}
              <div className="mb-6">
                <TagManager
                  selectedTagIds={template?.tagIds || []}
                  onTagsChange={handleTagsChange}
                  disabled={false}
                  title="Template Tags"
                />
              </div>

              {/* Create Document Button */}
              <div className="mb-6">
                <Button
                  onClick={() => setIsCreateDocumentModalOpen(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <IconFileText size={18} className="stroke-2" />
                  <span>Create Document</span>
                </Button>
              </div>

              <h2 className="font-medium mb-4">Fields</h2>

              {/* Available Fields */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover:border-blue-500 group"
                  onClick={handleAddSignature}
                >
                  <IconSignature className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span>Signature</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover:border-blue-500 group"
                  onClick={() => {
                    handleAddTextField();
                  }}
                >
                  <IconAbc className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span>Text</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover:border-blue-500 group"
                  onClick={handleAddDateField}
                >
                  <IconCalendar className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span>Date</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 hover:border-blue-500 group"
                  onClick={handleAddCheckbox}
                >
                  <IconCheckbox className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                  <span>Checkbox</span>
                </Button>
              </div>

              <h3 className="text-sm font-medium mb-2">
                Fields on Page {currentPage}
              </h3>
              <div className="space-y-2 mb-6">
                {getFieldsForPage(currentPage).map((field) => (
                  <div
                    key={field._id ?? field.temporary_id}
                    className="flex items-center justify-between border border-gray-200 rounded-md p-2"
                  >
                    <div className="text-sm flex-1 min-w-0">
                      <EditableFieldName
                        initialName={field.fieldName}
                        onSave={(newName) => {
                          updateFieldName(field._id ?? field.temporary_id, newName);
                        }}
                        className="mb-1"
                      />
                      {field.fieldType === "text" && (
                        <p className="text-xs text-gray-500 truncate">
                          {field.value || "No text entered"}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        x: {Math.round(field.xPosition)}, y:{" "}
                        {Math.round(field.yPosition)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(field._id ?? field.temporary_id);
                      }}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                ))}

                {getFieldsForPage(currentPage).length === 0 && (
                  <p className="text-xs text-gray-500">
                    No fields on this page. Add a field using the options above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Document Modal */}
      <AlertDialog open={isCreateDocumentModalOpen} onOpenChange={setIsCreateDocumentModalOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Document from Template</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new document using this template. Fill in the document details below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                Document Title
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter document title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                Description
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Enter document description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogClose asChild>
              <Button variant="outline" disabled={isCreatingDocument}>
                Cancel
              </Button>
            </AlertDialogClose>
            <Button
              onClick={handleCreateDocument}
              disabled={isCreatingDocument || !documentTitle.trim() || !documentDescription.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCreatingDocument ? "Creating..." : "Create Document"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
