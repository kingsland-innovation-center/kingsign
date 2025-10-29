"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { downloadSignedPDF } from "@/utils/pdf-download";

import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/ui/Document/DocumentViewer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SignatureCanvas from "@/components/ui/SignatureCanvas";
import TextFieldCanvas from "@/components/ui/TextFieldCanvas";
import { ContactAssignment } from "@/components/ui/ContactAssignment";
import { TagManager } from "@/components/ui/TagManager/TagManager";
import { useFields, Field } from "@/contexts/FieldsContext";
import { useDocuments } from "@/hooks/useDocuments";
import { useContacts } from "@/hooks/useContacts";
import { Contact } from "@/repositories/ContactsRepository";
import { SignatureFootprint } from "@/repositories/SignatureFootprintRepository";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useDocumentEmails } from "@/hooks/useDocumentEmails";
import {
  IconPlus,
  IconRotate2,
  IconRotateClockwise2,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
  IconLink,
  IconMail,
} from "@tabler/icons-react";
import { useTemplates } from "@/hooks/useTemplates";
import client from "@/services/FeathersClient";
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
import { useSession } from "next-auth/react";
import { SendDocumentEmailModal } from "./components/SendDocumentEmailModal";

export default function SignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignPageContent />
    </Suspense>
  );
}

function SignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");
  const { getAccountsWithUsers, currentWorkspace } = useWorkspace();

  const {
    document,
    file,
    updateDocument,
    documentFields,
    updateDocumentField,
    signatureFootprintData,
    contacts: documentContacts,
  } = useDocuments(documentId || undefined);

  const { contacts, isLoading: isContactsLoading } = useContacts();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );

  const [includeCertificate, setIncludeCertificate] = useState<boolean>(false);

  const accounts = getAccountsWithUsers();

  const { templateFields, isTemplateFieldsLoading } = useTemplates(
    document?.templateId || undefined
  );

  const {
    currentPdfFile,
    setCurrentPdfFile,
    setCurrentDrawingSignature,
    addSignatureToPage,
    currentPage,
    addTextFieldToPage,
    addCheckboxToPage,
    addDateFieldToPage,
    fields,
    getFieldsForPage,
    updateTextField,
    updateFieldSignature,
    removeField,
    zoomIn,
    zoomOut,
  } = useFields();

  const {
    currentPdfFile: currentPdfFileContext,
    setCurrentPdfFile: setCurrentPdfFileContext,
    setCurrentDrawingSignature: setCurrentDrawingSignatureContext,
    addSignatureToPage: addSignatureToPageContext,
    currentPage: currentPageContext,
    addTextFieldToPage: addTextFieldToPageContext,
    addCheckboxToPage: addCheckboxToPageContext,
    addDateFieldToPage: addDateFieldToPageContext,
    fields: fieldsContext,
    getFieldsForPage: getFieldsForPageContext,
    updateTextField: updateTextFieldContext,
    updateFieldSignature: updateFieldSignatureContext,
    removeField: removeFieldContext,
    zoomIn: zoomInContext,
    zoomOut:     zoomOutContext,
  } = useFields();

  // Set initial selected account from document
  useEffect(() => {
    if (document?.assignedAccountId) {
      setSelectedAccountId(document.assignedAccountId);
    }
  }, [document]);

  // Update document when account is selected
  useEffect(() => {
    if (selectedAccountId !== null) {
      updateDocument.mutate(
        {
          assignedAccountId: selectedAccountId,
        },
        {
          onError: (error) => {
            console.error("Failed to update document:", error);
            toast.error("Failed to update document. Please try again.");
          },
        }
      );
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (templateFields && templateFields.length > 0 && documentFields) {
      console.log("templateFields", templateFields);
      console.log("documentFields", documentFields);
      // Clear existing fields first
      fieldsContext.forEach((field) => {
        if (field._id) {
          removeFieldContext(field._id);
        }
      });

      // Add template fields with document field values
      templateFields.forEach((templateField) => {
        // Find corresponding document field
        const documentField = documentFields.find(
          (df) => df.fieldId === templateField._id
        );

        const fieldData = {
          _id: templateField._id,
          temporary_id: templateField._id || "",
          page: 1,
          xPosition: templateField.xPosition,
          yPosition: templateField.yPosition,
          width: templateField.width,
          height: templateField.height,
          fieldType: templateField.fieldType,
          fieldName: templateField.fieldName,
          placeholder: templateField.placeholder,
          required: templateField.required,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          value: documentField?.value || null,
        };

        switch (templateField.fieldType) {
          case "signature":
            addSignatureToPageContext({
              page:
                typeof templateField.metadata?.page === "number"
                  ? templateField.metadata?.page
                  : 1,
              signature: (documentField?.value as string) || null,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
          case "text":
            addTextFieldToPageContext({
              page:
                typeof templateField.metadata?.page === "number"
                  ? templateField.metadata?.page
                  : 1,
              defaultText: (documentField?.value as string) || null,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
          case "checkbox":
            addCheckboxToPageContext({
              page:
                typeof templateField.metadata?.page === "number"
                  ? templateField.metadata?.page
                  : 1,
              isChecked: (documentField?.value as boolean) || false,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
          case "date":
            addDateFieldToPageContext({
              page:
                typeof templateField.metadata?.page === "number"
                  ? templateField.metadata?.page
                  : 1,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
        }
      });
    }
  }, [templateFields, documentFields]);

  useEffect(() => {
    if (file) {
      setCurrentPdfFile(file.fileUrl);
    }
  }, [file, setCurrentPdfFile]);

  const [isSignatureCanvasOpen, setIsSignatureCanvasOpen] = useState(false);
  const [isTextFieldCanvasOpen, setIsTextFieldCanvasOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<string | null>(
    null
  );
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Document editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingNote, setEditingNote] = useState('');
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);

  // Tag management handlers
  const handleTagsChange = async (tagIds: string[]) => {
    try {
      await updateDocument.mutateAsync({
        tagIds: tagIds
      });
      toast.success("Tags updated successfully");
    } catch (error) {
      console.error("Failed to update tags:", error);
      toast.error("Failed to update tags. Please try again.");
    }
  };

  const handleStartEditingTitle = () => {
    setEditingTitle(document?.title || '');
    setIsEditingTitle(true);
  };

  const handleStartEditingNote = () => {
    setEditingNote(document?.note || '');
    setIsEditingNote(true);
  };

  const handleSaveTitle = async () => {
    try {
      await updateDocument.mutateAsync({
        title: editingTitle,
      });
      setIsEditingTitle(false);
      toast.success("Document title updated successfully");
    } catch (error) {
      console.error("Failed to update document title:", error);
      toast.error("Failed to update document title");
    }
  };

  const handleSaveNote = async () => {
    try {
      await updateDocument.mutateAsync({
        note: editingNote,
      });
      setIsEditingNote(false);
      toast.success("Document description updated successfully");
    } catch (error) {
      console.error("Failed to update document description:", error);
      toast.error("Failed to update document description");
    }
  };

  const handleCancelEditingTitle = () => {
    setEditingTitle('');
    setIsEditingTitle(false);
  };

  const handleCancelEditingNote = () => {
    setEditingNote('');
    setIsEditingNote(false);
  };

  const handleSaveSignature = async (signatureData: string) => {
    console.log("handleSaveSignature called");
    // Make sure the signature data is in PNG format for best compatibility with pdf-lib
    let processedSignature = signatureData;
    if (!signatureData.startsWith("data:image/")) {
      // If for some reason it's not properly formatted, try to create a proper data URL
      console.warn("Signature data format issue, trying to fix...");
      processedSignature = `data:image/png;base64,${signatureData.replace(
        /^data:.*,/,
        ""
      )}`;
    }

    setCurrentDrawingSignature(processedSignature);
    setIsSignatureCanvasOpen(false);

    // Always add the signature to the current page after creation
    updateFieldSignature(currentEditingField!, processedSignature);
  };

  const handleSaveTextField = (text: string) => {
    // If editing an existing field
    if (currentEditingField) {
      updateTextField(currentEditingField, text);
      setCurrentEditingField(null);
    } else {
      // Adding a new text field
      addTextFieldToPageContext({
        page: currentPage,
        defaultText: text,
      });
    }

    // Close the text field canvas
    setIsTextFieldCanvasOpen(false);
  };

  const editTextField = useCallback(
    (fieldId: string) => {
      const field = fieldsContext.find((f: Field) => f._id === fieldId);
      if (
        field &&
        (field.fieldType === "text" || field.fieldType === "date")
      ) {
        setCurrentEditingField(fieldId);
        setIsTextFieldCanvasOpen(true);
      }
    },
    [fieldsContext, setCurrentEditingField, setIsTextFieldCanvasOpen]
  );

  const editSignature = useCallback(
    (fieldId: string) => {
      const field = fieldsContext.find((f: Field) => f._id === fieldId);
      if (field && field.fieldType === "signature") {
        setCurrentEditingField(fieldId);
        setCurrentDrawingSignature(field.value as string);
        setIsSignatureCanvasOpen(true);
      }
    },
    [fieldsContext, setCurrentDrawingSignature, setIsSignatureCanvasOpen]
  );

  const handleSaveDocument = async () => {
    try {
      // Update each field's value in document fields
      const updatePromises = fieldsContext.map(async (field) => {
        const documentField = documentFields.find(
          (df) => df.fieldId === field._id
        );
        if (documentField) {
          return updateDocumentField.mutateAsync({
            id: documentField._id,
            data: {
              value: field.value,
            },
          });
        }
      });

      await Promise.all(updatePromises.filter(Boolean));
      toast.success("Document saved successfully");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    }
  };

  const handleDownload = async () => {
    try {
      await downloadSignedPDF({
        currentPdfFile,
        fields: fieldsContext,
        documentFields,
        containerRef,
        documentTitle: document?.title || "signed_document",
        onError: (error) => {
          toast.error(`Failed to download PDF: ${error}`);
        },
        onSuccess: () => {
          toast.success("PDF downloaded successfully!");
        },
        contacts: documentContacts,
        signatureFootprints: signatureFootprintData,
        includeCertificate,
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  // Listen for editTextField event
  useEffect(() => {
    const handleEditTextFieldEvent = (event: CustomEvent) => {
      const { id } = event.detail;
      const field = fieldsContext.find((f: Field) => f._id === id);
      if (
        field &&
        (field.fieldType === "text" || field.fieldType === "date")
      ) {
        editTextField(id);
      }
    };

    const handleEditSignatureEvent = (event: CustomEvent) => {
      const { id } = event.detail;
      const field = fieldsContext.find((f: Field) => f._id === id);
      if (field && field.fieldType === "signature") {
        editSignature(id);
      }
    };

    window.addEventListener(
      "editTextField",
      handleEditTextFieldEvent as EventListener
    );

    window.addEventListener(
      "editSignature",
      handleEditSignatureEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "editTextField",
        handleEditTextFieldEvent as EventListener
      );
      window.removeEventListener(
        "editSignature",
        handleEditSignatureEvent as EventListener
      );
    };
  }, [fieldsContext, editTextField, editSignature]);

  const handleCopyPublicSignLink = async (contactId?: string) => {
    if (!documentId) {
      toast.error("No document selected");
      return;
    }

    try {
      // Generate token using the public-document-auth service with 7 days expiration
      const response = await client.service('public-document-auth').create({
        documentId,
        contactId,
        expiresIn: '7d'  // Explicitly set to 7 days
      });

      // Create the public sign link
      const baseUrl = window.location.origin;
      const publicSignLink = `${baseUrl}/public-sign?documentId=${documentId}&token=${response.token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(publicSignLink);
      
      if (contactId) {
        const contact = contacts?.find((c: Contact) => c._id === contactId);
        toast.success(`Public sign link for ${contact?.name || 'contact'} copied to clipboard!`);
      } else {
        toast.success("Public sign link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error generating public sign link:", error);
      toast.error("Failed to generate public sign link");
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentId) {
      toast.error("No document selected");
      return;
    }

    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    try {
      await client.service('documents').remove(documentId);
      toast.success("Document deleted successfully");
      router.push("/dashboard/documents");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleContactAssignment = async (fieldId: string, contactId: string | null) => {
    try {
      // Find the corresponding document field
      const documentField = documentFields?.find(df => df.fieldId === fieldId);
      
      if (!documentField) {
        toast.error("Document field not found");
        return;
      }

      // Update the document field with the new contact assignment
      // Explicitly pass null when unassigning (not undefined)
      await updateDocumentField.mutateAsync({
        id: documentField._id,
        data: {
          contactId: contactId,
        },
      });

      toast.success(contactId ? "Contact assigned successfully" : "Contact assignment removed");
    } catch (error) {
      console.error("Error assigning contact:", error);
      toast.error("Failed to assign contact");
    }
  };

  return (
    <div className="h-full flex -my-6">
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
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Warning: This action will permanently delete this document. This action cannot be undone. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </AlertDialogClose>
              <Button
                onClick={handleDeleteDocument}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete Document
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
            onFinish={handleSaveDocument}
            onDownload={handleDownload}
            includeCertificate={includeCertificate}
            onIncludeCertificateChange={setIncludeCertificate}
            showCertificateOption={true}
            contacts={contacts || []}
            documentFields={documentFields}
          />
        </div>

        {/* Right Fields Panel */}
        <div className="w-72 border-l border-gray-200 flex flex-col h-full">
          <div className="p-4 overflow-y-auto overflow-x-hidden flex-1">
            <div>
              {/* Document Information Section */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Document Information</h3>
                <div className="space-y-3">
                  {/* Title Field */}
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Title</label>
                    
                    {!isEditingTitle ? (
                      <div 
                        className="px-3 py-2 bg-gray-50 rounded-md text-sm border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={handleStartEditingTitle}
                      >
                        {document?.title || <span className="text-gray-400 italic">No title</span>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter document title"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveTitle}
                            size="sm"
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEditingTitle}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Description</label>
                    
                    {!isEditingNote ? (
                      <div 
                        className="px-3 py-2 bg-gray-50 rounded-md text-sm border border-gray-200 min-h-[72px] cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={handleStartEditingNote}
                      >
                        {document?.note || <span className="text-gray-400 italic">No description</span>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Enter document description"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveNote}
                            size="sm"
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEditingNote}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Assign</h3>
                <Select
                  value={selectedAccountId || ""}
                  onValueChange={(value) => setSelectedAccountId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem
                        key={account._id?.toString()}
                        value={account._id?.toString() || ""}
                      >
                        {account.user?.name || "Unknown User"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Section */}
              <div className="mb-6">
                <TagManager
                  selectedTagIds={document?.tagIds || []}
                  onTagsChange={handleTagsChange}
                  disabled={updateDocument.isLoading}
                  title="Document Tags"
                />
              </div>

              {/* Assigned Contacts Section */}
              {(() => {
                // Get unique contacts assigned to document fields
                const assignedContactIds = documentFields
                  ?.filter(df => df.contactId)
                  .map(df => df.contactId)
                  .filter((contactId, index, arr) => arr.indexOf(contactId) === index) || [];
                
                const assignedContacts = assignedContactIds
                  .map(contactId => contacts?.find((c: Contact) => c._id === contactId))
                  .filter(Boolean);

                if (assignedContacts.length === 0) return null;

                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Assigned Contacts</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSendEmailModalOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <IconMail className="h-3 w-3" />
                        Send Email
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {assignedContacts.map((contact) => (
                        <div 
                          key={contact!._id} 
                          className="p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex flex-col space-y-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {contact!.name}
                              </span>
                              <span className="text-xs text-gray-500 break-all">
                                {contact!.email}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 w-full justify-center"
                              onClick={() => handleCopyPublicSignLink(contact!._id)}
                            >
                              <IconLink className="h-3 w-3" />
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <h3 className="text-sm font-medium mb-2">
                Fields on Page {currentPage}
              </h3>
              <div className="space-y-3 mb-6">
                {getFieldsForPage(currentPage).map((field) => {
                  const documentField = documentFields?.find(df => df.fieldId === field._id);
                  
                  return (
                    <div
                      key={field._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-white shadow-sm"
                    >
                      <div 
                        className="cursor-pointer space-y-3"
                        onClick={() => {
                          if (field.fieldType === "text") {
                            editTextField(field._id || "");
                          }
                        }}
                      >
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">
                            {field.fieldType}
                          </span>
                          {field.fieldName}
                        </div>
                        
                        {field.fieldType === "text" && (
                          <div className="text-xs p-2 bg-gray-50 rounded-md border">
                            <span className="text-gray-600">
                              {(field.value as string) || <em className="text-gray-400">No text entered</em>}
                            </span>
                          </div>
                        )}

                        {field.fieldType === "signature" && (
                          <div className="text-xs p-2 bg-gray-50 rounded-md border">
                            {(field.value as string) ? (
                              <div className="flex items-center gap-2">
                                <Image 
                                  src={field.value as string} 
                                  alt="Signature preview" 
                                  width={80}
                                  height={40}
                                  className="object-contain border border-gray-200 rounded"
                                />
                                <span className="text-gray-600">Signature captured</span>
                              </div>
                            ) : (
                              <em className="text-gray-400">No signature entered</em>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-md">
                            x: {Math.round(field.xPosition)}
                          </span>
                          <span className="bg-gray-100 px-2 py-1 rounded-md">
                            y: {Math.round(field.yPosition)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Separator */}
                      <div className="border-t border-gray-100 my-3"></div>
                      
                      {/* Enhanced Contact Assignment UI */}
                      <ContactAssignment
                        contacts={contacts || []}
                        assignedContactId={documentField?.contactId || null}
                        onAssignContact={(contactId) => 
                          handleContactAssignment(field._id || "", contactId)
                        }
                        disabled={isContactsLoading}
                        fieldName={field.fieldName}
                      />
                    </div>
                  );
                })}

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

      <SignatureCanvas
        isOpen={isSignatureCanvasOpen}
        onClose={() => {
          setIsSignatureCanvasOpen(false);
        }}
        onSave={handleSaveSignature}
        fieldName={
          currentEditingField 
            ? fieldsContext.find(f => f._id === currentEditingField || f.temporary_id === currentEditingField)?.fieldName
            : undefined
        }
      />

      <TextFieldCanvas
        isOpen={isTextFieldCanvasOpen}
        onClose={() => {
          setIsTextFieldCanvasOpen(false);
          setCurrentEditingField(null);
        }}
        onSave={handleSaveTextField}
        initialText={
          currentEditingField
            ? (fieldsContext.find((f: Field) => f._id === currentEditingField)
                ?.value as string) || ""
            : ""
        }
        fieldName={
          currentEditingField 
            ? fieldsContext.find(f => f._id === currentEditingField || f.temporary_id === currentEditingField)?.fieldName
            : undefined
        }
      />

      {/* Send Document Email Modal */}
      {(() => {
        // Get assigned contacts for the modal
        const assignedContactIds = documentFields
          ?.filter(df => df.contactId)
          .map(df => df.contactId)
          .filter((contactId, index, arr) => arr.indexOf(contactId) === index) || [];
        
        const assignedContacts = assignedContactIds
          .map(contactId => contacts?.find((c: Contact) => c._id === contactId))
          .filter(Boolean) as Contact[];

        return (
          <SendDocumentEmailModal
            isOpen={isSendEmailModalOpen}
            onClose={() => setIsSendEmailModalOpen(false)}
            documentId={documentId!}
            documentTitle={document?.title || 'Untitled Document'}
            assignedContacts={assignedContacts}
            workspaceName={currentWorkspace?.name || 'Workspace'}
          />
        );
      })()}
    </div>
  );
}
