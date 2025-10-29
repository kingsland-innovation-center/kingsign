import client from "@/services/FeathersClient";
import { Query } from "@feathersjs/feathers";

export interface Template {
  _id: string;
  name: string;
  description?: string;
  fileId: string;
  createdBy: string;
  workspaceId: string;
  tagIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateData {
  name: string;
  description?: string;
  fileId: string;
  createdBy: string;
  workspaceId: string;
  tagIds?: string[];
}

export interface TemplatePatch {
  name?: string;
  description?: string;
  fileId?: string;
  archived?: boolean;
  workspaceId?: string;
  tagIds?: string[];
}

class TemplatesRepository {
  private service = client.service("templates");

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: TemplateData) {
    return this.service.create(data);
  }

  async patch(id: string, data: TemplatePatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}

export const templatesRepository = new TemplatesRepository();
