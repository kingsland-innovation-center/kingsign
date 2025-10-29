import client from "@/services/FeathersClient";
import { NullableId, Params, Query } from '@feathersjs/feathers';

export enum NotificationType {
  DOCUMENT_COMPLETED = 'document.completed',
  DOCUMENT_UPDATED = 'document.updated'
}

export interface NotificationIntegration {
  _id?: string;
  name: string;
  url: string;
  notificationType: NotificationType;
  isEnabled: boolean;
  workspaceId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationIntegrationData = Omit<NotificationIntegration, '_id'>;
export type NotificationIntegrationPatch = Partial<NotificationIntegrationData>;
export type NotificationIntegrationQuery = Partial<NotificationIntegration>;

export interface CreateNotificationIntegrationInput {
  name: string;
  url: string;
  notificationType: NotificationType;
  isEnabled?: boolean;
}

export interface UpdateNotificationIntegrationInput {
  name?: string;
  url?: string;
  notificationType?: NotificationType;
  isEnabled?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
}

export class NotificationIntegrationsRepository {
  private static serviceName = "notification-integrations";

  static async find(query: Query): Promise<PaginatedResponse<NotificationIntegration>> {
    return client.service(this.serviceName).find(query);
  }

  static async get(id: string, params?: Params): Promise<NotificationIntegration> {
    return client.service(this.serviceName).get(id, params);
  }

  static async create(data: NotificationIntegrationData, params?: Params): Promise<NotificationIntegration> {
    return client.service(this.serviceName).create(data, params);
  }

  static async patch(id: NullableId, data: NotificationIntegrationPatch, params?: Params): Promise<NotificationIntegration> {
    return client.service(this.serviceName).patch(id, data, params);
  }

  static async remove(id: NullableId, params?: Params): Promise<NotificationIntegration> {
    return client.service(this.serviceName).remove(id, params);
  }

  static async findByWorkspace(workspaceId: string, params?: Params): Promise<NotificationIntegration[]> {
    const response = await this.find({
      query: {
        workspaceId,
        ...params?.query
      },
      ...params
    });
    return response.data;
  }
}
