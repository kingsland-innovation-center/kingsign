import client from "@/services/FeathersClient";
import { NullableId, Params, Query } from '@feathersjs/feathers';

export interface EmailTemplate {
  _id?: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  workspaceId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EmailTemplateData = Omit<EmailTemplate, '_id'>;
export type EmailTemplatePatch = Partial<EmailTemplateData>;
export type EmailTemplateQuery = Partial<EmailTemplate>;

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
}

// Handlebars template variables available for use
export interface HandlebarsVariables {
  contact: {
    name: string;
    email: string;
    phone?: string;
  };
  document: {
    title: string;
    signUrl: string;
  };
  workspace: {
    name: string;
  };
}

export class EmailTemplatesRepository {
  private static serviceName = "email-templates";

  static async find(query: Query): Promise<PaginatedResponse<EmailTemplate>> {
    return client.service(this.serviceName).find(query);
  }

  static async get(id: string, params?: Params): Promise<EmailTemplate> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: EmailTemplateData, params?: Params): Promise<EmailTemplate> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: EmailTemplatePatch, params?: Params): Promise<EmailTemplate> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<EmailTemplate> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findByWorkspace(workspaceId: string, params?: Params): Promise<EmailTemplate[]> {
    const response = await this.find({
      query: {
        workspaceId,
        ...params?.query
      },
      ...params
    });
    return response.data;
  }

  // Get available Handlebars variables for template editor
  static getAvailableVariables(): HandlebarsVariables {
    return {
      contact: {
        name: "{{contact.name}}",
        email: "{{contact.email}}",
        phone: "{{contact.phone}}"
      },
      document: {
        title: "{{document.title}}",
        signUrl: "{{document.signUrl}}"
      },
      workspace: {
        name: "{{workspace.name}}"
      }
    };
  }

  // Get sample data for template preview
  static getSampleData(): HandlebarsVariables {
    return {
      contact: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567"
      },
      document: {
        title: "Sample Document",
        signUrl: "https://example.com/sign/sample-document"
      },
      workspace: {
        name: "Sample Workspace"
      }
    };
  }
}


