// Initializes the `public-document-auth` service on path `/public-document-auth`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { PublicDocumentAuth } from './public-document-auth.class';
import hooks from './public-document-auth.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'public-document-auth': PublicDocumentAuth & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    secret: app.get('authentication').secret,
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/public-document-auth', new PublicDocumentAuth(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('public-document-auth');

  service.hooks(hooks);
}
