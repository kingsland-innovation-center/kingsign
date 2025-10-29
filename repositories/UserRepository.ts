import client from "@/services/FeathersClient";
export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  resetPasswordToken: string | null;
  confirmationToken: string | null;
  currentWorkspaceId: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  [key: string]: unknown;
}

export interface Query {
  $limit?: number;
  $skip?: number;
  $sort?: { [key: string]: 1 | -1 };
  [key: string]: unknown;
}

export interface ServiceEvent {
  id: string;
  type: string;
  data: unknown;
  [key: string]: unknown;
}

export class UserRepository {
  private static serviceName = "users";

  static async create(data: Partial<User>, params: Query = {}): Promise<User> {
    return await client.service(this.serviceName).create(data, params);
  }

  static async find(params: Query = {}): Promise<User[]> {
    return await client.service(this.serviceName).find(params);
  }

  static async get(id: string, params: Query = {}): Promise<User> {
    return await client.service(this.serviceName).get(id, params);
  }

  static async update(id: string, data: Partial<User>, params: Query = {}): Promise<User> {
    return await client.service(this.serviceName).update(id, data, params);
  }

  static async patch(id: string, data: Partial<User>, params: Query = {}): Promise<User> {
    return await client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: string, params: Query = {}): Promise<User> {
    return await client.service(this.serviceName).remove(id, params);
  }

  static async subscribe(eventType: string, callback: (data: ServiceEvent) => void): Promise<void> {
    await client.service(this.serviceName).on(eventType, callback);
  }

  static async unsubscribe(eventType: string, callback: (data: ServiceEvent) => void): Promise<void> {
    await client.service(this.serviceName).off(eventType, callback);
  }
}
