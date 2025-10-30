// Initializes the `mailgun` service on path `/mailgun`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { MailgunService } from './mailgun.class';
import hooks from './mailgun.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'mailgun': MailgunService & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/mailgun', new MailgunService(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('mailgun');

  service.hooks(hooks);
}
