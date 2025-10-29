import client from '@/services/FeathersClient';
import { Query } from '@feathersjs/feathers';

export interface Tag {
  _id: string;
  name: string;
  color: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagData {
  name: string;
  color: string;
  workspaceId: string;
}

export interface TagPatch {
  name?: string;
  color?: string;
  workspaceId?: string;
}

class TagsRepository {
  private service = client.service('tags');

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: TagData) {
    return this.service.create(data);
  }

  async patch(id: string, data: TagPatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}

export const tagsRepository = new TagsRepository();
