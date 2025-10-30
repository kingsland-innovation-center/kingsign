import { HooksObject } from '@feathersjs/feathers';
import { extractApiKeyWithValidation } from '../../hooks/extract-api-key';

export default {
  before: {
    all: [extractApiKeyWithValidation()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
