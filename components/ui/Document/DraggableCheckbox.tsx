"use client";

import "react-resizable/css/styles.css";

import React, { useRef } from "react";

import { useDraggable } from "@dnd-kit/core";
import { IconCheck, IconTextSize, IconTrash } from "@tabler/icons-react";

export interface DraggableCheckboxProps {
  id: string;
  isChecked: boolean;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
  onSizeChange?: (id: string, size: number) => void;
  size?: number; // Size factor (percentage)
  allowEdit?: boolean;
  isSigned?: boolean;
  fieldName?: string;
  contactName?: string;
}

export function DraggableCheckbox({
  id,
  isChecked,
  position,
  width = 24,
  height = 24,
  onDelete,
  onToggle,
  onSizeChange,
  size = 100, // 100% is default size
  allowEdit = true,
  isSigned = false,
  fieldName,
  contactName,
}: DraggableCheckboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    disabled: !allowEdit,
  });

  const style = {
    position: "absolute",
    top: 0,
    left: 0,
    transform: transform
      ? `translate3d(${transform.x + position.x}px, ${
          transform.y + position.y
        }px, 0)`
      : `translate3d(${position.x}px, ${position.y}px, 0)`,
    zIndex: 100,
    pointerEvents: "auto",
    transition: "transform 0.1s ease-out",
    width: `${width}px`,
    height: `${height}px`,
  };

  // Calculate the actual size based on size factor
  const scaleFactor = size / 100;

  // Simplified event handlers for dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    document.body.style.userSelect = "none";

    // Prevent PDF page from scrolling during drag
    const container = document.querySelector(".overflow-y-auto");
    if (container) {
      container.classList.remove("overflow-y-auto");
      container.classList.add("overflow-hidden");
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle(id);
    }
  };

  // Handle size change
  const handleSizeChange = (increase: boolean) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSizeChange) {
      const newSize = increase
        ? Math.min(200, size + 20)
        : Math.max(60, size - 20);
      onSizeChange(id, newSize);
    }
  };

  // Create drag listeners that are conditional on allowEdit
  const conditionalDragListeners = allowEdit ? listeners : {};

  return (
    <div
      ref={(node) => {
        // Set both refs
        setNodeRef(node);
        if (node) containerRef.current = node;
      }}
      style={style as React.CSSProperties}
      className="touch-none group"
      onMouseDown={allowEdit ? handleDragStart : undefined}
      onTouchStart={allowEdit ? handleDragStart : undefined}
      data-draggable={allowEdit}
      data-field-id={id}
      {...(allowEdit ? attributes : {})}
      {...conditionalDragListeners}
    >
      <div className={`absolute inset-0 border-2 border-dashed ${isSigned ? 'border-green-500 bg-green-100/40' : 'border-blue-500 bg-blue-100/40'} transition-colors -m-1 shadow-sm`}></div>

      {/* Field name and contact label */}
      {(fieldName || contactName) && (
        <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow-sm z-20 whitespace-nowrap">
          {fieldName}
          {contactName && (
            <span className="ml-1 text-blue-200">• {contactName}</span>
          )}
        </div>
      )}

      {/* Checkbox */}
      <div
        className="relative w-full h-full flex items-center justify-center cursor-pointer p-1"
        onClick={handleToggle}
        style={{ transform: `scale(${scaleFactor})` }}
      >
        <div
          className={`w-full h-full flex items-center justify-center rounded-sm border border-gray-400 bg-transparent`}
        >
          {isChecked && (
            <IconCheck
              size={Math.min(width, height) * 0.6}
              className="text-black"
            />
          )}
        </div>
      </div>

      {/* Size and Delete controls */}
      {allowEdit && (
        <div className="absolute -top-7 -right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex bg-white shadow-md rounded-md border border-gray-200">
            <button
              className="p-1 text-gray-700 hover:bg-gray-100"
              onClick={handleSizeChange(false)}
              title="Decrease size"
            >
              <IconTextSize size={16} style={{ transform: "scale(0.8)" }} />
            </button>
            <button
              className="p-1 text-gray-700 hover:bg-gray-100"
              onClick={handleSizeChange(true)}
              title="Increase size"
            >
              <IconTextSize size={16} />
            </button>
            <div className="w-px h-6 my-auto bg-gray-300"></div>
            <button
              className="p-1 text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title="Delete"
            >
              <IconTrash size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
