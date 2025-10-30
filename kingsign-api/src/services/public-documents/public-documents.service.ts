// Initializes the `public-documents` service on path `/public-documents`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { PublicDocuments } from './public-documents.class';
import hooks from './public-documents.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'public-documents': PublicDocuments & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/public-documents', new PublicDocuments(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('public-documents');

  service.hooks(hooks);
}
