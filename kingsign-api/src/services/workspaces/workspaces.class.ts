import { Service, MongooseServiceOptions } from 'feathers-mongoose';
import { Application } from '../../declarations';
import { Params } from '@feathersjs/feathers';
import { ObjectId } from 'mongoose';
import { decryptApiKey, encryptApiKey } from '../../utils/encryption';
import crypto from 'crypto';
import { apiKeyPrefix } from '../../utils/constants';

export class Workspaces extends Service {
  app: Application;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  /**
   * Custom method to fetch workspaces for a specific user
   * @param userId - The ID of the user to fetch workspaces for
   * @param params - Feathers params object containing authentication info
   * @returns Array of workspaces the user has access to
   */
  async getUserWorkspaces(userId: ObjectId, params?: Params) {
    try {
      // Find all accounts for this user
      const accounts = await this.app.service('accounts').find({
        query: {
          userId: userId
        }
      });

      const accountsData = Array.isArray(accounts) ? accounts : accounts.data;

      if (!accountsData || accountsData.length === 0) {
        return [];
      }

      // Extract workspace IDs from accounts
      const workspaceIds = accountsData.map((account: any) => account.workspaceId);

      // Fetch workspaces and populate with user role information
      const workspaces = await this.app.service('workspaces').find({
        query: {
          _id: { $in: workspaceIds }
        }
      });

      const workspacesData = Array.isArray(workspaces) ? workspaces : workspaces.data;

      // Enrich workspace data with user role information
      const enrichedWorkspaces = await Promise.all(
        workspacesData.map(async (workspace: any) => {
          const userAccount = accountsData.find(
            (account: any) => account.workspaceId.toString() === workspace._id.toString()
          );

          if (userAccount) {
            const role = await this.app.service('roles').get(userAccount.roleId);
            
            return {
              ...workspace,
            };
          }
          
          return workspace;
        })
      );

      return enrichedWorkspaces;
    } catch (error: any) {
      throw new Error(`Failed to fetch user workspaces: ${error.message}`);
    }
  }

  async generateApiKey(workspaceId: string) {
    const key = apiKeyPrefix + encryptApiKey(workspaceId);
    const workspace = await this.app.service('workspaces').patch(workspaceId, { apiKey: key });
    return workspace;
  }
}
