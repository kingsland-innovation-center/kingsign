// Initializes the `document-emails` service on path `/document-emails`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { DocumentEmails } from './document-emails.class';
import createModel from '../../models/document-emails.model';
import hooks from './document-emails.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'document-emails': DocumentEmails & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/document-emails', new DocumentEmails(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('document-emails');

  service.hooks(hooks);
}
