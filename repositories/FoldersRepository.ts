import client from '@/services/FeathersClient';
import { Query } from '@feathersjs/feathers';
import { Tag } from './TagsRepository';

export enum FolderFilterType {
  DOCUMENTS = 'documents',
  TEMPLATES = 'templates'
}

export interface Folder {
  _id: string;
  name: string;
  description?: string;
  tagIds: string[];
  filterType: FolderFilterType;
  workspaceId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface FolderData {
  name: string;
  description?: string;
  tagIds: string[];
  filterType: FolderFilterType;
  workspaceId: string;
  accountId: string;
}

export interface FolderPatch {
  name?: string;
  description?: string;
  tagIds?: string[];
  filterType?: FolderFilterType;
  workspaceId?: string;
  accountId?: string;
}

class FoldersRepository {
  private service = client.service('folders');

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: FolderData) {
    return this.service.create(data);
  }

  async patch(id: string, data: FolderPatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}

export const foldersRepository = new FoldersRepository();
