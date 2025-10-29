import client from "@/services/FeathersClient";
import { Id, NullableId, Params, Query } from '@feathersjs/feathers';

export interface Contact {
  _id?: Id;
  name: string;
  email: string;
  phone?: string;
  workspaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContactData = Omit<Contact, '_id'>;
export type ContactPatch = Partial<ContactData>;
export type ContactQuery = Partial<Contact>;

export class ContactsRepository {
  private static serviceName = "contacts";

  static async find(query: any): Promise<Contact[]> {
    return client.service(this.serviceName).find(query);
  }

  static async get(id: Id, params?: Params): Promise<Contact> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: ContactData, params?: Params): Promise<Contact> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: ContactPatch, params?: Params): Promise<Contact> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<Contact> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findByEmail(email: string, params?: Params): Promise<Contact[]> {
    return client.service(this.serviceName).find({
      ...params,
      query: {
        email: email.toLowerCase(),
        ...params?.query,
      },
    });
  }
} 