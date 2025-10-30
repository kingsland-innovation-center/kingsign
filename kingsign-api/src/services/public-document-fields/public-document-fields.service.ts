// Initializes the `public-document-fields` service on path `/public-document-fields`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { PublicDocumentFields } from './public-document-fields.class';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'public-document-fields': PublicDocumentFields & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {};

  // Initialize our service with any options it requires
  app.use('/public-document-fields', new PublicDocumentFields(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('public-document-fields');

  service.hooks({
    before: {
      all: [],
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
      patch: [],
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
  });
}
