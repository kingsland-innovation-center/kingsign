import { Id, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { BadRequest, Forbidden } from '@feathersjs/errors';

interface ServiceOptions {}

export class PublicDocumentFields implements ServiceMethods<any> {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  async find(params: Params): Promise<any[]> {
    console.log(params);
    const documentFieldsService = this.app.service('document-fields');
    return documentFieldsService.find({
      query: {
        documentId: params.query?.documentId
      }
    });
  }

  async get(id: string, params: Params): Promise<any> {
    const documentFieldsService = this.app.service('document-fields');
    const field = await documentFieldsService.get(id);

    // Verify the field belongs to the document specified in token
    if (field.documentId.toString() !== params.documentId) {
      throw new Forbidden('Invalid field access');
    }

    return field;
  }

  async create(data: any, params: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async update(id: string, data: any, params: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async patch(id: string, data: any, params: Params): Promise<any> {
    const documentFieldsService = this.app.service('document-fields');
    const field = await documentFieldsService.get(id);

    if (field.documentId.toString() !== params.documentId) {
      throw new Forbidden('Invalid field access');
    }

    return documentFieldsService.patch(id, data);
  }

  async remove(id: string, params: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }
}
