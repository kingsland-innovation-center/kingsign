"use client";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Document, Page, pdfjs } from "react-pdf";

import { Button } from "@/components/ui/button";
import { useFields, Field } from "@/contexts/FieldsContext";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { IconCheck, IconFileCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { DraggableCheckbox } from "./DraggableCheckbox";
import { DraggableSignature } from "./DraggableSignature";
import { DraggableTextField } from "./DraggableTextField";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  onFinish: () => void;
  isTemplate?: boolean;
  onDownload?: () => void;
  showSaveButton?: boolean;
  documentFields?: Array<{ fieldId: string; isSigned: boolean; _id: string; contactId?: string | null }>;
  includeCertificate?: boolean;
  onIncludeCertificateChange?: (include: boolean) => void;
  showCertificateOption?: boolean;
  contacts?: Array<{ _id: string; name: string; email: string }>;
}

export function DocumentViewer({
  onFinish,
  isTemplate = false,
  onDownload,
  showSaveButton = true,
  documentFields = [],
  includeCertificate = false,
  onIncludeCertificateChange,
  showCertificateOption = false,
  contacts = [],
}: DocumentViewerProps) {
  const router = useRouter();
  const {
    currentPdfFile,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isLoading,
    setIsLoading,
    getFieldsForPage,
    updateSignaturePosition,
    updateSignatureSize,
    updateCheckboxSize,
    toggleCheckbox,
    removeField,
    zoom,
  } = useFields();

  const mouseSensor = useSensor(MouseSensor, {
    // Only start dragging after moving 10px - this prevents conflict with resize handler
    activationConstraint: {
      distance: 10,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const currentPageFields = getFieldsForPage(currentPage);

  const getContactNameForField = (fieldId: string): string | undefined => {
        const documentField = documentFields?.find(df => df.fieldId === fieldId);
    if (!documentField?.contactId) return undefined;

    const contact = contacts?.find(c => c._id === documentField.contactId);
    return contact?.name;
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setTotalPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error): void => {
    console.error("Error loading PDF:", error);
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  const handleFinish = () => {
    onFinish();
  };

  const handleFieldDrag = (event: DragEndEvent) => {
    if (event.active && event.delta) {
      const fieldId = event.active.id as string;

      // Find the field that was moved
      const field = currentPageFields.find(
        (field) => field._id === fieldId || field.temporary_id === fieldId
      );
      if (!field) return;

      // Get the PDF page element for bounds checking
      const pdfPage = document.querySelector(".react-pdf__Page");
      if (!pdfPage) return;

      // Get the bounds of the PDF page
      const pdfBounds = pdfPage.getBoundingClientRect();

      // Calculate new position
      const newX = field.xPosition + event.delta.x;
      const newY = field.yPosition + event.delta.y;

      // Calculate the preview size
      const previewWidth = field.width;
      const previewHeight = field.height;

      // Constrain to PDF bounds with a small buffer
      const constrainedX = Math.max(
        0,
        Math.min(newX, pdfBounds.width - previewWidth)
      );
      const constrainedY = Math.max(
        0,
        Math.min(newY, pdfBounds.height - previewHeight)
      );

      // Update the field position in context
      updateSignaturePosition(fieldId, constrainedX, constrainedY);

      // Release the overflow-hidden class
      const container = document.querySelector(".overflow-hidden");
      if (container) {
        container.classList.remove("overflow-hidden");
        container.classList.add("overflow-y-auto");
      }

      document.body.style.userSelect = "";

      console.log(
        `Field ${fieldId} moved to position: (${constrainedX}, ${constrainedY})`
      );
    }
  };

  // Add handler for field resizing
  const handleFieldResize = (id: string, width: number, height: number) => {
    if (updateSignatureSize) {
      updateSignatureSize(id, width, height);
      console.log(`Field ${id} resized to ${width}x${height}`);
    }
  };

  // Add handler for field deletion
  const handleFieldDelete = (id: string) => {
    console.log(`Deleting field ${id}`);
    removeField(id);
  };

  // Handle edit text field
  const handleEditTextField = (id: string) => {
    // This function will be implemented in the parent component
    // We'll pass the field ID up to the parent to open the text editor
    // Send the ID to the parent component
    if (window && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("editTextField", { detail: { id } })
      );
    }
  };

  // Handle edit signature
  const handleEditSignature = (id: string) => {
    // This function will be implemented in the parent component
    // We'll pass the field ID up to the parent to open the signature editor
    if (window && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("editSignature", { detail: { id } })
      );
    }
  };

  // Handle format change for text fields
  const handleFormatChange = (
    id: string,
    format: { fontSize?: number; isBold?: boolean; isItalic?: boolean }
  ) => {
    // Send this information to the parent component
    if (window && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("textFormatChange", {
          detail: { id, format },
        })
      );
    }
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (id: string) => {
    if (window && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("toggleCheckbox", { detail: { id } })
      );
    }
  };

  // Handle checkbox size change
  const handleCheckboxSizeChange = (id: string, size: number) => {
    if (updateCheckboxSize) {
      updateCheckboxSize(id, size);
      console.log(`Checkbox ${id} size changed to ${size}%`);
    }
  };

  // const handleSignatureEdit = (id: string) => {
  //   setCurrentEditingField(id);
  //   setIsSignatureCanvasOpen(true);
  // };

  // const handleSaveSignature = (signatureData: string) => {
  //   if (currentEditingField) {
  //     updateFieldSignature(currentEditingField, signatureData);
  //     setCurrentEditingField(null);
  //   }
  //   setIsSignatureCanvasOpen(false);
  // };

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar */}
      <div className="sticky z-50 top-4 flex items-center justify-between mb-4 bg-gray-100 p-2 rounded">
        <div className="flex items-center gap-4">
          {totalPages > 1 && (
            <>
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                ←
              </Button>
              <p className="text-sm">
                {currentPage} of {totalPages}
              </p>
              <Button
                variant="ghost"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
              >
                →
              </Button>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-md ml-2">
                {currentPageFields.length} field
                {currentPageFields.length !== 1 ? "s" : ""} on this page
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-gray-600 hover:text-gray-800 transition-colors"
            onClick={() => router.back()}
          >
            Back
          </Button>
          {!isTemplate && onDownload && (
            <>
              {showCertificateOption && onIncludeCertificateChange && (
                <div className="flex items-center gap-2 mr-4">
                  <input
                    type="checkbox"
                    id="includeCertificate"
                    checked={includeCertificate}
                    onChange={(e) => onIncludeCertificateChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="includeCertificate" className="text-sm text-gray-700">
                    Include Certificate of Signature
                  </label>
                </div>
              )}
              <Button
                onClick={handleDownload}
                variant="outline"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <IconFileCheck size={18} className="stroke-2" />
                <span>Download</span>
              </Button>
              {showSaveButton && (
                <Button
                  onClick={handleFinish}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <IconCheck size={18} className="stroke-2" />
                  <span>Save</span>
                </Button>
              )}
            </>
          )}
          {isTemplate && (
            <Button
              onClick={handleFinish}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <IconCheck size={18} className="stroke-2" />
              <span>Save</span>
            </Button>
          )}
        </div>
      </div>

      {/* PDF Document */}
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          Loading document...
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full min-w-full flex justify-center items-center p-4">
          <Document
            file={currentPdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<></>}
            noData={<></>}
            error={
              <div className="flex items-center justify-center h-full">
                Error loading document
              </div>
            }
            className="flex justify-center items-center"
          >
            <DndContext
              sensors={sensors}
              onDragEnd={handleFieldDrag}
              autoScroll={false}
            >
              <div 
                className="relative border-[1px] transition-transform duration-200" 
                key={currentPage}
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: '50% 50%',
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  margin: 'auto'
                }}
              >
                <Page
                  key={currentPage}
                  pageNumber={currentPage}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="w-full h-full"
                  scale={1}
                />

                {/* Render current page fields */}
                {currentPageFields.map((field) => {
                  // Find the corresponding document field to check if it's signed
                  const documentField = documentFields?.find((df) => df.fieldId === field._id);
                  const isSigned = documentField?.isSigned || false;

                  if (
                    field.fieldType === "signature" &&
                    (typeof field.value === "string" || field.value === null)
                  ) {
                    return (
                      <DraggableSignature
                        key={field._id ?? field.temporary_id}
                        id={field._id ?? field.temporary_id}
                        signature={field.value ?? null}
                        position={{ x: field.xPosition, y: field.yPosition }}
                        width={field.width}
                        height={field.height}
                        onResize={handleFieldResize}
                        onDelete={handleFieldDelete}
                        onEdit={handleEditSignature}
                        allowEdit={isTemplate}
                        isSigned={isSigned}
                        fieldName={field.fieldName}
                        contactName={getContactNameForField(field._id ?? field.temporary_id)}
                      />
                    );
                  } else if (
                    field.fieldType === "text" &&
                    (typeof field.value === "string" || field.value === null)
                  ) {
                    return (
                      <DraggableTextField
                        key={field._id ?? field.temporary_id}
                        id={field._id ?? field.temporary_id}
                        text={field.value ?? ""}
                        position={{ x: field.xPosition, y: field.yPosition }}
                        width={field.width}
                        height={field.height}
                        fontSize={field.fontSize || 14}
                        isBold={field.isBold || false}
                        isItalic={field.isItalic || false}
                        onResize={handleFieldResize}
                        onDelete={handleFieldDelete}
                        onEdit={handleEditTextField}
                        onFormatChange={handleFormatChange}
                        allowEdit={isTemplate}
                        isSigned={isSigned}
                        fieldName={field.fieldName}
                        contactName={getContactNameForField(field._id ?? field.temporary_id)}
                      />
                    );
                  } else if (
                    field.fieldType === "checkbox" &&
                    (typeof field.value === "boolean" || field.value === null)
                  ) {
                    return (
                      <DraggableCheckbox
                        key={field._id ?? field.temporary_id}
                        id={field._id ?? field.temporary_id}
                        isChecked={field.isChecked || false}
                        position={{ x: field.xPosition, y: field.yPosition }}
                        width={field.width}
                        height={field.height}
                        size={field.checkboxSize || 100}
                        onDelete={handleFieldDelete}
                        onToggle={handleCheckboxToggle}
                        onSizeChange={handleCheckboxSizeChange}
                        allowEdit={isTemplate}
                        isSigned={isSigned}
                        fieldName={field.fieldName}
                        contactName={getContactNameForField(field._id ?? field.temporary_id)}
                      />
                    );
                  } else if (
                    field.fieldType === "date" &&
                    (typeof field.value === "string" || field.value === null)
                  ) {
                    return (
                      <DraggableTextField
                        key={field._id ?? field.temporary_id}
                        id={field._id ?? field.temporary_id}
                        text={field.value ?? ""}
                        position={{ x: field.xPosition, y: field.yPosition }}
                        width={field.width}
                        height={field.height}
                        fontSize={field.fontSize || 12}
                        isBold={field.isBold || false}
                        isItalic={field.isItalic || false}
                        onResize={handleFieldResize}
                        onDelete={handleFieldDelete}
                        onEdit={handleEditTextField}
                        onFormatChange={handleFormatChange}
                        allowEdit={isTemplate}
                        isSigned={isSigned}
                        fieldName={field.fieldName}
                        contactName={getContactNameForField(field._id ?? field.temporary_id)}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </DndContext>
          </Document>
        </div>
      </div>

      {/* <SignatureCanvas
        isOpen={isSignatureCanvasOpen}
        onClose={() => {
          setIsSignatureCanvasOpen(false);
          setCurrentEditingField(null);
        }}
        onSave={handleSaveSignature}
        fieldName={
          currentEditingField 
            ? fields.find(f => f._id === currentEditingField)?.field_name
            : undefined
        }
      /> */}
    </div>
  );
}
