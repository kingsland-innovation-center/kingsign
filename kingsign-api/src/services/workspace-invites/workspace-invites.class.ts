import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import crypto from 'crypto';
import { BadRequest } from '@feathersjs/errors';

interface InviteData {
  email: string;
  name: string;
  workspaceId: string;
  roleId: string;
}

interface ServiceOptions {}

export class WorkspaceInvites implements ServiceMethods<InviteData> {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  private generatePassword(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private async sendInviteEmail(email: string, name: string, password: string): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL}/auth/login`;
    
    const emailContent = {
      to: email,
      subject: 'Welcome to KingSign - Your Account Details',
      html: `
        <h1>Welcome to KingSign!</h1>
        <p>Hi ${name},</p>
        <p>You have been invited to join KingSign. Here are your account credentials:</p>
        <p>Email: ${email}</p>
        <p>Password: ${password}</p>
        <p>Please login at: <a href="${loginUrl}">${loginUrl}</a></p>
        <p>For security reasons, we recommend changing your password after your first login.</p>
        <p>Best regards,<br>The KingSign Team</p>
      `
    };

    await this.app.service('mailgun').create(emailContent);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(params?: Params): Promise<InviteData[] | Paginated<InviteData>> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(id: Id, params?: Params): Promise<InviteData> {
    return {
      email: '',
      name: '',
      workspaceId: '',
      roleId: ''
    };
  }

  async create(data: Partial<InviteData>, params?: Params): Promise<InviteData> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params))) as Promise<any>;
    }

    const { email, name, workspaceId, roleId } = data;

    if (!email || !name || !workspaceId || !roleId) {
      throw new BadRequest('Email, name, workspaceId, and roleId are required');
    }

    try {
      // Check if workspace exists
      const workspace = await this.app.service('workspaces').get(workspaceId);
      if (!workspace) {
        throw new BadRequest('Invalid workspace');
      }

      // Check if role exists and belongs to the workspace
      const role = await this.app.service('roles').get(roleId);
      if (!role) {
        throw new BadRequest('Invalid role');
      }

      // Convert both IDs to strings for comparison
      if (String(role.workspaceId) !== String(workspaceId)) {
        throw new BadRequest('Invalid role for the workspace');
      }

      // Check if user already exists
      const existingUsers = await this.app.service('users').find({
        query: {
          email: email.toLowerCase()
        }
      });

      let user;
      let isNewUser = false;

      if (Array.isArray(existingUsers) ? existingUsers.length === 0 : existingUsers.data.length === 0) {
        // Create new user
        isNewUser = true;
        const password = this.generatePassword();
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        user = await this.app.service('users').create({
          email: email.toLowerCase(),
          name: name.toLowerCase(),
          password,
          confirmationToken,
          isVerified: true
        });

        // Send welcome email with credentials
        await this.sendInviteEmail(email, name, password);
      } else {
        user = Array.isArray(existingUsers) ? existingUsers[0] : existingUsers.data[0];
      }

      // Check if user already has an account in this workspace
      const existingAccounts = await this.app.service('accounts').find({
        query: {
          userId: user._id,
          workspaceId: workspace._id
        }
      });

      if (Array.isArray(existingAccounts) ? existingAccounts.length > 0 : existingAccounts.data.length > 0) {
        throw new BadRequest('User already has an account in this workspace');
      }

      // Create account
      const account = await this.app.service('accounts').create({
        userId: user._id,
        workspaceId: workspace._id,
        roleId: role._id
      });

      // If this is the user's first workspace, set it as current
      if (isNewUser) {
        await this.app.service('users').patch(user._id, {
          currentWorkspaceId: workspace._id
        });
      }

      return {
        email,
        name,
        workspaceId,
        roleId
      };
    } catch (error: any) {
      throw new BadRequest(error.message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: NullableId, data: InviteData, params?: Params): Promise<InviteData> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch(id: NullableId, data: Partial<InviteData>, params?: Params): Promise<InviteData> {
    return data as InviteData;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: NullableId, params?: Params): Promise<InviteData> {
    return {
      email: '',
      name: '',
      workspaceId: '',
      roleId: ''
    };
  }
}
