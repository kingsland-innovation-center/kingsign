import client from '@/services/FeathersClient';
import { Query } from '@feathersjs/feathers';
import { FileData } from './FilesRepository';
export interface AwsObjectStorageUploadDTO {
  file?: Buffer;
  filename?: string;
  contentType?: string;
  workspaceId?: string;
  accountId?: string;
  fileRecord?: FileData;
}

export class AwsObjectStorageRepository {
  private service = client.service('aws-object-storage');

  async upload(data: AwsObjectStorageUploadDTO, params?: Query) {
    return this.service.create(data, params);
  }
}

export const awsObjectStorageRepository = new AwsObjectStorageRepository(); 