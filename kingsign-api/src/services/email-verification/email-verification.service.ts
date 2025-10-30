// Initializes the `email-verification` service on path `/email-verification`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { EmailVerification } from './email-verification.class';
import hooks from './email-verification.hooks';
import { Request, Response } from 'express';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'email-verification': EmailVerification & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/email-verification', new EmailVerification(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('email-verification');

  service.hooks(hooks);

  // Add a route for email verification
  app.get('/verify-email', async (req: Request, res: Response) => {
    try {
      const result = await service.find({ query: { token: req.query.token } });
      
      if (result[0].success) {
        // Redirect to success URL
        res.redirect(process.env.FRONTEND_URL + '/auth/verification-successful');
      } else {
        // Redirect to failure URL
        res.redirect(process.env.FRONTEND_URL + '/auth/verification-failed');
      }
    } catch (error: unknown) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
}
