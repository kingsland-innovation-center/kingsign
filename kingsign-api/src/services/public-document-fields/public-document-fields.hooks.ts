import { HooksObject } from '@feathersjs/feathers';
import { authenticatePublicSign } from '../../hooks/authenticate-public-sign';

export default {
  before: {
    all: [authenticatePublicSign()],
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
