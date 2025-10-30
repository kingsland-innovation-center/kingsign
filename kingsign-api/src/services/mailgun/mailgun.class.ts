import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

interface EmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    data: Buffer;
    contentType?: string;
  }>;
  status?: string;
}

interface ServiceOptions {}

export class MailgunService implements ServiceMethods<EmailData> {
  app: Application;
  options: ServiceOptions;
  mailgun: any;
  domain: string;
  defaultFrom: string;

  constructor (options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.defaultFrom = process.env.MAILGUN_SENDER || '';
    
    // Validate required environment variables
    if (!process.env.MAILGUN_API_KEY) {
      throw new Error('MAILGUN_API_KEY environment variable is required');
    }
    if (!process.env.MAILGUN_DOMAIN) {
      throw new Error('MAILGUN_DOMAIN environment variable is required');
    }
    if (!process.env.MAILGUN_SENDER) {
      throw new Error('MAILGUN_SENDER environment variable is required');
    }
    
    // Initialize Mailgun client
    const mailgun = new Mailgun(formData);
    this.mailgun = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });
  }

  async find (params?: Params): Promise<EmailData[] | Paginated<EmailData>> {
    return [];
  }

  async get (id: Id, params?: Params): Promise<EmailData> {
    throw new Error('Method not implemented');
  }

  async create (data: EmailData | EmailData[], params?: Params): Promise<EmailData | EmailData[]> {
    if (Array.isArray(data)) {
      const results = await Promise.all(data.map(current => this.create(current, params)));
      return results as EmailData[];
    }

    try {
      const messageData = {
        from: data.from || this.defaultFrom,
        to: Array.isArray(data.to) ? data.to.join(',') : data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
        cc: data.cc,
        bcc: data.bcc,
        'h:Reply-To': data.replyTo,
        attachment: data.attachments
      };

      await this.mailgun.messages.create(this.domain, messageData);
      
      return {
        ...data,
        status: 'sent'
      };
    } catch (error: any) {
      console.error('Mailgun error details:', error);
      
      // Provide more specific error messages based on common Mailgun errors
      if (error.status === 401) {
        throw new Error('Failed to send email: Unauthorized - Check your MAILGUN_API_KEY');
      } else if (error.status === 400) {
        throw new Error(`Failed to send email: Bad Request - ${error.message}`);
      } else if (error.status === 403) {
        throw new Error('Failed to send email: Forbidden - Check your MAILGUN_DOMAIN permissions');
      } else if (error.message && error.message.includes('Unauthorized')) {
        throw new Error('Failed to send email: Unauthorized - Invalid MAILGUN_API_KEY or MAILGUN_DOMAIN');
      } else {
        throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async update (id: NullableId, data: EmailData, params?: Params): Promise<EmailData> {
    throw new Error('Method not implemented');
  }

  async patch (id: NullableId, data: EmailData, params?: Params): Promise<EmailData> {
    throw new Error('Method not implemented');
  }

  async remove (id: NullableId, params?: Params): Promise<EmailData> {
    throw new Error('Method not implemented');
  }
}
