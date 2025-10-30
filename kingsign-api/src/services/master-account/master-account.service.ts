// Initializes the `create-master-account` service on path `/create-master-account`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { MasterAccount } from './master-account.class';
import hooks from './master-account.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'master-account': MasterAccount & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/master-account', new MasterAccount(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('master-account');

  service.hooks(hooks);
}
