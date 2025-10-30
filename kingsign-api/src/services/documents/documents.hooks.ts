import { HooksObject, HookContext } from '@feathersjs/feathers';
import { authenticate } from '@feathersjs/authentication';
import { populate } from 'feathers-hooks-common';
import { filterNotArchived } from '../../common/hooks/filterNotArchived';
import { NotificationType } from '../../models/notification-integrations.model';
import { WebhookNotificationService } from '../../utils/webhook-notifications';
import { DocumentStatus } from '../../types/enums';

export default {
  before: {
    all: [authenticate('jwt')],
    find: [filterNotArchived],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [
      populate({
        schema: {
          include: [{
            service: 'templates',
            nameAs: 'template',
            parentField: 'templateId',
            childField: '_id'
          }]
        }
      })
    ],
    get: [
      populate({
        schema: {
          include: [{
            service: 'templates',
            nameAs: 'template',
            parentField: 'templateId',
            childField: '_id'
          }]
        }
      })
    ],
    create: [],
    update: [],
    patch: [
      // Trigger webhook notification when document status changes to completed
      async (context: HookContext) => {
        try {
          const { app, result, data } = context;
          
          // Check if status was updated to 'signed' or 'completed'
          if (result && data && (data.status === DocumentStatus.SIGNED || data.status === DocumentStatus.COMPLETED)) {
            const webhookService = new WebhookNotificationService(app);
            
            // Send document completed notification
            await webhookService.sendWebhookNotifications(
              NotificationType.DOCUMENT_COMPLETED,
              result._id
            );
          }
        } catch (error) {
          // Log error but don't fail the main operation
          console.error('Error sending webhook notification on document completion:', error);
        }
        
        return context;
      }
    ],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
