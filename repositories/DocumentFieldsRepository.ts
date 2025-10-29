import client from "@/services/FeathersClient";
import { Query } from "@feathersjs/feathers";
import axiosClient from "@/services/Axios";

export interface DocumentField {
  _id: string;
  documentId: string;
  fieldId: string;
  value: string | boolean | null;
  fileId?: string;
  contactId?: string | null;
  isSigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFieldData {
  documentId: string;
  fieldId: string;
  value?: string | boolean | null;
  fileId?: string;
  contactId?: string | null;
  isSigned?: boolean;
}

export interface DocumentFieldPatch {
  value?: string | boolean | null;
  fileId?: string;
  contactId?: string | null;
  isSigned?: boolean;
}

export interface BatchSignRequest {
  documentId: string;
  contactId: string;
}

export interface BatchSignResponse {
  success: boolean;
  message: string;
  signedFieldsCount: number;
}

class DocumentFieldsRepository {
  private service = client.service("document-fields");
  private baseUrl = "/document-fields"; // Base URL for document fields endpoints

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: DocumentFieldData) {
    return this.service.create(data);
  }

  async patch(id: string, data: DocumentFieldPatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }

  async findByDocumentId(documentId: string) {
    return this.service.find({
      query: {
        documentId: documentId,
      },
    });
  }

  async removeByDocumentId(documentId: string) {
    const fields = await this.findByDocumentId(documentId);
    const removePromises = fields.map((field: DocumentField) =>
      this.remove(field._id)
    );
    await Promise.all(removePromises);
    return true;
  }

  async batchSignDocumentFields(data: BatchSignRequest): Promise<BatchSignResponse> {
    const response = await axiosClient.post<BatchSignResponse>(
      `${this.baseUrl}/batch-sign`,
      data
    );
    return response.data;
  }
}

export const documentFieldsRepository = new DocumentFieldsRepository();
