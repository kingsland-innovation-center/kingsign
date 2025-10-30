// Initializes the `notification-integrations` service on path `/notification-integrations`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { NotificationIntegrations } from './notification-integrations.class';
import createModel from '../../models/notification-integrations.model';
import hooks from './notification-integrations.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'notification-integrations': NotificationIntegrations & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/notification-integrations', new NotificationIntegrations(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('notification-integrations');

  service.hooks(hooks);
}
