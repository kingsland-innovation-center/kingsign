import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { DocumentStatus } from '../../types/enums';
import { CreateDocumentData, CreateContactData, GetDocumentData, GetTemplateData, GetContactData } from '../../types/document-creation';
import { ApiAction, ApiRequestData } from '../../types/api-actions';
import { Contacts } from '../contacts/contacts.class';
import { Templates } from '../templates/templates.class';
import { TemplateFields } from '../template-fields/template-fields.class';
import { Documents } from '../documents/documents.class';
import { DocumentFields } from '../document-fields/document-fields.class';



interface ServiceOptions {}

export class Api implements ServiceMethods<ApiRequestData> {
  app: Application;
  options: ServiceOptions;

  constructor (options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find (params?: Params): Promise<any[] | Paginated<any>> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get (id: Id, params?: Params): Promise<any> {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create (data: ApiRequestData, params?: Params): Promise<any> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.handleRequest(current)));
    }

    return this.handleRequest(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update (id: NullableId, data: any, params?: Params): Promise<any> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch (id: NullableId, data: any, params?: Params): Promise<any> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove (id: NullableId, params?: Params): Promise<any> {
    return { id };
  }

  async getTemplates(workspaceId: string, query?: Record<string, any>): Promise<any> {
    const templateService = this.app.service('templates');
    const templateFieldService = this.app.service('template-fields');
    
    const templates = await templateService.find({
      paginate: false,
      query: {
        ...query,
        workspaceId,
      }
    });

    // Get template fields for all templates
    const templatesWithFields = await Promise.all(
      templates.map(async (template: any) => {
        const templateFields = await templateFieldService.find({
          paginate: false,
          query: {
            templateId: template._id
          }
        });
        return {
          ...template,
          templateFields: templateFields
        };
      })
    );

    return templatesWithFields;
  }

  async getTemplate(data: GetTemplateData, workspaceId: string): Promise<any> {
    const templateService = this.app.service('templates');
    const template = await templateService.get(data.id);
    if (template.workspaceId.toString() !== workspaceId) {
      throw new Error('Template not found');
    }
    return template;
  }

  async getDocuments(workspaceId: string, query?: Record<string, any>): Promise<any> {
    const documentService = this.app.service('documents');
    const documentFieldService = this.app.service('document-fields');
    
    const documents = await documentService.find({
      paginate: false,
      query: {
        ...query,
        workspaceId,
      }
    });

    // Get document fields for all documents
    const documentsWithFields = await Promise.all(
      documents.map(async (document: any) => {
        const documentFields = await documentFieldService.find({
          paginate: false,
          query: {
            documentId: document._id
          }
        });
        
        return {
          ...document,
          documentFields: documentFields
        };
      })
    );

    return documentsWithFields;
  }

  async getDocumentsByEmail(email: string, workspaceId: string, query?: Record<string, any>): Promise<any> {
    const contactService = this.app.service('contacts');
    const documentFieldService = this.app.service('document-fields');
    const documentService = this.app.service('documents');

    // Step 1: Find the contact by email in the specified workspace
    const contacts = await contactService.find({
      paginate: false,
      query: {
        email: email,
        workspaceId: workspaceId
      }
    });

    if (!contacts || contacts.length === 0) {
      // No contact found with this email in this workspace
      return [];
    }

    const contact = contacts[0];

    // Step 2: Find document fields with this contact ID
    const documentFields = await documentFieldService.find({
      paginate: false,
      query: {
        contactId: contact._id
      }
    });

    if (!documentFields || documentFields.length === 0) {
      // No document fields assigned to this contact
      return [];
    }

    // Step 3: Extract unique document IDs
    const documentIds = [...new Set(documentFields.map((field: any) => field.documentId))];

    // Step 4: Find documents that belong to the workspace and match the document IDs
    const documents = await documentService.find({
      paginate: false,
      query: {
        ...query,
        _id: { $in: documentIds },
        workspaceId: workspaceId
      }
    });

    // Step 5: Get document fields for all found documents (similar to getDocuments)
    const documentsWithFields = await Promise.all(
      documents.map(async (document: any) => {
        const docFields = await documentFieldService.find({
          paginate: false,
          query: {
            documentId: document._id
          }
        });
        
        return {
          ...document,
          documentFields: docFields
        };
      })
    );

    return documentsWithFields;
  }

  async downloadDocument(documentId: string, workspaceId: string): Promise<any> {
    console.log('downloadDocument started', documentId, workspaceId);
    
    try {
      const documentService = this.app.service('documents');
      const documentFieldService = this.app.service('document-fields');
      const fileService = this.app.service('files');
      const awsObjectStorageService = this.app.service('aws-object-storage');

      // Step 1: Get the document and verify it belongs to the workspace
      console.log('Step 1: Getting document');
      const document = await documentService.get(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.workspaceId.toString() !== workspaceId) {
        throw new Error('Document not found in this workspace');
      }
      console.log('Document found:', document.title, 'status:', document.status);

      // Step 2: Get all document fields for this document
      console.log('Step 2: Getting document fields');
      const documentFields = await documentFieldService.find({
        paginate: false,
        query: {
          documentId: documentId
        }
      });
      console.log('Found', documentFields?.length || 0, 'document fields');

      // Step 3: Get the file information
      if (!document.fileId) {
        throw new Error('Document has no associated file');
      }

      console.log('Getting file with ID:', document.fileId);
      const file = await fileService.get(document.fileId);
      if (!file) {
        throw new Error('File not found');
      }
      console.log('File found:', { fileName: file.fileName, fileUrl: file.fileUrl });

      // Step 4: Get the download URL from AWS Object Storage
      // Extract the key from the fileUrl - AWS service expects just the key, not the full URL
      // fileUrl might be something like "https://bucket.s3.amazonaws.com/key" or just "key"
      let fileKey = file.fileUrl;
      if (file.fileUrl.includes('/')) {
        // If it's a full URL, extract the key (last part after the last slash)
        fileKey = file.fileUrl.split('/').pop() || file.fileUrl;
      }
      
      console.log('Using file key for AWS:', fileKey);
      const downloadUrl = await awsObjectStorageService.get(fileKey);
      
      const result = {
        downloadUrl: downloadUrl,
        fileName: file.fileName,
        fileType: file.fileType,
        fileExtension: file.fileExtension,
        document: {
          id: document._id,
          title: document.title,
          status: document.status,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        },
        signedFields: documentFields.length
      };
      
      console.log('Download URL generated successfully');
      return result;
      
    } catch (error: any) {
      console.error('downloadDocument error:', error.message);
      throw error;
    }
  }

  async getDocument(data: GetDocumentData, workspaceId: string): Promise<Documents> {
    const documentService = this.app.service('documents');
    const document = await documentService.get(data.id);
    if (document.workspaceId.toString() !== workspaceId) {
      throw new Error('Document not found');
    }
    return document;
  }

  async getContacts(workspaceId: string, query?: Record<string, any>): Promise<Contacts[]> {
    const contactService = this.app.service('contacts');
    return contactService.find({
      paginate: false,
      query: {
        ...query,
        workspaceId,
      }
    });
  }

  async getContact(data: GetContactData, workspaceId: string): Promise<Contacts> {
    const contactService = this.app.service('contacts');
    const contact = await contactService.get(data.id);
    console.log(contact);
    if (contact.workspaceId.toString() !== workspaceId) {
      console.log(contact.workspaceId.toString(), workspaceId);
      throw new Error('Contact not found');
    }
    return contact;
  }

  async createContact(data: CreateContactData, workspaceId: string): Promise<Contacts> {
    const contactService = this.app.service('contacts');
    
    // First, check if a contact with the same email already exists in this workspace
    const existingContact = await contactService.find({
      query: {
        email: data.email,
        workspaceId: workspaceId
      }
    });

    if (existingContact.data.length > 0) {
      // Return the existing contact
      return existingContact.data[0];
    }

    // If no existing contact found, create a new one
    return contactService.create({
      ...data,
      workspaceId: workspaceId
    });
  }

  async createDocument(data: CreateDocumentData, workspaceId: string): Promise<any> {
    const templateService = this.app.service('templates');
    const documentService = this.app.service('documents');
    const documentFieldService = this.app.service('document-fields');
    const contactService = this.app.service('contacts');
    const templateFieldService = this.app.service('template-fields');

    // Get the template to verify it exists and get its fileId
    const template = await templateService.get(data.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create the document
    const document = await documentService.create({
      templateId: data.templateId,
      fileId: template.fileId,
      title: data.title,
      note: data.description, // Map description to note field in database
      workspaceId: workspaceId,
      status: DocumentStatus.PENDING
    });

    // Get all template fields for this template
    const templateFields = await templateFieldService.find({
      paginate: false,
      query: {
        templateId: data.templateId
      }
    });

    // Create a map of fieldId to template field for quick lookup
    const templateFieldMap = new Map();
    templateFields.forEach((field: any) => {
      templateFieldMap.set(field._id.toString(), field);
    });

    // Process each field assignment
    const documentFields = [];
    for (const fieldAssignment of data.fields) {
      // Check if the field exists in the template
      if (!templateFieldMap.has(fieldAssignment.fieldId)) {
        throw new Error(`Field ${fieldAssignment.fieldId} not found in template`);
      }

      // Find or create contact
      let contact;
      const existingContact = await contactService.find({
        query: {
          email: fieldAssignment.contact.email,
          workspaceId: workspaceId
        }
      });

      if (existingContact.data.length > 0) {
        // Use existing contact
        contact = existingContact.data[0];
      } else {
        // Create new contact
        contact = await contactService.create({
          name: fieldAssignment.contact.name,
          email: fieldAssignment.contact.email,
          phone: fieldAssignment.contact.phone,
          workspaceId: workspaceId
        });
      }

      // Create document field
      const documentField = await documentFieldService.create({
        documentId: document._id,
        fieldId: fieldAssignment.fieldId,
        contactId: contact._id,
        isSigned: false
      });

      documentFields.push(documentField);
    }

    // Return the document with its fields
    return {
      document,
      documentFields
    };
  }

  /**
   * Handle API requests with action-based routing
   */
  async handleRequest(requestData: ApiRequestData): Promise<any> {
    const { action, requestPayload, workspaceId } = requestData;

    switch (action) {
    case ApiAction.GET_TEMPLATES:
      return this.getTemplates(workspaceId, (requestPayload as { query?: Record<string, any> })?.query);
    case ApiAction.GET_DOCUMENTS:
      return this.getDocuments(workspaceId, (requestPayload as { query?: Record<string, any> })?.query);
    case ApiAction.GET_DOCUMENTS_BY_EMAIL:
      return this.getDocumentsByEmail(
        (requestPayload as { email: string; query?: Record<string, any> }).email,
        workspaceId,
        (requestPayload as { email: string; query?: Record<string, any> })?.query
      );
    case ApiAction.GET_CONTACTS:
      return this.getContacts(workspaceId, (requestPayload as { query?: Record<string, any> })?.query);
    case ApiAction.GET_DOCUMENT:
      return this.getDocument(requestPayload as GetDocumentData, workspaceId);
    case ApiAction.GET_TEMPLATE:
      return this.getTemplate(requestPayload as GetTemplateData, workspaceId);
    case ApiAction.GET_CONTACT:
      return this.getContact(requestPayload as GetContactData, workspaceId);
    case ApiAction.CREATE_CONTACT:
      return this.createContact(requestPayload as CreateContactData, workspaceId);
    case ApiAction.CREATE_DOCUMENT:
      return this.createDocument(requestPayload as CreateDocumentData, workspaceId);
    case ApiAction.DOWNLOAD_DOCUMENT:
      return this.downloadDocument(
        (requestPayload as { documentId: string }).documentId,
        workspaceId
      );
      
    default:
      throw new Error(`Unknown action: ${action}`);
    }
  }

}
