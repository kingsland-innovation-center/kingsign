import { authenticate } from '@feathersjs/authentication';
import { HookContext } from '@feathersjs/feathers';
import { DocumentField } from '../document-fields/document-fields.interface';
import { Document } from '../documents/documents.interface';

export default {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [
      async (context: HookContext) => {
        const { app, id } = context;

        const documentFieldsService = app.service('document-fields');

        // Find all document fields that reference this template field
        const documentFields = await documentFieldsService.find({
          query: {
            fieldId: id,
          },
        });

        // Delete all
        await Promise.all(
          documentFields.data.map((field: { _id: string }) =>
            documentFieldsService.remove(field._id)
          )
        );

        return context;
      },
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      async (context: HookContext) => {
        const { app, result } = context;

        const documentsService = app.service('documents');
        const documentFieldsService = app.service('document-fields');

        // Find all documents using this template
        const documents = await documentsService.find({
          query: {
            templateId: result.templateId,
          },
        });

        // Create the document fields for each document
        const documentFields = documents.data.map((doc: Document) => ({
          documentId: doc._id,
          fieldId: result._id,
          value: null,
        }));

        await Promise.all(
          documentFields.map((field: DocumentField) =>
            documentFieldsService.create(field)
          )
        );

        return context;
      },
    ],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
