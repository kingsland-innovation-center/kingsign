import client from "@/services/FeathersClient";
import { Query } from "@feathersjs/feathers";

export type FieldType = "signature" | "text" | "checkbox" | "date";

export interface TemplateField {
  _id: string;
  templateId: string;
  fieldType: FieldType;
  fieldName: string;
  placeholder: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  required: boolean;
  metadata: { [key: string]: number | string | boolean };
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFieldData {
  templateId: string;
  fieldType: FieldType;
  fieldName: string;
  placeholder: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  required: boolean;
  metadata?: { [key: string]: number | string | boolean };
}

export interface TemplateFieldPatch {
  fieldType?: FieldType;
  fieldName?: string;
  placeholder?: string;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  required?: boolean;
  metadata?: { [key: string]: number | string | boolean };
}

class TemplateFieldsRepository {
  private service = client.service("template-fields");

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: TemplateFieldData) {
    return this.service.create(data);
  }

  async patch(id: string, data: TemplateFieldPatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}

export const templateFieldsRepository = new TemplateFieldsRepository();
