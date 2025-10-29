"use client";

import { useRef, useState } from "react";
import SignaturePadWrapper from "react-signature-pad-wrapper";

import { Button } from "@/components/ui/button";
import {
  IconDeviceFloppy,
  IconEraser,
  IconFileCheck,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import "@fontsource/great-vibes";

interface SignatureCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  fieldName?: string;
}

const SignatureCanvas = ({
  isOpen,
  onClose,
  onSave,
  fieldName,
}: SignatureCanvasProps) => {
  const sigPadRef = useRef<SignaturePadWrapper>(null);
  const [saveSignature, setSaveSignature] = useState(true);
  const [activeTab, setActiveTab] = useState<"draw" | "upload" | "type">(
    "draw"
  );
  const [typedName, setTypedName] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleSave = () => {
    let signatureDataUrl = "";

    if (activeTab === "draw" && sigPadRef.current) {
      signatureDataUrl = sigPadRef.current.toDataURL();
    } else if (activeTab === "upload" && uploadedImage) {
      signatureDataUrl = uploadedImage;
    } else if (activeTab === "type" && typedName) {
      // Create a simple canvas with the typed name
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.font = "36px 'Great Vibes', cursive";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
        signatureDataUrl = canvas.toDataURL();
      }
    }

    if (signatureDataUrl) {
      onSave(signatureDataUrl);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-[1000] inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-[600px] p-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">
              {fieldName ? `Signature - ${fieldName}` : "Signature"}
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
          <div className="flex gap-4 text-sm">
            <button
              className={`pb-2 ${
                activeTab === "draw"
                  ? "border-b-2 border-blue-600 font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("draw")}
            >
              Draw
            </button>
            <button
              className={`pb-2 ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Upload image
            </button>
            <button
              className={`pb-2 ${
                activeTab === "type"
                  ? "border-b-2 border-blue-600 font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("type")}
            >
              Type
            </button>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 mb-4 h-[200px] w-full">
          {activeTab === "draw" && (
            <>
              <SignaturePadWrapper
                ref={sigPadRef}
                canvasProps={{
                  className: "w-full h-full",
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
                Sign Here
              </div>
            </>
          )}

          {activeTab === "upload" && (
            <div className="flex flex-col items-center justify-center h-full">
              {uploadedImage ? (
                <div className="h-full w-full flex items-center justify-center">
                  <img
                    src={uploadedImage}
                    alt="Uploaded signature"
                    className="max-h-full max-w-full"
                  />
                </div>
              ) : (
                <>
                  <IconDeviceFloppy className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Drag and drop an image here, or click to select
                  </p>
                  <label className="mt-2 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {activeTab === "type" && (
            <div className="flex items-center justify-center h-full w-full">
              <input
                type="text"
                placeholder="Type your name"
                className="w-3/4 p-2 border border-gray-300 rounded text-3xl font-semibold"
                style={{ fontFamily: '"Great Vibes", cursive' }}
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={saveSignature}
              onChange={() => setSaveSignature(!saveSignature)}
            />
            <IconDeviceFloppy className="h-4 w-4 text-gray-500" />
            Save signature for future use
          </label>
        </div>

        {activeTab === "draw" && (
          <div className="flex gap-2 mb-4 items-center">
            <IconPencil className="h-4 w-4 text-gray-500 mr-1" />
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-black" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 rounded-full border-2 border-blue-600 flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 rounded-full border-2 border-red-600 flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-red-600" />
            </Button>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-4">
          {activeTab === "draw" &&
            "Use your mouse or touch screen to sign. Your signature will be added to the document."}
          {activeTab === "upload" &&
            "Upload an image of your signature to use in the document."}
          {activeTab === "type" && "Type your name to create a signature."}
        </p>

        <div className="flex justify-end gap-2">
          {activeTab === "draw" && (
            <Button
              variant="outline"
              onClick={() => sigPadRef.current?.clear()}
              className="flex items-center gap-1"
            >
              <IconEraser className="h-4 w-4" />
              Clear
            </Button>
          )}
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
          >
            <IconFileCheck className="h-4 w-4" />
            Add to Document
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
