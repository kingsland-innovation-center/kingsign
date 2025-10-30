import { authenticate } from '@feathersjs/authentication';
import { HooksObject } from '@feathersjs/feathers';
import { filterNotArchived } from '../../common/hooks/filterNotArchived';
  
export default {
  before: {
    all: [authenticate('jwt')],
    find: [filterNotArchived],
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
