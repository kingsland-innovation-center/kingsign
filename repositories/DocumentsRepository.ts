import client from '@/services/FeathersClient';
import { Query } from '@feathersjs/feathers';
import { Template } from './TemplatesRepository';

export enum DocumentStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  COMPLETED = 'completed'
}

export interface Document {
  _id: string;
  title: string;
  note: string;
  templateId?: string;
  fileId: string;
  assignedAccountId?: string;
  creatorAccountId: string;
  status: DocumentStatus;
  workspaceId: string;
  tagIds?: string[];
  createdAt: string;
  updatedAt: string;
  template: Template;
}

export interface DocumentData {
  title: string;
  note: string;
  templateId?: string;
  fileId: string;
  assignedAccountId?: string;
  creatorAccountId: string;
  status?: DocumentStatus;
  workspaceId?: string;
  tagIds?: string[];
}

export interface DocumentPatch {
  title?: string;
  note?: string;
  templateId?: string;
  fileId?: string;
  assignedAccountId?: string;
  status?: DocumentStatus;
  archived?: boolean;
  workspaceId?: string;
  tagIds?: string[];
}

class DocumentsRepository {
  private service = client.service('documents');

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: DocumentData) {
    return this.service.create(data);
  }

  async patch(id: string, data: DocumentPatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}

export const documentsRepository = new DocumentsRepository(); 