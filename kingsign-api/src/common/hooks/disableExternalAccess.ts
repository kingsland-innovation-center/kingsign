import { Forbidden } from '@feathersjs/errors';

export const disableExternalAccess = (context: any) => {
  const { params } = context;
  if (params.provider) {
    throw new Forbidden('External access is disabled for this method.');
  }
  return context;
};