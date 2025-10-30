import { HookContext } from '@feathersjs/feathers';

/**
 * Feathers hook to filter out archived items by default.
 * If params.query.archived is undefined, only non-archived items are returned.
 * If params.query.archived is true/false, respects the query.
 */
export const filterNotArchived = (context: HookContext) => {
  if (!context.params.query) context.params.query = {};
  if (typeof context.params.query.archived === 'undefined') {
    context.params.query.archived = false;
  }
  return context;
}; 