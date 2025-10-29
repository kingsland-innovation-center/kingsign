"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconCheck, IconX } from "@tabler/icons-react";

interface TextFieldCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText?: string;
  fieldName?: string;
}

const TextFieldCanvas = ({
  isOpen,
  onClose,
  onSave,
  initialText,
  fieldName,
}: TextFieldCanvasProps) => {
  const [text, setText] = useState(initialText || "");
  const isEditing = Boolean(initialText);

  useEffect(() => {
    if (isOpen) {
      setText(initialText || "");
    }
  }, [isOpen, initialText]);

  const handleSave = () => {
    if (isEditing || text.trim()) {
      onSave(text);
      onClose();
    } else if (!text.trim()) {
      console.warn("Cannot add an empty text field.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-[1000] inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-[600px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {fieldName ? `Text Field - ${fieldName}` : "Text Field"}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IconX className="w-5 h-5" />
          </Button>
        </div>

        <div className="mb-6">
          <label
            htmlFor="text-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter Text
          </label>
          <textarea
            id="text-input"
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
          >
            <IconCheck className="h-4 w-4" />
            {isEditing ? "Save Changes" : "Add to Document"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TextFieldCanvas;
