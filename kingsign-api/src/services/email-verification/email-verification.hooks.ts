import { HooksObject } from '@feathersjs/feathers';
import { disableExternalAccess } from '../../common/hooks/disableExternalAccess';

export default {
  before: {
    all: [disableExternalAccess],
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
