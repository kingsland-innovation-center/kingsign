import client from "@/services/FeathersClient";
import { Id, NullableId, Params } from '@feathersjs/feathers';

export interface Account {
  _id?: Id;
  userId: Id;
  workspaceId: Id;
  roleId: Id;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AccountData = Omit<Account, '_id'>;
export type AccountPatch = Partial<AccountData>;
export type AccountQuery = Partial<Account>;

export class AccountsRepository {
  private static serviceName = "accounts";

  static async find(params?: Params & { query?: AccountQuery }): Promise<Account[]> {
    return client.service(this.serviceName).find(params);
  }

  static async get(id: Id, params?: Params): Promise<Account> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: AccountData, params?: Params): Promise<Account> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: AccountPatch, params?: Params): Promise<Account> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<Account> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findUserAccounts(userId: Id, params?: Params): Promise<Account[]> {
    return client.service(this.serviceName).find({
      ...params,
      query: {
        userId,
        ...params?.query,
      },
    });
  }

  static async findWorkspaceAccounts(workspaceId: Id, params?: Params): Promise<Account[]> {
    return client.service(this.serviceName).find({
      ...params,
      query: {
        workspaceId,
        ...params?.query,
      },
    });
  }

  static async findUserWorkspaceAccount(userId: Id, workspaceId: Id, params?: Params): Promise<Account[]> {
    return client.service(this.serviceName).find({
      ...params,
      query: {
        userId,
        workspaceId,
        ...params?.query,
      },
    });
  }
} 