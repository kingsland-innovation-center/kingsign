import client from "@/services/FeathersClient";
import axiosClient from "@/services/Axios";
import { NullableId, Params, Query } from '@feathersjs/feathers';

export interface Workspace {
  _id?: string;
  name: string;
  creatorUserId: string;
  apiKey: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WorkspaceData = Omit<Workspace, '_id'>;
export type WorkspacePatch = Partial<WorkspaceData>;
export type WorkspaceQuery = Partial<Workspace>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
}

export class WorkspaceRepository {
  private static serviceName = "workspaces";

  static async find(query: Query): Promise<PaginatedResponse<Workspace>> {
    return client.service(this.serviceName).find(query);
  }

  static async get(id: string, params?: Params): Promise<Workspace> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: WorkspaceData, params?: Params): Promise<Workspace> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: WorkspacePatch, params?: Params): Promise<Workspace> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<Workspace> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findUserWorkspaces(params?: Params): Promise<Workspace[]> {
    const response = await axiosClient.post<Workspace[]>('/workspaces/user-workspaces');
    return response.data;
  }

  static async generateApiKey(workspaceId: string): Promise<Workspace> {
    const response = await axiosClient.post<Workspace>(`/workspaces/generate-api-key`, {
      workspaceId
    });
    return response.data;
  }
} 