// Initializes the `document-fields` service on path `/document-fields`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { DocumentFields } from './document-fields.class';
import createModel from '../../models/document-fields.model';
import hooks from './document-fields.hooks';
import { Request, Response } from 'express';
import { authenticate } from '@feathersjs/express';
import logger from '../../logger';
import { WebhookNotificationService } from '../../utils/webhook-notifications';
import { NotificationType } from '../../models/notification-integrations.model';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'document-fields': DocumentFields & ServiceAddons<any>;
  }
}

interface BatchSignRequestBody {
  documentId: string;
  contactId: string;
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/document-fields', new DocumentFields(options, app));

  // Add custom endpoint for batch signing document fields
  app.post('/document-fields/batch-sign', 
    authenticate('jwt'),
    async (req: Request, res: Response) => {
      try {
        const { documentId, contactId } = req.body as BatchSignRequestBody;

        if (!documentId || !contactId) {
          return res.status(400).json({
            success: false,
            message: 'documentId and contactId are required'
          });
        }

        const documentFieldsService = app.service('document-fields');
        const documentsService = app.service('documents');
        const signatureFootprintService = app.service('signature-footprints');
        
        // Check if signature footprint already exists for this document and contact
        const existingFootprint = await signatureFootprintService.find({
          query: {
            documentId,
            contactId,
            $limit: 1
          }
        });

        if (existingFootprint.data && existingFootprint.data.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Document has already been signed by this contact',
            code: 'ALREADY_SIGNED'
          });
        }
        
        // Find all document fields for this document and contact
        const fields = await documentFieldsService.find({
          query: {
            documentId,
            contactId,
            $limit: 100 // Add a reasonable limit
          }
        });

        if (!fields.data || fields.data.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No fields found for the given document and contact'
          });
        }

        // Update all fields to be signed
        const updatePromises = fields.data.map((field: any) =>
          documentFieldsService.patch(field._id, {
            isSigned: true
          })
        );

        const result = await Promise.all(updatePromises);
        console.log(result);

        // Check if all document fields are signed
        const allDocumentFields = await documentFieldsService.find({
          query: {
            documentId,
            $limit: 100
          }
        });

        const allFieldsSigned = allDocumentFields.data.every((field: any) => field.isSigned);

        // If all fields are signed, update document status and send webhook
        if (allFieldsSigned) {
          await documentsService.patch(documentId, {
            status: 'signed'
          });

          // Send webhook notification for document completion
          try {
            const webhookService = new WebhookNotificationService(app);
            await webhookService.sendWebhookNotifications(
              NotificationType.DOCUMENT_COMPLETED,
              documentId
            );
          } catch (error) {
            logger.error('Error sending webhook notification on document completion:', error);
          }
        }

        // Create signature footprint for audit trail
        const signatureFootprintData = {
          documentId,
          contactId,
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          forwardedIp: req.headers['x-forwarded-for'] as string,
          realIp: req.headers['x-real-ip'] as string,
          userAgent: req.headers['user-agent'] || 'unknown',
          requestHeaders: {
            referer: req.headers['referer'] as string,
            origin: req.headers['origin'] as string,
            acceptLanguage: req.headers['accept-language'] as string,
            acceptEncoding: req.headers['accept-encoding'] as string,
            accept: req.headers['accept'] as string,
            host: req.headers['host'] as string,
            connection: req.headers['connection'] as string,
            cacheControl: req.headers['cache-control'] as string,
          },
          requestInfo: {
            method: req.method,
            url: req.url,
            protocol: req.protocol,
            secure: req.secure
          }
        };

        try {
          
          await signatureFootprintService.create(signatureFootprintData);
        } catch (error) {
          logger.error('Unable to save signature footprint')
        }
          
        return res.status(200).json({
          success: true,
          message: 'All document fields for the contact have been signed successfully',
          signedFieldsCount: updatePromises.length,
          documentStatus: allFieldsSigned ? 'signed' : 'pending'
        });

      } catch (error) {
        console.error('Error in batch-sign endpoint:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal server error while processing the signing request'
        });
      }
    }
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('document-fields');

  service.hooks(hooks);
}
