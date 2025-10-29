import client from "@/services/FeathersClient";
import { NullableId, Params, Query } from '@feathersjs/feathers';

export interface DocumentEmail {
  _id?: string;
  workspaceId: string;
  documentId: string;
  emailTemplateId: string;
  userId: string;
  contactId: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailStatus: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DocumentEmailData = Omit<DocumentEmail, '_id'>;
export type DocumentEmailPatch = Partial<DocumentEmailData>;
export type DocumentEmailQuery = Partial<DocumentEmail>;

export interface CreateDocumentEmailInput {
  workspaceId: string;
  documentId: string;
  emailTemplateId: string;
  userId: string;
  contactId: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailStatus?: string;
}

export interface SendDocumentEmailInput {
  userId: string;
  contactId: string;
  documentId: string;
  emailTemplateId: string;
  workspaceId: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
}

export interface SendDocumentEmailResponse {
  documentEmail: DocumentEmail;
  emailSent: {
    status: string;
    to: string;
    subject: string;
  };
  signUrl: string;
  compiledContent: {
    subject: string;
    html: string;
    text?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
}

export class DocumentEmailsRepository {
  private static serviceName = "document-emails";

  static async find(query: Query): Promise<PaginatedResponse<DocumentEmail>> {
    return client.service(this.serviceName).find(query);
  }

  static async get(id: string, params?: Params): Promise<DocumentEmail> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: DocumentEmailData, params?: Params): Promise<DocumentEmail> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: DocumentEmailPatch, params?: Params): Promise<DocumentEmail> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<DocumentEmail> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findByWorkspace(workspaceId: string, params?: Params): Promise<DocumentEmail[]> {
    const response = await this.find({
      query: {
        workspaceId,
        ...params?.query
      },
      ...params
    });
    return response.data;
  }

  static async findByDocument(documentId: string, params?: Params): Promise<DocumentEmail[]> {
    const response = await this.find({
      query: {
        documentId,
        ...params?.query
      },
      ...params
    });
    return response.data;
  }

  static async findByContact(contactId: string, params?: Params): Promise<DocumentEmail[]> {
    const response = await this.find({
      query: {
        contactId,
        ...params?.query
      },
      ...params
    });
    return response.data;
  }

  // Send document email using the backend service method
  static async sendDocumentEmail(data: SendDocumentEmailInput): Promise<SendDocumentEmailResponse> {
    return client.service(this.serviceName).create(data);
  }

  // Send emails to multiple contacts
  static async sendDocumentEmailToMultipleContacts(
    data: Omit<SendDocumentEmailInput, 'contactId'> & { contactIds: string[] }
  ): Promise<SendDocumentEmailResponse[]> {
    const { contactIds, ...baseData } = data;
    
    const promises = contactIds.map(contactId => 
      this.sendDocumentEmail({
        ...baseData,
        contactId
      })
    );

    return Promise.all(promises);
  }
}
