// Initializes the `email-templates` service on path `/email-templates`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { EmailTemplates } from './email-templates.class';
import createModel from '../../models/email-templates.model';
import hooks from './email-templates.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'email-templates': EmailTemplates & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/email-templates', new EmailTemplates(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('email-templates');

  service.hooks(hooks);
}
