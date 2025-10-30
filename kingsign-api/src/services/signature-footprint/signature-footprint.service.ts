// Initializes the `signature-footprint` service on path `/signature-footprints`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { SignatureFootprint } from './signature-footprint.class';
import createModel from '../../models/signature-footprint.model';
import hooks from './signature-footprint.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'signature-footprints': SignatureFootprint & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/signature-footprints', new SignatureFootprint(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('signature-footprints');

  service.hooks(hooks);
}
