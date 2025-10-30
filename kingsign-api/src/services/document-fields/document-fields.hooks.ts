import { authenticate } from '@feathersjs/authentication';
import { HooksObject, HookContext } from '@feathersjs/feathers';
import { NotificationType } from '../../models/notification-integrations.model';
import { WebhookNotificationService } from '../../utils/webhook-notifications';

export default {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [
      // Trigger webhook notification when document field is updated
      async (context: HookContext) => {
        try {
          const { app, result } = context;
          
          // Only trigger if the field was signed (isSigned changed to true)
          if (result && result.isSigned) {
            const webhookService = new WebhookNotificationService(app);
            
            // Send document updated notification
            await webhookService.sendWebhookNotifications(
              NotificationType.DOCUMENT_UPDATED,
              result.documentId
            );
          }
        } catch (error) {
          // Log error but don't fail the main operation
          console.error('Error sending webhook notification on document field update:', error);
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
