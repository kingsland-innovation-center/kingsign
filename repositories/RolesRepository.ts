import client from "@/services/FeathersClient";
import { Id, NullableId, Params } from '@feathersjs/feathers';

export interface Role {
  _id?: Id;
  workspaceId: Id;
  name: string;
  isDefault: boolean;
  canCreate: boolean;
  canSign: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleData = Omit<Role, '_id'>;
export type RolePatch = Partial<RoleData>;
export type RoleQuery = Partial<Role>;

export class RolesRepository {
  private static serviceName = "roles";

  static async find(params?: Params & { query?: RoleQuery }): Promise<Role[]> {
    return client.service(this.serviceName).find(params);
  }

  static async get(id: Id, params?: Params): Promise<Role> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: RoleData, params?: Params): Promise<Role> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: RolePatch, params?: Params): Promise<Role> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<Role> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findWorkspaceRoles(workspaceId: Id, params?: Params): Promise<Role[]> {
    return client.service(this.serviceName).find({
      ...params,
      query: {
        workspaceId,
        ...params?.query,
      },
    });
  }
} 