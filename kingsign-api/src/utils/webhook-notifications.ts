import { Application } from '../declarations';
import { NotificationType } from '../models/notification-integrations.model';
import axios from 'axios';
import logger from '../logger';

interface WebhookPayload {
  type: NotificationType;
  document: {
    _id: string;
    title: string;
    status: string;
    note?: string;
    workspaceId: string;
    templateId: string;
    fileId: string;
    createdAt: Date;
    updatedAt: Date;
    documentFields: Array<{
      _id: string;
      documentId: string;
      fieldId: string;
      contactId: string;
      value?: any;
      isSigned: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  timestamp: string;
  webhookId: string;
}

export class WebhookNotificationService {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Get document data with fields in the same format as getDocuments from api.class.ts
   */
  async getDocumentWithFields(documentId: string): Promise<any> {
    const documentService = this.app.service('documents');
    const documentFieldService = this.app.service('document-fields');

    // Get the document
    const document = await documentService.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Get document fields for this document
    const documentFields = await documentFieldService.find({
      paginate: false,
      query: {
        documentId: documentId
      }
    });

    return {
      ...document,
      documentFields: documentFields || []
    };
  }

  /**
   * Send webhook notifications for a specific notification type
   */
  async sendWebhookNotifications(
    notificationType: NotificationType,
    documentId: string
  ): Promise<void> {
    try {
      // Get document with fields
      const documentWithFields = await this.getDocumentWithFields(documentId);
      
      // Find enabled notification integrations for this workspace and notification type
      const notificationIntegrationsService = this.app.service('notification-integrations');
      const integrations = await notificationIntegrationsService.find({
        paginate: false,
        query: {
          workspaceId: documentWithFields.workspaceId,
          notificationType: notificationType,
          isEnabled: true
        }
      });

      if (!integrations || integrations.length === 0) {
        logger.info(`No enabled integrations found for ${notificationType} in workspace ${documentWithFields.workspaceId}`);
        return;
      }

      // Send webhooks to all enabled integrations
      const webhookPromises = integrations.map((integration: any) => 
        this.sendWebhook(integration, notificationType, documentWithFields)
      );

      await Promise.allSettled(webhookPromises);

    } catch (error) {
      logger.error('Error sending webhook notifications:', error);
    }
  }

  /**
   * Send individual webhook to an integration
   */
  private async sendWebhook(
    integration: any,
    notificationType: NotificationType,
    documentWithFields: any
  ): Promise<void> {
    try {
      const payload: WebhookPayload = {
        type: notificationType,
        document: {
          _id: documentWithFields._id,
          title: documentWithFields.title,
          status: documentWithFields.status,
          note: documentWithFields.note,
          workspaceId: documentWithFields.workspaceId,
          templateId: documentWithFields.templateId,
          fileId: documentWithFields.fileId,
          createdAt: documentWithFields.createdAt,
          updatedAt: documentWithFields.updatedAt,
          documentFields: documentWithFields.documentFields
        },
        timestamp: new Date().toISOString(),
        webhookId: integration._id
      };

      const response = await axios.post(integration.url, payload, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Kingsign-Webhook/1.0',
          'X-Webhook-Type': notificationType,
          'X-Webhook-Source': 'kingsign'
        }
      });

      logger.info(`Webhook sent successfully to ${integration.name} (${integration.url}), status: ${response.status}`);

    } catch (error: any) {
      logger.error(`Failed to send webhook to ${integration.name} (${integration.url}):`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
}

/**
 * Initialize webhook notification service
 */
export function initializeWebhookService(app: Application): WebhookNotificationService {
  return new WebhookNotificationService(app);
}
