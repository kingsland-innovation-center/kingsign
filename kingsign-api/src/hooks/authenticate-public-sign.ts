import { Hook, HookContext } from '@feathersjs/feathers';
import { NotAuthenticated, Forbidden } from '@feathersjs/errors';

export const authenticatePublicSign = (): Hook => {
  return async (context: HookContext) => {
    const { params, app } = context;

    try {
      const authHeader = params.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new NotAuthenticated('No public sign token provided in authorization header');
      }

      const token = authHeader.split(' ')[1];
      const authService = app.service('public-document-auth');
      const decoded = await authService.verify(token);

      // Add the documentId to the params for use in the service
      context.params.documentId = decoded.documentId;
      
      return context;
    } catch (error) {
      if (error instanceof NotAuthenticated) {
        throw error;
      }
      throw new Forbidden('Invalid token');
    }
  };
}; 