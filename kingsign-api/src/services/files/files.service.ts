// Initializes the `files` service on path `/files`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Files } from './files.class';
import createModel from '../../models/files.model';
import hooks from './files.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'files': Files & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/files', new Files(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('files');

  service.hooks(hooks);
}
