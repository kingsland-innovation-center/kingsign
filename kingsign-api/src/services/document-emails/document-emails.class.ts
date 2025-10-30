import { Service, MongooseServiceOptions } from 'feathers-mongoose';
import { Application } from '../../declarations';
import { BadRequest } from '@feathersjs/errors';
import { Params } from '@feathersjs/feathers';
import Handlebars from 'handlebars';

interface CreateDocumentEmailData {
  userId: string;
  contactId: string;
  documentId: string;
  emailTemplateId: string;
  workspaceId: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  emailStatus?: string;
}

export class DocumentEmails extends Service {
  app: Application;

  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: CreateDocumentEmailData, params?: Params): Promise<any> {
    // If subject and htmlContent are provided, create record directly
    if (data.subject && data.htmlContent) {
      return super.create(data, params);
    }
    
    // Otherwise, use the email sending process
    return this.createDocumentEmail(data, params);
  }

  async createDocumentEmail(data: CreateDocumentEmailData, params?: Params): Promise<any> {
    const { userId, contactId, documentId, emailTemplateId, workspaceId, subject, htmlContent, textContent } = data;

    try {
      // Fetch required data with authentication context
      const [user, contact, document, emailTemplate, workspace] = await Promise.all([
        this.app.service('users').get(userId, params),
        this.app.service('contacts').get(contactId, params),
        this.app.service('documents').get(documentId, params),
        this.app.service('email-templates').get(emailTemplateId, params),
        this.app.service('workspaces').get(workspaceId, params)
      ]);

      // Validate that all entities exist and belong to the correct workspace
      if (!user) throw new BadRequest('User not found');
      if (!contact) throw new BadRequest('Contact not found');
      if (!document) throw new BadRequest('Document not found');
      if (!emailTemplate) throw new BadRequest('Email template not found');
      if (!workspace) throw new BadRequest('Workspace not found');

      // Validate workspace relationships
      if (contact.workspaceId.toString() !== workspaceId) {
        throw new BadRequest('Contact does not belong to the specified workspace');
      }
      if (document.workspaceId.toString() !== workspaceId) {
        throw new BadRequest('Document does not belong to the specified workspace');
      }
      if (emailTemplate.workspaceId.toString() !== workspaceId) {
        throw new BadRequest('Email template does not belong to the specified workspace');
      }

      // Generate public signing token
      const publicDocumentAuthService = this.app.service('public-document-auth');
      const tokenResponse = await publicDocumentAuthService.create({
        documentId,
        contactId,
        sub: userId,
        aud: 'document-signing',
        iss: 'kingsign',
        expiresIn: '30d' // 30 days expiration
      }, params);

      // Construct the public signing URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const signUrl = `${baseUrl}/public-sign?token=${tokenResponse.token}`;

      // Prepare Handlebars template data
      const templateData = {
        contact: {
          name: contact.name,
          email: contact.email,
          phone: contact.phone || ''
        },
        document: {
          title: document.title,
          signUrl: signUrl
        },
        workspace: {
          name: workspace.name
        }
      };

      // Use provided content or compile from template
      let compiledSubject, compiledHtml, compiledText;
      
      if (subject && htmlContent) {
        // Use provided custom content
        compiledSubject = subject;
        compiledHtml = htmlContent;
        compiledText = textContent;
      } else {
        // Compile and render email content from template
        const subjectTemplate = Handlebars.compile(emailTemplate.subject);
        const htmlTemplate = Handlebars.compile(emailTemplate.htmlContent);
        const textTemplate = emailTemplate.textContent ? Handlebars.compile(emailTemplate.textContent) : null;

        compiledSubject = subjectTemplate(templateData);
        compiledHtml = htmlTemplate(templateData);
        compiledText = textTemplate ? textTemplate(templateData) : undefined;
      }

      // Send email via Mailgun (bypass external access restriction by setting provider to null)
      const mailgunService = this.app.service('mailgun');
      const emailData = {
        to: contact.email,
        subject: compiledSubject,
        html: compiledHtml,
        text: compiledText,
        from: process.env.MAILGUN_SENDER || `noreply@${process.env.MAILGUN_DOMAIN}`
      };

      // Call mailgun service internally (not externally) by setting provider to null
      const emailResult = await mailgunService.create(emailData, { 
        ...params, 
        provider: null 
      });

      // Create document email record with compiled content
      const documentEmailRecord = await super.create({
        workspaceId,
        documentId,
        emailTemplateId,
        userId,
        contactId,
        subject: compiledSubject,
        htmlContent: compiledHtml,
        textContent: compiledText,
        emailStatus: emailResult.status || 'sent'
      }, params);

      return {
        documentEmail: documentEmailRecord,
        emailSent: emailResult,
        signUrl: signUrl,
        compiledContent: {
          subject: compiledSubject,
          html: compiledHtml,
          text: compiledText
        }
      };

    } catch (error: any) {
      console.error('Error creating document email:', error);
      throw new BadRequest(`Failed to create and send document email: ${error.message}`);
    }
  }
}
