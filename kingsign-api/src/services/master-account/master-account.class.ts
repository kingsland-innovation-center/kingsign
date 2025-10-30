import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Users } from '../users/users.class';
import { Workspaces } from '../workspaces/workspaces.class';
import { Roles } from '../roles/roles.class';
import { Accounts } from '../accounts/accounts.class';
import crypto from 'crypto';
import { DEFAULT_ROLES, RolePermissions } from '../../constants/roles';

export interface CreateMasterAccountParams {
  email: string;
  password: string;
  name: string;
  company: string;
  phone: string;
}

interface Data {}

interface ServiceOptions {}

interface CreatedMasterAccount {
  user: Users;
  workspace: Workspaces;
  role: Role;
  account: Accounts;
}

interface Role extends RolePermissions {
  _id: string;
  workspaceId: string;
}

export class MasterAccount {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  private generateConfirmationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.BACKEND_URL}/verify-email?token=${token}`;
    
    const emailContent = {
      to: email,
      subject: 'Verify your KingSign account',
      html: `
        <h1>Welcome to KingSign!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for creating your KingSign account. Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <p>Best regards,<br>The KingSign Team</p>
      `
    };

    await this.app.service('mailgun').create(emailContent);
  }

  private async createWorkspaceRoles(workspaceId: string): Promise<Role[]> {
    const roles: Role[] = [];
    
    for (const roleKey of Object.keys(DEFAULT_ROLES)) {
      const roleData = DEFAULT_ROLES[roleKey];
      const role = await this.app.service('roles').create({
        workspaceId,
        ...roleData
      });
      roles.push(role as Role);
    }
    
    return roles;
  }

  async create(data: Partial<CreateMasterAccountParams>, params?: Params): Promise<CreatedMasterAccount> {
    let newUser, newWorkspace, newRoles: Role[] | undefined, newAccount;

    try {
      // Generate confirmation token
      const confirmationToken = this.generateConfirmationToken();
      
      // Create user with confirmation token
      newUser = await this.app.service('users').create({
        ...data,
        confirmationToken,
        isVerified: false
      }, params);

      // Send verification email
      await this.sendVerificationEmail(data.email!, data.name!, confirmationToken);

      newWorkspace = await this.app.service('workspaces').create({
        name: data.company,
        creatorUserId: newUser._id,
      });

      // Create all default roles for the workspace
      newRoles = await this.createWorkspaceRoles(newWorkspace._id);

      // Find the administrator role
      const adminRole = newRoles.find(role => role.name === DEFAULT_ROLES.ADMINISTRATOR.name);

      if (!adminRole) {
        throw new Error('Administrator role not created successfully');
      }

      // Create account with administrator role
      newAccount = await this.app.service('accounts').create({
        userId: newUser._id,
        workspaceId: newWorkspace._id,
        roleId: adminRole._id,
      });

      await this.app.service('users').patch(newUser._id, {
        currentWorkspaceId: newWorkspace._id,
      });

      return { 
        user: newUser, 
        workspace: newWorkspace, 
        role: adminRole, 
        account: newAccount 
      };
    } catch (error) {
      // Cleanup on error
      if (newAccount) {
        await this.app.service('accounts').remove(newAccount._id);
      }
      if (newRoles) {
        await Promise.all(newRoles.map(role => this.app.service('roles').remove(role._id)));
      }
      if (newWorkspace) {
        await this.app.service('workspaces').remove(newWorkspace._id);
      }
      if (newUser) {
        await this.app.service('users').remove(newUser._id);
      }
      throw error;
    }
  }
}