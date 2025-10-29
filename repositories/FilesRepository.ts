import client from '@/services/FeathersClient';
import { Query } from '@feathersjs/feathers';

export interface FileData {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileExtension: string;
  workspaceId: string;
  accountId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateFileDTO {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileExtension: string;
  workspaceId: string;
  accountId: string;
}

export interface UpdateFileDTO {
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileExtension?: string;
  workspaceId?: string;
  accountId?: string;
}

export interface File {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileExtension: string;
  workspaceId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileInput {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileExtension: string;
  workspaceId: string;
  accountId: string;
}

export interface UpdateFileInput {
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileExtension?: string;
}

export class FilesRepository {
  private service = client.service('files');

  async find(params?: Query) {
    return this.service.find(params);
  }

  async get(id: string, params?: Query) {
    return this.service.get(id, params);
  }

  async create(data: CreateFileDTO, params?: Query) {
    return this.service.create(data, params);
  }

  async update(id: string, data: UpdateFileDTO, params?: Query) {
    return this.service.update(id, data, params);
  }

  async patch(id: string, data: UpdateFileDTO, params?: Query) {
    return this.service.patch(id, data, params);
  }

  async remove(id: string, params?: Query) {
    return this.service.remove(id, params);
  }
}

export const filesRepository = new FilesRepository(); 