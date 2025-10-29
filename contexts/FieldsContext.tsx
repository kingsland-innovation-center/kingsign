"use client";

import { getDefaultFormatDate, getDateNow } from "@/utils/date-utils";
import { nanoid } from "nanoid";
import React, { createContext, useCallback, useContext, useState } from "react";

// Define the types for signature fields
export type FieldType = "signature" | "text" | "checkbox" | "date";

export interface FieldMetadata {
  temporary_id: string;
  fontSize?: number; // For text formatting
  isBold?: boolean; // For text formatting
  isItalic?: boolean; // For text formatting
  isChecked?: boolean; // For checkbox fields
  checkboxSize?: number; // For checkbox size (percentage)
}

export interface Field extends FieldMetadata {
  _id: string | null;
  page: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  fieldType: string;
  fieldName: string;
  placeholder?: string;
  required: boolean;
  createdAt?: string;
  updatedAt?: string;
  value?: string | null | boolean;
}

interface AddSignatureToPageInterface {
  page: number;
  signature: string | null;
  isTemplateOverride?: boolean;
  templateFieldId?: string;
  fieldData?: Field;
}

interface AddTextFieldToPageInterface {
  page: number;
  defaultText?: string | null;
  isTemplateOverride?: boolean;
  templateFieldId?: string;
  fieldData?: Field;
}

interface AddCheckboxToPageInterface {
  page: number;
  isChecked?: boolean | null;
  isTemplateOverride?: boolean;
  templateFieldId?: string;
  fieldData?: Field;
}

interface AddDateFieldToPageInterface {
  page: number;
  isTemplateOverride?: boolean;
  templateFieldId?: string;
  fieldData?: Field;
}

interface FieldsContextType {
  // Current document and signature state
  currentPdfFile: string | null;
  setCurrentPdfFile: (file: string | null) => void;
  currentDrawingSignature: string | null; // The current signature being drawn
  setCurrentDrawingSignature: (image: string | null) => void;

  // Page management
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;

  // Zoom management
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Shared field management
  fields: Field[];
  getFieldsForPage: (page: number) => Field[];
  updateSignaturePosition: (id: string, x: number, y: number) => void;
  updateSignatureSize: (id: string, width: number, height: number) => void;
  updateFieldName: (id: string, name: string) => void;
  removeField: (id: string) => void;
  resetFields: () => void;

  // Template-specific functions
  addTemplateSignatureField: (params: AddSignatureToPageInterface) => void;
  addTemplateTextFieldField: (params: AddTextFieldToPageInterface) => void;
  addTemplateDateField: (params: AddDateFieldToPageInterface) => void;
  addTemplateCheckboxField: (params: AddCheckboxToPageInterface) => void;

  // Document-specific functions (signing)
  addSignatureToPage: (params: AddSignatureToPageInterface) => void;
  addTextFieldToPage: (params: AddTextFieldToPageInterface) => void;
  addDateFieldToPage: (params: AddDateFieldToPageInterface) => void;
  addCheckboxToPage: (params: AddCheckboxToPageInterface) => void;
  updateFieldSignature: (id: string, signature: string) => void;
  updateTextField: (id: string, text: string | null) => void;
  updateTextFormat: (
    id: string,
    format: { fontSize?: number; isBold?: boolean; isItalic?: boolean }
  ) => void;
  updateCheckboxSize: (id: string, size: number) => void;
  toggleCheckbox: (id: string) => void;

  // PDF Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Template state
  isTemplate: boolean;
}

const FieldsContext = createContext<FieldsContextType | undefined>(undefined);

export const useFields = () => {
  const context = useContext(FieldsContext);
  if (!context) {
    throw new Error("useFields must be used within a FieldsProvider");
  }
  return context;
};

export const FieldsProvider: React.FC<{
  children: React.ReactNode;
  isTemplate?: boolean;
}> = ({ children, isTemplate = false }) => {
  // PDF document state
  const [currentPdfFile, setCurrentPdfFile] = useState<string | null>(null);
  const [currentDrawingSignature, setCurrentDrawingSignature] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize with empty signature fields
  const [fields, setFields] = useState<Field[]>([]);

  // Create a Set to track unique field IDs
  const [fieldIds] = useState<Set<string>>(new Set());

  // Zoom state
  const [zoom, setZoom] = useState<number>(1);

  // ========== FIELD CREATION HELPERS ==========

  // Helper function to create a default signature field for a page
  const createDefaultSignature = (
    page: number,
    signature: string | null,
    isTemplateOverride?: boolean,
    templateFieldId?: string,
    fieldData?: Field
  ): Field => {
    const now = new Date().toISOString();

    return {
      _id: templateFieldId ?? null,
      temporary_id: nanoid(),
      page,
      xPosition: fieldData?.xPosition ?? 100,
      yPosition: fieldData?.yPosition ?? 300,
      width: fieldData?.width ?? 300,
      height: fieldData?.height ?? 100,
      fieldType: fieldData?.fieldType ?? "signature",
      fieldName: fieldData?.fieldName ?? "Signature",
      required: fieldData?.required ?? true,
      createdAt: now,
      updatedAt: now,
      value:
        (isTemplateOverride ?? isTemplate)
          ? null
          : (fieldData?.value ?? signature),
    };
  };

  // Helper function to create a default text field for a page
  const createDefaultTextField = (
    page: number,
    defaultText: string | null = null,
    isTemplateOverride?: boolean,
    templateFieldId?: string,
    fieldData?: Field
  ): Field => {
    return {
      _id: templateFieldId ?? null,
      temporary_id: nanoid(),
      page,
      xPosition: fieldData?.xPosition ?? 100,
      yPosition: fieldData?.yPosition ?? 200,
      width: fieldData?.width ?? 300,
      height: fieldData?.height ?? 36,
      fieldType: fieldData?.fieldType ?? "text",
      fieldName: fieldData?.fieldName ?? "Text Field",
      placeholder: fieldData?.placeholder ?? "Enter text here",
      required: fieldData?.required ?? false,
      createdAt: fieldData?.createdAt ?? getDateNow(),
      updatedAt: fieldData?.updatedAt ?? getDateNow(),
      value:
        (isTemplateOverride ?? isTemplate)
          ? null
          : (fieldData?.value ?? defaultText),
      fontSize: fieldData?.fontSize ?? 12,
      isBold: fieldData?.isBold ?? false,
      isItalic: fieldData?.isItalic ?? false,
    };
  };

  // Helper function to create a default checkbox field for a page
  const createDefaultCheckbox = (
    page: number,
    isChecked: boolean | null,
    isTemplateOverride?: boolean,
    templateFieldId?: string,
    fieldData?: Field
  ): Field => {
    return {
      _id: templateFieldId ?? null,
      temporary_id: nanoid(),
      page,
      xPosition: fieldData?.xPosition ?? 100,
      yPosition: fieldData?.yPosition ?? 150,
      width: fieldData?.width ?? 32,
      height: fieldData?.height ?? 32,
      fieldType: fieldData?.fieldType ?? "checkbox",
      fieldName: fieldData?.fieldName ?? "Checkbox",
      required: fieldData?.required ?? false,
      createdAt: fieldData?.createdAt ?? getDateNow(),
      updatedAt: fieldData?.updatedAt ?? getDateNow(),
      value:
        (isTemplateOverride ?? isTemplate)
          ? null
          : (fieldData?.value ?? isChecked),

      checkboxSize: fieldData?.checkboxSize ?? 100, // Default 100% size
    };
  };

  // Helper function to create a default date field for a page
  const createDefaultDateField = (
    page: number,
    isTemplateOverride?: boolean,
    templateFieldId?: string,
    fieldData?: Field
  ): Field => {
    return {
      _id: templateFieldId ?? null,
      temporary_id: nanoid(),
      page,
      xPosition: fieldData?.xPosition ?? 50,
      yPosition: fieldData?.yPosition ?? 50,
      width: fieldData?.width ?? 150, // Default width for date/text
      height: fieldData?.height ?? 36, // Default height for date/text
      fieldType: fieldData?.fieldType ?? "date",
      fieldName: fieldData?.fieldName ?? "Date Field",
      required: fieldData?.required ?? false,
      createdAt: fieldData?.createdAt ?? new Date().toISOString(),
      updatedAt: fieldData?.updatedAt ?? new Date().toISOString(),
      value:
        (isTemplateOverride ?? isTemplate)
          ? null
          : (fieldData?.value ?? getDefaultFormatDate()),
      fontSize: fieldData?.fontSize ?? 12,
      isBold: false,
      isItalic: false,
    };
  };

  // ========== SHARED FIELD MANAGEMENT ==========

  // Get all fields for a specific page
  const getFieldsForPage = (page: number): Field[] => {
    return fields.filter((field) => field.page === page);
  };

  // Helper function to check for duplicate fields using Set
  const isDuplicateField = (newField: Field): boolean => {
    const fieldId = newField._id || newField.temporary_id;
    if (fieldIds.has(fieldId)) {
      return true;
    }
    fieldIds.add(fieldId);
    return false;
  };

  // Update a field's position
  const updateSignaturePosition = (id: string, x: number, y: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id || field.temporary_id === id
          ? {
              ...field,
              xPosition: x,
              yPosition: y,
              updatedAt: new Date().toISOString(),
            }
          : field
      )
    );
  };

  // Update a field's size
  const updateSignatureSize = (id: string, width: number, height: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id || field.temporary_id === id
          ? { ...field, width, height, updatedAt: new Date().toISOString() }
          : field
      )
    );
  };

  // Update field name
  const updateFieldName = (id: string, name: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id || field.temporary_id === id
          ? {
              ...field,
              fieldName: name,
              updatedAt: new Date().toISOString(),
            }
          : field
      )
    );
  };

  // Remove a field
  const removeField = (id: string) => {
    fieldIds.delete(id); // Remove from Set when field is deleted
    setFields((prev) =>
      prev.filter((field) => (field._id ?? field.temporary_id) !== id)
    );
  };

  // Reset all fields
  const resetFields = () => {
    fieldIds.clear(); // Clear the Set when resetting fields
    setFields([]);
  };

  // ========== TEMPLATE FUNCTIONS ==========

  // Add a new signature field to template
  const addTemplateSignatureField = (params: AddSignatureToPageInterface) => {
    const { page, signature, templateFieldId, fieldData } = params;
    const newSignature = createDefaultSignature(
      page,
      signature,
      true, // isTemplateOverride = true for templates
      templateFieldId,
      fieldData
    );

    // Check for duplicates before adding
    if (isDuplicateField(newSignature)) {
      console.warn("Duplicate field detected, skipping addition");
      return;
    }

    setFields((prev) => [...prev, newSignature]);
  };

  // Add a new text field to template
  const addTemplateTextFieldField = (params: AddTextFieldToPageInterface) => {
    const { page, defaultText, templateFieldId, fieldData } = params;
    const newTextField = createDefaultTextField(
      page,
      defaultText,
      true, // isTemplateOverride = true for templates
      templateFieldId,
      fieldData
    );

    // Check for duplicates before adding
    if (isDuplicateField(newTextField)) {
      console.warn("Duplicate field detected, skipping addition");
      return;
    }

    setFields((prev) => [...prev, newTextField]);
  };

  // Add a new date field to template
  const addTemplateDateField = useCallback(
    (params: AddDateFieldToPageInterface) => {
      const { page, templateFieldId, fieldData } = params;
      const newDateField = createDefaultDateField(
        page,
        true, // isTemplateOverride = true for templates
        templateFieldId,
        fieldData
      );

      // Check for duplicates before adding
      if (isDuplicateField(newDateField)) {
        console.warn("Duplicate field detected, skipping addition");
        return;
      }

      setFields((prev) => [...prev, newDateField]);
    },
    []
  );

  // Add a new checkbox to template
  const addTemplateCheckboxField = (params: AddCheckboxToPageInterface) => {
    const { page, isChecked, templateFieldId, fieldData } = params;
    const newCheckbox = createDefaultCheckbox(
      page,
      isChecked ?? null,
      true, // isTemplateOverride = true for templates
      templateFieldId,
      fieldData
    );

    // Check for duplicates before adding
    if (isDuplicateField(newCheckbox)) {
      console.warn("Duplicate field detected, skipping addition");
      return;
    }

    setFields((prev) => [...prev, newCheckbox]);
  };

  // ========== DOCUMENT FUNCTIONS (SIGNING) ==========

  // Add a new signature to a document page
  const addSignatureToPage = (params: AddSignatureToPageInterface) => {
    const { page, signature, isTemplateOverride, templateFieldId, fieldData } =
      params;
    const newSignature = createDefaultSignature(
      page,
      signature,
      isTemplateOverride,
      templateFieldId,
      fieldData
    );

    // Check for duplicates before adding
    if (isDuplicateField(newSignature)) {
      console.warn("Duplicate field detected, skipping addition");
      return;
    }

    setFields((prev) => [...prev, newSignature]);
  };

  // Add a new text field to a document page
  const addTextFieldToPage = (params: AddTextFieldToPageInterface) => {
    const {
      page,
      defaultText,
      isTemplateOverride,
      templateFieldId,
      fieldData,
    } = params;
    const newTextField = createDefaultTextField(
      page,
      defaultText,
      isTemplateOverride,
      templateFieldId,
      fieldData
    );

    // Check for duplicates before adding
    if (isDuplicateField(newTextField)) {
      console.warn("Duplicate field detected, skipping addition");
      return;
    }

    setFields((prev) => [...prev, newTextField]);
  };

  // Add a new date field to a document page
  const addDateFieldToPage = useCallback(
    (params: AddDateFieldToPageInterface) => {
      const { page, isTemplateOverride, templateFieldId, fieldData } = params;
      const newDateField = createDefaultDateField(
        page,
        isTemplateOverride,
        templateFieldId,
        fieldData
      );

      // Check for duplicates before adding
      if (isDuplicateField(newDateField)) {
        console.warn("Duplicate field detected, skipping addition");
        return;
      }

      setFields((prev) => [...prev, newDateField]);
    },
    [isTemplate]
  );

  // Add a new checkbox to a document page
  const addCheckboxToPage = (params: AddCheckboxToPageInterface) => {
    const { page, isChecked, isTemplateOverride, templateFieldId, fieldData } =
      params;
    const newCheckbox = createDefaultCheckbox(
      page,
      isChecked ?? null,
      isTemplateOverride,
      templateFieldId,
      fieldData
    );

    // Check for duplicates before adding
    if (isDuplicateField(newCheckbox)) {
      console.warn("Duplicate field detected, skipping addition");
      return;
    }

    setFields((prev) => [...prev, newCheckbox]);
  };

  // Update a field's signature value
  const updateFieldSignature = (id: string, signature: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id || field.temporary_id === id
          ? {
              ...field,
              value: signature,
              updatedAt: new Date().toISOString(),
            }
          : field
      )
    );
  };

  // Update a field's text value
  const updateTextField = (id: string, text: string | null) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id || field.temporary_id === id
          ? { ...field, value: text, updatedAt: new Date().toISOString() }
          : field
      )
    );
  };

  // Update text formatting
  const updateTextFormat = (
    id: string,
    format: { fontSize?: number; isBold?: boolean; isItalic?: boolean }
  ) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id || field.temporary_id === id
          ? {
              ...field,
              fontSize:
                format.fontSize !== undefined
                  ? format.fontSize
                  : field.fontSize,
              isBold:
                format.isBold !== undefined ? format.isBold : field.isBold,
              isItalic:
                format.isItalic !== undefined
                  ? format.isItalic
                  : field.isItalic,
              updatedAt: new Date().toISOString(),
            }
          : field
      )
    );
  };

  // Update checkbox size
  const updateCheckboxSize = (id: string, size: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id && field.fieldType === "checkbox"
          ? {
              ...field,
              checkboxSize: size,
              updatedAt: new Date().toISOString(),
            }
          : field
      )
    );
  };

  // Toggle checkbox state
  const toggleCheckbox = (id: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field._id === id && field.fieldType === "checkbox"
          ? {
              ...field,
              isChecked: !field.isChecked,
              updatedAt: new Date().toISOString(),
            }
          : field
      )
    );
  };

  // ========== ZOOM MANAGEMENT ==========

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  const value = {
    // PDF state
    currentPdfFile,
    setCurrentPdfFile,
    currentDrawingSignature,
    setCurrentDrawingSignature,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isLoading,
    setIsLoading,
    
    // Zoom
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    
    // Shared field management
    fields,
    getFieldsForPage,
    updateSignaturePosition,
    updateSignatureSize,
    updateFieldName,
    removeField,
    resetFields,
    
    // Template functions
    addTemplateSignatureField,
    addTemplateTextFieldField,
    addTemplateDateField,
    addTemplateCheckboxField,
    
    // Document functions
    addSignatureToPage,
    addTextFieldToPage,
    addCheckboxToPage,
    addDateFieldToPage,
    updateFieldSignature,
    updateTextField,
    updateTextFormat,
    updateCheckboxSize,
    toggleCheckbox,
    
    // Template state
    isTemplate,
  };

  return (
    <FieldsContext.Provider value={value}>
      {children}
    </FieldsContext.Provider>
  );
};
