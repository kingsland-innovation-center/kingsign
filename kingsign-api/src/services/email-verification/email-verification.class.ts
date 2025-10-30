import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';

interface VerifyEmailData {
  token: string;
  success: boolean;
  message: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

interface ServiceOptions {}

export class EmailVerification implements ServiceMethods<VerifyEmailData> {
  app: Application;
  options: ServiceOptions;

  constructor (options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  async find (params?: Params): Promise<VerifyEmailData[] | Paginated<VerifyEmailData>> {
    try {
      const token = params?.query?.token;
      
      if (!token) {
        return [{
          token: '',
          success: false,
          message: 'Verification token is required'
        }];
      }

      // Find user with matching confirmation token
      const users = await this.app.service('users').find({
        query: {
          confirmationToken: token,
          isVerified: false
        }
      });

      const userData = Array.isArray(users) ? users : users.data;
      
      if (!userData || userData.length === 0) {
        return [{
          token: '',
          success: false,
          message: 'Invalid or expired verification token'
        }];
      }

      const user = userData[0];

      // Update user to mark as verified
      await this.app.service('users').patch(user._id, {
        isVerified: true,
        confirmationToken: null
      });

      return [{
        token: '',
        success: true,
        message: 'Email verified successfully'
      }];
    } catch (error: any) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }
  }

  async get (id: Id, params?: Params): Promise<VerifyEmailData> {
    throw new Error('Method not implemented');
  }

  async create (data: Partial<VerifyEmailData> | Partial<VerifyEmailData>[], params?: Params): Promise<VerifyEmailData | VerifyEmailData[]> {
    if (Array.isArray(data)) {
      const results = await Promise.all(data.map(current => this.create(current, params)));
      return results as VerifyEmailData[];
    }

    try {
      const { token } = data;
      
      // Find user with matching confirmation token
      const users = await this.app.service('users').find({
        query: {
          confirmationToken: token,
          isVerified: false
        }
      });

      const userData = Array.isArray(users) ? users : users.data;
      
      if (!userData || userData.length === 0) {
        return {
          token: '',
          success: false,
          message: 'Invalid or expired verification token'
        } as unknown as VerifyEmailData;
      }

      const user = userData[0];

      // Update user to mark as verified
      await this.app.service('users').patch(user._id, {
        isVerified: true,
        confirmationToken: null
      });

      return {
        token: '',
        success: true,
        message: 'Email verified successfully'
      } as unknown as VerifyEmailData;
    } catch (error: any) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }
  }

  async update (id: NullableId, data: VerifyEmailData, params?: Params): Promise<VerifyEmailData> {
    throw new Error('Method not implemented');
  }

  async patch (id: NullableId, data: VerifyEmailData, params?: Params): Promise<VerifyEmailData> {
    throw new Error('Method not implemented');
  }

  async remove (id: NullableId, params?: Params): Promise<VerifyEmailData> {
    throw new Error('Method not implemented');
  }
}
