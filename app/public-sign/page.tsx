"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { downloadSignedPDF } from "@/utils/pdf-download";

import { DocumentViewer } from "@/components/ui/Document/DocumentViewer";
import SignatureCanvas from "@/components/ui/SignatureCanvas";
import TextFieldCanvas from "@/components/ui/TextFieldCanvas";
import { TableOfContents } from "@/components/ui/TableOfContents";
import { useFields, Field } from "@/contexts/FieldsContext";
import { useDocuments } from "@/hooks/useDocuments";
import { useTemplates } from "@/hooks/useTemplates";
import { DocumentStatus } from "@/repositories/DocumentsRepository";
import { AuthRepository } from "@/repositories/AuthRepository";
import { signOut, useSession } from "next-auth/react";
import feathersClient from "@feathersjs/client";
import client from "@/services/FeathersClient";
import { documentFieldsRepository, BatchSignRequest } from "@/repositories/DocumentFieldsRepository";

// Add interface for token payload
interface TokenPayload {
  aud: string;
  contactId: string;
  documentId: string;
  exp: number;
  iat: number;
  iss: string;
  purpose: string;
  sub: string;
}

export default function PublicSignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublicSignPageContent />
    </Suspense>
  );
}

function PublicSignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");
  const token = searchParams.get("token");

  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Authenticate and get token payload
  useEffect(() => {
    const authenticateWithToken = async () => {
      if (!token) {
        toast.error("Invalid or missing token");
        router.push("/");
        return;
      }

      setIsAuthenticating(true);
      
      try {
        const authResult = await client.authenticate({
          strategy: 'jwt',
          accessToken: token
        });
        
        // Extract payload from the authentication result
        const payload = authResult.authentication.payload
        setTokenPayload(payload);
        
        // Set token in localStorage for persistence
        localStorage.setItem("feathers-jwt", token);
        
      } catch (error) {
        console.error("Authentication failed:", error);
        toast.error("Authentication failed. Invalid or expired token.");
        router.push("/");
      } finally {
        setIsAuthenticating(false);
      }
    };

    authenticateWithToken();
  }, [token, router]);

  // Cleanup function to logout when component unmounts
  useEffect(() => {
    return () => {
      // Logout from both Feathers and NextAuth
      Promise.all([
        AuthRepository.logout(),
        signOut({ redirect: false }),
        localStorage.removeItem("feathers-jwt")
      ]).catch((error) => {
        console.error("Error during logout:", error);
      });
    };
  }, []);

  const {
    document,
    file,
    isDocumentLoading,
    isFileLoading,
    documentError,
    fileError,
    updateDocument,
    documentFields,
    updateDocumentField,
    contacts,
    signatureFootprintData,
    isContactsLoading,
  } = useDocuments(documentId || undefined);

  const currentContact = contacts.find(contact => contact._id === tokenPayload?.contactId);

  const { templateFields, isTemplateFieldsLoading } = useTemplates(
    document?.templateId || undefined
  );

  const {
    currentPdfFile,
    setCurrentPdfFile,
    addSignatureToPage,
    addTextFieldToPage,
    addCheckboxToPage,
    addDateFieldToPage,
    fields,
    updateTextField,
    updateFieldSignature,
    removeField,
    zoomIn,
    zoomOut,
    currentPage,
    setCurrentPage,
  } = useFields();

  useEffect(() => {
    if (templateFields && templateFields.length > 0 && documentFields && tokenPayload) {
      // Clear existing fields first
      fields.forEach((field) => {
        if (field._id) {
          removeField(field._id);
        }
      });

      // Filter document fields to only show fields assigned to the current contact
      const contactDocumentFields = documentFields.filter(
        (df) => df.contactId === tokenPayload.contactId
      );

      // Add template fields with document field values (only for the current contact)
      templateFields.forEach((templateField) => {
        const documentField = contactDocumentFields.find(
          (df) => df.fieldId === templateField._id
        );

        // Only show fields that are assigned to the current contact
        if (!documentField) {
          return; // Skip this field if it's not assigned to the current contact
        }

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
            addSignatureToPage({
              page: typeof templateField.metadata?.page === "number" ? templateField.metadata?.page : 1,
              signature: (documentField?.value as string) || null,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
          case "text":
            addTextFieldToPage({
              page: typeof templateField.metadata?.page === "number" ? templateField.metadata?.page : 1,
              defaultText: (documentField?.value as string) || null,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
          case "checkbox":
            addCheckboxToPage({
              page: typeof templateField.metadata?.page === "number" ? templateField.metadata?.page : 1,
              isChecked: (documentField?.value as boolean) || false,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
          case "date":
            addDateFieldToPage({
              page: typeof templateField.metadata?.page === "number" ? templateField.metadata?.page : 1,
              templateFieldId: templateField._id,
              fieldData,
            });
            break;
        }
      });
    }
  }, [templateFields, documentFields, tokenPayload]);

  useEffect(() => {
    if (file) {
      setCurrentPdfFile(file.fileUrl);
    }
  }, [file, setCurrentPdfFile]);

  const [isSignatureCanvasOpen, setIsSignatureCanvasOpen] = useState(false);
  const [isTextFieldCanvasOpen, setIsTextFieldCanvasOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleSaveSignature = async (signatureData: string) => {
    if (!currentEditingField) return;

    const field = fields.find((f) => f._id === currentEditingField);
    if (!field) return;

    updateFieldSignature(currentEditingField, signatureData);
    setIsSignatureCanvasOpen(false);
    setCurrentEditingField(null);

    // Update the document field in the backend
    if (field._id) {
      const documentField = documentFields?.find(
        (df) => df.fieldId === field._id
      );
      if (documentField) {
        updateDocumentField.mutate(
          {
            id: documentField._id,
            data: {
              value: signatureData,
            },
          },
          {
            onError: (error) => {
              console.error("Failed to update signature:", error);
              toast.error("Failed to save signature. Please try again.");
            },
          }
        );
      }
    }
  };

  const handleSaveTextField = (text: string) => {
    if (!currentEditingField) return;

    const field = fields.find((f) => f._id === currentEditingField);
    if (!field) return;

    updateTextField(currentEditingField, text);
    setIsTextFieldCanvasOpen(false);
    setCurrentEditingField(null);

    // Update the document field in the backend
    if (field._id) {
      const documentField = documentFields?.find(
        (df) => df.fieldId === field._id
      );
      if (documentField) {
        updateDocumentField.mutate(
          {
            id: documentField._id,
            data: {
              value: text,
            },
          },
          {
            onError: (error) => {
              console.error("Failed to update text field:", error);
              toast.error("Failed to save text field. Please try again.");
            },
          }
        );
      }
    }
  };

  const handleSaveDocument = async () => {
    try {
      // Validate required fields
      const requiredFields = fields.filter((field) => field.required);
      const emptyRequiredFields = requiredFields.filter(
        (field) => !field.value || field.value.toString().trim() === ""
      );

      if (emptyRequiredFields.length > 0) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Check if all fields have values
      const allFieldsHaveValues = fields.every(
        (field) => field.value && field.value.toString().trim() !== ""
      );

      if (!tokenPayload?.contactId) {
        toast.error("Invalid contact information");
        return;
      }

      if (allFieldsHaveValues && documentId) {
        // First, batch sign all document fields for this contact
        const batchSignRequest: BatchSignRequest = {
          documentId: documentId,
          contactId: tokenPayload.contactId
        };

        const signResult = await documentFieldsRepository.batchSignDocumentFields(batchSignRequest);
        console.log(signResult)

        if (signResult.signedFieldsCount === 0) {
          toast.error("No fields were found to sign for this contact");
          return;
        }

        toast.success(`Document signed successfully! ${signResult.signedFieldsCount} fields were signed.`);
        router.push("/document-signed");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error((error as any)?.response?.data?.message);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadSignedPDF({
        contacts,
        signatureFootprints: signatureFootprintData,
        includeCertificate: true,
        currentPdfFile,
        fields,
        containerRef,
        documentTitle: document?.title || "document",
        onError: (error) => {
          toast.error(`Failed to download PDF: ${error}`);
        },
        onSuccess: () => {
          toast.success("PDF downloaded successfully!");
        },
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handleFieldClick = (field: Field) => {
    if (!containerRef.current) return;
    
    // First, if the field is on a different page, we need to change to that page
    if (field.page !== currentPage) {
      // Update the page in the context
      setCurrentPage(field.page);
      
      setTimeout(() => {
        // Find the field element in the DOM and scroll to it
        const fieldElement = window.document.querySelector(`[data-field-id="${field._id || field.temporary_id}"]`);
        
        if (fieldElement) {
          fieldElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
          
          // Highlight effect on the field
          fieldElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'animate-pulse');
          setTimeout(() => {
            fieldElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-75', 'animate-pulse');
          }, 3000);
          
          toast.success(`Jumped to ${field.fieldName}`);
        } else {
          // Fallback: scroll to approximate position
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Calculate approximate scroll position
            const scrollX = Math.max(0, field.xPosition - containerRect.width / 2);
            const scrollY = Math.max(0, field.yPosition - containerRect.height / 2);
            
            container.scrollTo({
              left: scrollX,
              top: scrollY,
              behavior: 'smooth'
            });
            
            toast.success(`Jumped to ${field.fieldName}`);
          }
        }
      }, 200);
      return;
    }
    
    // If we're already on the correct page, just scroll to the field
    const fieldElement = window.document.querySelector(`[data-field-id="${field._id || field.temporary_id}"]`);
    
    if (fieldElement) {
      // Scroll the field into view
      fieldElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
      
      // Add a more prominent highlight effect
      fieldElement.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'animate-pulse');
      setTimeout(() => {
        fieldElement.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-75', 'animate-pulse');
      }, 3000);
      
      toast.success(`Jumped to ${field.fieldName}`);
    } else {
      // Fallback: scroll to approximate position
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        
        const scrollX = Math.max(0, field.xPosition - containerRect.width / 2);
        const scrollY = Math.max(0, field.yPosition - containerRect.height / 2);
        
        container.scrollTo({
          left: scrollX,
          top: scrollY,
          behavior: 'smooth'
        });
        
        toast.success(`Jumped to ${field.fieldName}`);
      }
    }
  };

  // Add event listeners for field editing
  useEffect(() => {
    const handleEditTextFieldEvent = (event: CustomEvent) => {
      const { id } = event.detail;
      const field = fields.find((f) => f._id === id);
      // Find the corresponding document field to check if it's signed
      const documentField = documentFields?.find((df) => df.fieldId === id);
      if (field && (field.fieldType === "text" || field.fieldType === "date")) {
        if (documentField?.isSigned) {
          toast.error("This field has already been signed and cannot be edited.");
          return;
        }
        setCurrentEditingField(id);
        setIsTextFieldCanvasOpen(true);
      }
    };

    const handleEditSignatureEvent = (event: CustomEvent) => {
      const { id } = event.detail;
      const field = fields.find((f) => f._id === id);
      // Find the corresponding document field to check if it's signed
        const documentField = documentFields?.find((df) => df.fieldId === id);
      if (field && field.fieldType === "signature") {
        if (documentField?.isSigned) {
          toast.error("This field has already been signed and cannot be edited.");
          return;
        }
        setCurrentEditingField(id);
        setIsSignatureCanvasOpen(true);
      }
    };

    // Add handler for checkbox toggle
    const handleCheckboxToggle = (event: CustomEvent) => {
      const { id } = event.detail;
      const field = fields.find((f) => f._id === id);
      const documentField = documentFields?.find((df) => df.fieldId === id);
      
      if (field && field.fieldType === "checkbox") {
        if (documentField?.isSigned) {
          toast.error("This field has already been signed and cannot be edited.");
          return;
        }
        
        // Update the field value
        const newValue = !field.value;
        updateTextField(id, newValue.toString());
        
        // Update the document field in the backend
        if (documentField) {
          updateDocumentField.mutate(
            {
              id: documentField._id,
              data: {
                value: newValue,
              },
            },
            {
              onError: (error) => {
                console.error("Failed to update checkbox:", error);
                toast.error("Failed to save checkbox. Please try again.");
              },
            }
          );
        }
      }
    };

    window.addEventListener("editTextField", handleEditTextFieldEvent as EventListener);
    window.addEventListener("editSignature", handleEditSignatureEvent as EventListener);
    window.addEventListener("toggleCheckbox", handleCheckboxToggle as EventListener);

    return () => {
      window.removeEventListener("editTextField", handleEditTextFieldEvent as EventListener);
      window.removeEventListener("editSignature", handleEditSignatureEvent as EventListener);
      window.removeEventListener("toggleCheckbox", handleCheckboxToggle as EventListener);
    };
  }, [fields, documentFields, updateTextField, updateDocumentField]);

  if (isDocumentLoading || isFileLoading || isTemplateFieldsLoading || isAuthenticating) {
    return <div>Loading...</div>;
  }

  if (!tokenPayload) {
    return <div>Sign Url Expired or Invalid</div>;
  }

  if (documentError || fileError) {
    return <div>Error loading document: {((documentError || fileError) as Error).message}</div>;
  }

  if (!document || !file) {
    return <div>Document not found</div>;
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{document.title}</h1>
              {currentContact && (
                <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded-md">
                  For: <span className="font-medium text-gray-900">{currentContact.name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={zoomOut}>
                <IconZoomOut className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={zoomIn}>
                <IconZoomIn className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 overflow-auto" ref={containerRef}>
            <DocumentViewer
              onFinish={handleSaveDocument}
              onDownload={handleDownload}
              isTemplate={false}
              showSaveButton={true}
              documentFields={documentFields}
              contacts={currentContact && currentContact._id ? [{
                _id: String(currentContact._id),
                name: currentContact.name,
                email: currentContact.email || ''
              }] : []}
            />
          </div>
        </div>

        <div className="w-80 border-l border-gray-200 flex flex-col h-full">
          <TableOfContents
            fields={fields}
            onFieldClick={handleFieldClick}
            currentPage={currentPage}
            className="flex-1"
          />
        </div>
      </div>

      <SignatureCanvas
        isOpen={isSignatureCanvasOpen}
        onClose={() => {
          setIsSignatureCanvasOpen(false);
          setCurrentEditingField(null);
        }}
        fieldName={
          currentEditingField 
            ? fields.find(f => f._id === currentEditingField)?.fieldName
            : undefined
        }
        onSave={handleSaveSignature}
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
            ? fields.find((f) => f._id === currentEditingField)?.value as string || ""
            : ""
        }
        fieldName={
          currentEditingField 
            ? fields.find(f => f._id === currentEditingField)?.fieldName
            : undefined
        }
      />
    </div>
  );
}
