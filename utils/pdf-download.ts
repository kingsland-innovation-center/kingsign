import { saveAs } from "file-saver";
import { PDFDocument, rgb } from "pdf-lib";
import { Field } from "@/contexts/FieldsContext";
import { Contact } from "@/repositories/ContactsRepository";
import { SignatureFootprint } from "@/repositories/SignatureFootprintRepository";
import { DocumentField } from "@/repositories/DocumentFieldsRepository";

export interface DownloadOptions {
  currentPdfFile: string | null;
  fields: Field[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  documentTitle?: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  // Optional certificate of signature data
  contacts?: Contact[];
  signatureFootprints?: SignatureFootprint[];
  includeCertificate?: boolean;
  documentFields?: DocumentField[];
}

// Helper function to create certificate of signature page
const createCertificatePage = async (
  pdfDoc: PDFDocument,
  contact: Contact,
  signatureFootprint: SignatureFootprint,
  signatureFields: Field[],
  documentTitle: string
) => {
  const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
  const { width, height } = page.getSize();
  
  // Load fonts
  const helvetica = await pdfDoc.embedFont("Helvetica");
  const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold");
  
  // Certificate title
  page.drawText("CERTIFICATE OF SIGNATURE", {
    x: width / 2 - 120,
    y: height - 80,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Document information
  page.drawText("Document Information:", {
    x: 50,
    y: height - 140,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Document Title: ${documentTitle}`, {
    x: 50,
    y: height - 165,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Certificate Date: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, {
    x: 50,
    y: height - 185,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  // Signer information
  page.drawText("Signer Information:", {
    x: 50,
    y: height - 230,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Name: ${contact.name}`, {
    x: 50,
    y: height - 255,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Email: ${contact.email}`, {
    x: 50,
    y: height - 275,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  if (contact.phone) {
    page.drawText(`Phone: ${contact.phone}`, {
      x: 50,
      y: height - 295,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }
  
  // Digital signature verification
  page.drawText("Digital Signature Verification:", {
    x: 50,
    y: height - 340,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`IP Address: ${signatureFootprint.ipAddress}`, {
    x: 50,
    y: height - 365,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  if (signatureFootprint.forwardedIp) {
    page.drawText(`Forwarded IP: ${signatureFootprint.forwardedIp}`, {
      x: 50,
      y: height - 385,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }
  
  if (signatureFootprint.realIp) {
    page.drawText(`Real IP: ${signatureFootprint.realIp}`, {
      x: 50,
      y: height - 405,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
  }
  
  page.drawText(`User Agent: ${signatureFootprint.userAgent}`, {
    x: 50,
    y: height - 425,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Signature Timestamp: ${new Date(signatureFootprint.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })}`, {
    x: 50,
    y: height - 445,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  // Signature image preview
  const signatureField = signatureFields.find(field => 
    field.fieldType === "signature" && field.value
  );
  
  if (signatureField && signatureField.value) {
    page.drawText("Signature Image:", {
      x: 50,
      y: height - 490,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    try {
      // Process signature data
      let signatureData = signatureField.value as string;
      if (!signatureData.includes(",")) {
        signatureData = `data:image/png;base64,${signatureData}`;
      }
      
      // Extract the base64 data from the signature image string
      const base64Data = signatureData.split(",")[1];
      if (base64Data) {
        // Convert base64 to binary
        const signatureBytes = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0)
        );
        
        // Embed the signature image
        const embeddedImage = await pdfDoc.embedPng(signatureBytes);
        
        // Draw the signature image (scaled down for certificate)
        const imageWidth = 200;
        const imageHeight = (embeddedImage.height * imageWidth) / embeddedImage.width;
        
        page.drawImage(embeddedImage, {
          x: 50,
          y: height - 490 - imageHeight - 20,
          width: imageWidth,
          height: imageHeight,
        });
      }
    } catch (error) {
      console.error("Error embedding signature image in certificate:", error);
      page.drawText("Signature image could not be embedded", {
        x: 50,
        y: height - 520,
        size: 10,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
  }
  
  // Legal disclaimer
  page.drawText("Legal Disclaimer:", {
    x: 50,
    y: height - 650,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText("This certificate verifies that the above-named individual has electronically signed the referenced document. The signature was captured using secure digital signature technology and includes verification of the signer's IP address, device information, and timestamp. This certificate serves as proof of signature for legal and compliance purposes.", {
    x: 50,
    y: height - 675,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
    maxWidth: width - 100,
    lineHeight: 14,
  });
  
  // Certificate ID - using signature footprint ID for better traceability
  const certificateId = signatureFootprint._id;
  page.drawText(`Certificate ID: ${certificateId}`, {
    x: 50,
    y: 50,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return certificateId;
};

export const downloadSignedPDF = async (options: DownloadOptions): Promise<void> => {
  const {
    currentPdfFile,
    fields,
    containerRef,
    documentTitle = "signed_document",
    onError,
    onSuccess,
    contacts = [],
    signatureFootprints = [],
    includeCertificate = false,
    documentFields = []
  } = options;

  try {
    if (!currentPdfFile) {
      const errorMsg = "No file URL available";
      console.error(errorMsg);
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    const existingPdfBytes = await fetch(currentPdfFile).then((res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch PDF: ${res.status} ${res.statusText}`
        );
      return res.arrayBuffer();
    });

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      const errorMsg = "PDF has no pages";
      console.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Get the PDF container for scaling calculations
    const pdfContainer = containerRef.current;
    const pdfElement = pdfContainer?.querySelector(".react-pdf__Page");

    if (!pdfContainer || !pdfElement) {
      const errorMsg = "Could not find PDF elements";
      console.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Get the rendered dimensions of the PDF container
    const pdfRect = pdfElement.getBoundingClientRect();

    // Process each field
    for (const field of fields) {
      // Get the page (adjust for 0-based indexing)
      const pageIndex = field.page - 1;
      if (pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Scale factors
      const scaleX = width / pdfRect.width;
      const scaleY = height / pdfRect.height;

      // Calculate position in PDF coordinates
      const previewWidth = field.width;
      const previewHeight = field.height;

      const pdfX = field.xPosition * scaleX;
      const pdfY =
        height - field.yPosition * scaleY - previewHeight * scaleY;

      if (field.fieldType === "signature" && field.value) {
        // Process signature data
        let signatureData = field.value as string;
        if (!signatureData.includes(",")) {
          signatureData = `data:image/png;base64,${signatureData}`;
        }

        // Extract the base64 data from the signature image string
        const base64Data = signatureData.split(",")[1];
        if (!base64Data) {
          console.error("Invalid signature data format");
          continue;
        }

        // Convert base64 to binary
        const signatureBytes = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0)
        );

        // Embed the signature image
        const embeddedImage = await pdfDoc.embedPng(signatureBytes);

        // Draw the signature on this page
        page.drawImage(embeddedImage, {
          x: pdfX,
          y: pdfY,
          width: previewWidth * scaleX,
          height: previewHeight * scaleY,
        });

        console.log(
          `Added signature to page ${
            field.page
          } at position (${pdfX}, ${pdfY}) with size ${
            previewWidth * scaleX
          }x${previewHeight * scaleY}`
        );
      } else if (field.fieldType === "text" && field.value) {
        // Add text to the PDF with formatting
        page.drawText(field.value as string, {
          x: pdfX + 8,
          y: pdfY + (previewHeight * scaleY) / 2 - 4,
          size: (field.fontSize || 12) * scaleY, // Scale font size with formatting
          color: rgb(0, 0, 0),
          font: field.isBold
            ? field.isItalic
              ? await pdfDoc.embedFont("Helvetica-BoldOblique")
              : await pdfDoc.embedFont("Helvetica-Bold")
            : field.isItalic
              ? await pdfDoc.embedFont("Helvetica-Oblique")
              : await pdfDoc.embedFont("Helvetica"),
        });

        console.log(
          `Added text to page ${field.page} at position (${pdfX}, ${pdfY})`
        );
      } else if (field.fieldType === "checkbox") {
        // Draw a checkbox
        const boxSize = Math.min(field.width, field.height);
        const sizeScale = (field.checkboxSize || 100) / 100; // Size scaling factor

        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: boxSize * scaleX * sizeScale,
          height: boxSize * scaleY * sizeScale,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1.5 * scaleX,
          color: rgb(1, 1, 1),
          opacity: 0,
        });

        // Only add the checkmark if checked
        if (field.isChecked) {
          const boxWidth = boxSize * scaleX * sizeScale;
          const boxHeight = boxSize * scaleY * sizeScale;

          page.drawLine({
            start: { x: pdfX + boxWidth * 0.3, y: pdfY + boxHeight * 0.5 },
            end: { x: pdfX + boxWidth * 0.45, y: pdfY + boxHeight * 0.3 },
            thickness: 2 * scaleX,
            color: rgb(0, 0, 0),
          });

          page.drawLine({
            start: { x: pdfX + boxWidth * 0.45, y: pdfY + boxHeight * 0.3 },
            end: { x: pdfX + boxWidth * 0.75, y: pdfY + boxHeight * 0.7 },
            thickness: 2 * scaleX,
            color: rgb(0, 0, 0),
          });
        }

        console.log(
          `Added checkbox to page ${field.page} at position (${pdfX}, ${pdfY})`
        );
      } else if (field.fieldType === "date") {
        // Format the date as MM/DD/YYYY or use current date if not set
        const dateValue =
          (field.value as string) || new Date().toLocaleDateString("en-US");

        // Add date to the PDF
        page.drawText(dateValue, {
          x: pdfX + 8,
          y: pdfY + (previewHeight * scaleY) / 2 - 4,
          size: (field.fontSize || 12) * scaleY,
          color: rgb(0, 0, 0),
          font: await pdfDoc.embedFont("Helvetica"),
        });

        console.log(
          `Added date field to page ${field.page} at position (${pdfX}, ${pdfY})`
        );
      }
    }

    // Add certificate pages if requested and data is available
    if (includeCertificate && contacts.length > 0 && signatureFootprints.length > 0) {
      console.log("Adding certificate of signature pages...");
      
      // Create a map of contactId to contact for quick lookup
      const contactMap = new Map(contacts.map(contact => [contact._id, contact]));
      
      // Process each signature footprint and create certificate page
      for (const footprint of signatureFootprints) {
        const contact = contactMap.get(footprint.contactId);
        if (contact) {
          // Get signature fields for this contact
          const contactSignatureFields = fields.filter(field => 
            field.fieldType === "signature" && 
            field.value && 
            documentFields.some(docField => 
              docField.contactId === footprint.contactId && 
              docField.fieldId === field._id
            )
          );
          
          try {
            const certificateId = await createCertificatePage(
              pdfDoc,
              contact,
              footprint,
              contactSignatureFields,
              documentTitle
            );
            
            console.log(`Created certificate page for ${contact.name} with ID: ${certificateId}`);
          } catch (error) {
            console.error(`Error creating certificate page for ${contact.name}:`, error);
          }
        }
      }
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Create a blob and download
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${documentTitle}_${timestamp}.pdf`;
    
    saveAs(blob, filename);

    console.log("PDF successfully signed with all fields!");
    onSuccess?.();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error signing PDF:", error);
    onError?.(errorMsg);
    throw error;
  }
}; 