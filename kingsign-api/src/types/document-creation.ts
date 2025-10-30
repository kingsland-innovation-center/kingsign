/**
 * Contact information for document signers
 */
export interface DocumentContact {
  /** Required: Full name of the contact */
  name: string;
  /** Required: Email address of the contact */
  email: string;
  /** Optional: Phone number of the contact */
  phone?: string;
}

/**
 * Data structure for creating a new contact
 */
export interface CreateContactData {
  /** Required: Full name of the contact */
  name: string;
  /** Required: Email address of the contact */
  email: string;
  /** Optional: Phone number of the contact */
  phone?: string;
}

/**
 * Data structure for getting a document
 */
export interface GetDocumentData {
  /** Required: ID of the document to retrieve */
  id: string;
}

/**
 * Data structure for getting a template
 */
export interface GetTemplateData {
  /** Required: ID of the template to retrieve */
  id: string;
}

/**
 * Data structure for getting a contact
 */
export interface GetContactData {
  /** Required: ID of the contact to retrieve */
  id: string;
}

/**
 * Field assignment for document creation
 */
export interface DocumentField {
  /** Required: ID of the field from the template */
  fieldId: string;
  /** Required: Contact information for this field */
  contact: DocumentContact;
}

/**
 * Data structure for creating a new document
 */
export interface CreateDocumentData {
  /** Required: ID of the template to use for document creation */
  templateId: string;
  /** Required: Title of the document */
  title: string;
  /** Required: Description of the document */
  description: string;
  /** Required: Array of field assignments with contact information */
  fields: DocumentField[];
}
