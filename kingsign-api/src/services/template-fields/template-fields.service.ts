// Initializes the `template-fields` service on path `/template-fields`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { TemplateFields } from './template-fields.class';
import createModel from '../../models/template-fields.model';
import hooks from './template-fields.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'template-fields': TemplateFields & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/template-fields', new TemplateFields(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('template-fields');

  service.hooks(hooks);
}
