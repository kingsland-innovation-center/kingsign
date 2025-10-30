import { CreateDocumentData, CreateContactData, GetDocumentData, GetTemplateData, GetContactData } from './document-creation';

/**
 * Enum for different API actions
 */
export enum ApiAction {
  CREATE_DOCUMENT = 'CREATE_DOCUMENT',
  GET_DOCUMENT = 'GET_DOCUMENT',
  GET_DOCUMENTS = 'GET_DOCUMENTS',
  UPDATE_DOCUMENT = 'UPDATE_DOCUMENT',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',
  CREATE_TEMPLATE = 'CREATE_TEMPLATE',
  GET_TEMPLATE = 'GET_TEMPLATE',
  GET_TEMPLATES = 'GET_TEMPLATES',
  UPDATE_TEMPLATE = 'UPDATE_TEMPLATE',
  DELETE_TEMPLATE = 'DELETE_TEMPLATE',
  CREATE_CONTACT = 'CREATE_CONTACT',
  GET_CONTACT = 'GET_CONTACT',
  GET_CONTACTS = 'GET_CONTACTS',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  DELETE_CONTACT = 'DELETE_CONTACT',
  GET_DOCUMENTS_BY_EMAIL = 'GET_DOCUMENTS_BY_EMAIL',
  DOWNLOAD_DOCUMENT = 'DOWNLOAD_DOCUMENT'
}

/**
 * Request payload types for different actions
 */
export type RequestPayload = 
  | CreateDocumentData // for CREATE_DOCUMENT
  | CreateContactData // for CREATE_CONTACT
  | GetDocumentData // for GET_DOCUMENT
  | GetTemplateData // for GET_TEMPLATE
  | GetContactData // for GET_CONTACT
  | { email: string; query?: Record<string, any> } // for GET_DOCUMENTS_BY_EMAIL
  | { documentId: string } // for DOWNLOAD_DOCUMENT
  | { id: string; query?: Record<string, any> } // for DELETE_DOCUMENT
  | { query?: Record<string, any> } // for GET_DOCUMENTS, GET_TEMPLATES, GET_CONTACTS
  | { id: string; data: any } // for UPDATE_DOCUMENT
  | any; // for other actions

/**
 * Base request data interface
 */
export interface ApiRequestData {
  /** Required: The action to perform */
  action: ApiAction;

  /** required: The workspace ID for the request */
  workspaceId: string;

  /** Required: The payload data for the request */
  requestPayload?: RequestPayload;
}
