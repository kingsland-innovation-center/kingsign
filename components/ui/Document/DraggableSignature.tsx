"use client";

import "react-resizable/css/styles.css";

import React, { useEffect, useRef, useState } from "react";
import { ResizableBox, ResizeCallbackData } from "react-resizable";

import { useDraggable } from "@dnd-kit/core";
import { IconResize, IconTrash } from "@tabler/icons-react";

export interface DraggableSignatureProps {
  id: string;
  signature: string | null;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  onResize?: (id: string, width: number, height: number) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  allowEdit?: boolean;
  isSigned?: boolean;
  fieldName?: string;
  contactName?: string;
}

// Custom CSS overrides for react-resizable
const resizableStyles = `
  .react-resizable {
    position: relative;
    box-sizing: border-box;
  }
  .react-resizable-handle {
    position: absolute;
    width: 32px;
    height: 32px;
    bottom: 0;
    right: 0;
    cursor: nwse-resize;
    z-index: 30;
    background-image: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .handle-se {
    cursor: nwse-resize;
    touch-action: none;
  }
  /* Override some dnd-kit styles to prevent unexpected behaviors */
  [data-draggable="false"] {
    touch-action: none;
    -webkit-user-drag: none;
    user-select: none;
  }
`;

export function DraggableSignature({
  id,
  signature,
  position,
  width = 300,
  height = 100,
  onResize,
  onDelete,
  onEdit,
  allowEdit = true,
  isSigned = false,
  fieldName,
  contactName,
}: DraggableSignatureProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState({ width, height });
  const containerRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    disabled: !allowEdit || isResizing,
  });

  // Update local state when props change
  useEffect(() => {
    // Only update if not actively resizing to prevent jumps during resize
    if (!isResizing) {
      setCurrentSize({ width, height });
    }
  }, [width, height, isResizing]);

  // Calculate aspect ratio for maintaining proportions
  const aspectRatio = width / height;

  // Use a more reliable transform calculation
  const style = {
    position: "absolute",
    top: 0,
    left: 0,
    transform: transform
      ? `translate3d(${transform.x + position.x}px, ${
          transform.y + position.y
        }px, 0)`
      : `translate3d(${position.x}px, ${position.y}px, 0)`,
    zIndex: isResizing ? 200 : 100, // Higher z-index during resize
    pointerEvents: "auto",
    transition: isResizing ? "none" : "transform 0.1s ease-out",
  };

  // Simplified event handlers for dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Skip if we're resizing
    if (isResizing) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    document.body.style.userSelect = "none";

    // Prevent PDF page from scrolling during drag
    const container = document.querySelector(".overflow-y-auto");
    if (container) {
      container.classList.remove("overflow-y-auto");
      container.classList.add("overflow-hidden");
    }
  };

  // Handle delete button click
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  // Handle resize with react-resizable
  const handleResize = (
    event: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => {
    // Important: prevent event propagation to avoid triggering drag
    event.stopPropagation();
    event.preventDefault();

    // Calculate new height maintaining aspect ratio
    const newWidth = data.size.width;
    const newHeight = newWidth / aspectRatio;

    // Update local state for immediate visual feedback
    setCurrentSize({
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    });

    // Notify parent about resize
    if (onResize) {
      onResize(id, Math.round(newWidth), Math.round(newHeight));
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.SyntheticEvent) => {
    // Critical: prevent event propagation to avoid triggering drag
    e.stopPropagation();
    e.preventDefault();

    // Set resizing state to true
    setIsResizing(true);

    // Prevent PDF page from scrolling during resize
    const container = document.querySelector(".overflow-y-auto");
    if (container) {
      container.classList.remove("overflow-y-auto");
      container.classList.add("overflow-hidden");
    }

    document.body.style.userSelect = "none";

    // Set a data attribute to help with CSS selectors
    if (containerRef.current) {
      containerRef.current.setAttribute("data-draggable", "false");
    }
  };

  // Handle resize stop
  const handleResizeStop = (e: React.SyntheticEvent) => {
    // Prevent event propagation
    e.stopPropagation();

    // Release the overflow-hidden class
    const container = document.querySelector(".overflow-hidden");
    if (container) {
      container.classList.remove("overflow-hidden");
      container.classList.add("overflow-y-auto");
    }

    document.body.style.userSelect = "";

    // Set draggability back
    if (containerRef.current) {
      containerRef.current.setAttribute("data-draggable", "true");
    }

    // Important: delay setting isResizing to false to avoid race conditions
    setTimeout(() => {
      setIsResizing(false);
    }, 10);
  };

  // Handle click for editing
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  // Create drag listeners that are conditional on not resizing and allowEdit
  const conditionalDragListeners = allowEdit && !isResizing ? listeners : {};

  // Customize the resize handle style
  const customHandle = allowEdit && (
    <div
      className={`absolute bottom-0 right-0 w-6 h-6 bg-blue-500/80 text-white rounded-tl-md
        opacity-0 group-hover:opacity-90 z-20
        flex items-center justify-center transition-opacity shadow-sm handle-se`}
    >
      <IconResize size={12} style={{ transform: "scaleX(-1)" }} />
    </div>
  );

  return (
    <>
      {/* Include custom CSS */}
      <style jsx global>
        {resizableStyles}
      </style>

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
        onClick={allowEdit ? handleEdit : undefined}
        data-draggable={allowEdit && !isResizing}
        data-field-id={id}
        {...(allowEdit && !isResizing ? attributes : {})}
        {...conditionalDragListeners}
      >
        {allowEdit ? (
          <ResizableBox
            width={currentSize.width}
            height={currentSize.height}
            minConstraints={[100, 33]}
            maxConstraints={[500, 167]}
            resizeHandles={["se"]}
            handle={customHandle}
            onResize={handleResize}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            axis="x"
            className="relative"
            draggableOpts={{
              enableUserSelectHack: true,
              preventDefault: true,
            }}
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

            {signature && (
              <img
                src={signature}
                alt="Signature"
                style={{ width: "100%", height: "100%" }}
                className="relative z-10"
                draggable={false}
              />
            )}

            {allowEdit && (
              <div className="absolute -top-7 -right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex bg-white shadow-md rounded-md border border-gray-200">
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

            {/* Resize tooltip - only show when actually resizing */}
            {isResizing && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-90 transition-opacity whitespace-nowrap z-20 shadow-sm text-[10px]">
                Drag to resize
              </div>
            )}
          </ResizableBox>
        ) : (
          <div
            style={{
              width: currentSize.width,
              height: currentSize.height,
              position: "relative",
            }}
            className="relative"
            onClick={handleEdit}
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
            
            {signature && (
              <img
                src={signature}
                alt="Signature"
                style={{ width: "100%", height: "100%" }}
                className="relative z-10"
                draggable={false}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
