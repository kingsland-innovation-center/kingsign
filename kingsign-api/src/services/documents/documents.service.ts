// Initializes the `documents` service on path `/documents`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Documents } from './documents.class';
import createModel from '../../models/documents.model';
import hooks from './documents.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'documents': Documents & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/documents', new Documents(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('documents');

  service.hooks(hooks);
}
