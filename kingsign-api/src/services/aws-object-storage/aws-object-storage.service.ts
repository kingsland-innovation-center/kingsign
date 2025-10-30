// Initializes the `aws-object-storage` service on path `/aws-object-storage`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { AwsObjectStorage } from './aws-object-storage.class';
import hooks from './aws-object-storage.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'aws-object-storage': AwsObjectStorage & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/aws-object-storage', new AwsObjectStorage(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('aws-object-storage');

  service.hooks(hooks);
}
