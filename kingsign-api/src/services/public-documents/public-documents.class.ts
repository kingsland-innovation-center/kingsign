import { Id, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { BadRequest, Forbidden } from '@feathersjs/errors';

interface ServiceOptions {}

export class PublicDocuments implements ServiceMethods<any> {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  async find(params: Params): Promise<any[]> {
    const documentsService = this.app.service('documents');
    return documentsService.find({
      query: {
        documentId: params.documentId
      }
    });
  }

  async get(id: string, params: Params): Promise<any> {
    const documentsService = this.app.service('documents');
    return documentsService.get(params.documentId);
  }

  async create(data: any, params: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async update(id: string, data: any, params: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async patch(id: string, data: any, params: Params): Promise<any> {
    const documentsService = this.app.service('documents');
    return documentsService.patch(params.documentId, data);
  }

  async remove(id: Id, params: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }
}
