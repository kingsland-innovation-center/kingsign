"use client";

import React from "react";
import { Field } from "@/contexts/FieldsContext";
import { Badge } from "@/components/ui/badge";
import { IconChevronRight } from "@tabler/icons-react";

interface TableOfContentsProps {
  fields: Field[];
  onFieldClick: (field: Field) => void;
  className?: string;
  currentPage?: number;
}

export function TableOfContents({ fields, onFieldClick, className = "", currentPage = 1 }: TableOfContentsProps) {
  // Filter to only show required fields
  const requiredFields = fields.filter(field => field.required);
  
  // Sort fields by page, then by y position (top to bottom)
  const sortedFields = requiredFields.sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    return a.yPosition - b.yPosition;
  });

  if (requiredFields.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">No required fields found</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Required Fields</h3>
        <p className="text-xs text-gray-500 mt-1">
          Click on any field to jump to its location
        </p>
      </div>
      
      <div className="px-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {sortedFields.map((field) => {
          const hasValue = field.value && 
            (typeof field.value === 'string' ? field.value.trim() !== '' : field.value === true);
          
          return (
            <div
              key={field._id || field.temporary_id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-white shadow-sm cursor-pointer"
              onClick={() => onFieldClick(field)}
            >
              <div className="space-y-3">
                {/* Field Type and Name Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700"
                    >
                      {field.fieldType}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900">
                      {field.fieldName}
                    </span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Field Value/Status */}
                <div className="text-xs p-2 bg-gray-50 rounded-md border">
                  {field.fieldType === "signature" && (
                    <span className={`${hasValue ? 'text-green-600' : 'text-gray-400'}`}>
                      {hasValue ? "Signature captured" : "No signature entered"}
                    </span>
                  )}
                  
                  {field.fieldType === "text" && (
                    <span className={`${hasValue ? 'text-green-600' : 'text-gray-400'}`}>
                      {hasValue ? (field.value as string) : "No text entered"}
                    </span>
                  )}
                  
                  {field.fieldType === "checkbox" && (
                    <span className={`${hasValue ? 'text-green-600' : 'text-gray-400'}`}>
                      {hasValue ? "Checked" : "Unchecked"}
                    </span>
                  )}
                  
                  {field.fieldType === "date" && (
                    <span className={`${hasValue ? 'text-green-600' : 'text-gray-400'}`}>
                      {hasValue ? (field.value as string) : "No date selected"}
                    </span>
                  )}
                </div>
                
                {/* Coordinates */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="outline" className="px-2 py-1">
                    x: {Math.round(field.xPosition)}
                  </Badge>
                  <Badge variant="outline" className="px-2 py-1">
                    y: {Math.round(field.yPosition)}
                  </Badge>
                  {field.page > 1 && (
                    <Badge variant="outline" className="px-2 py-1">
                      Page {field.page}
                    </Badge>
                  )}
                </div>
                
                {/* Completion Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {hasValue ? "Completed" : "Pending"}
                  </span>
                  {hasValue && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs bg-green-100 text-green-700">
                      ✓ Done
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {requiredFields.filter(f => f.value && 
              (typeof f.value === 'string' ? f.value.trim() !== '' : f.value === true)
            ).length} of {requiredFields.length} fields completed
          </span>
          <span className="text-gray-500">
            {Math.round((requiredFields.filter(f => f.value && 
              (typeof f.value === 'string' ? f.value.trim() !== '' : f.value === true)
            ).length / requiredFields.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
