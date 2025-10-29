import client from "@/services/FeathersClient";

export interface WorkspaceInviteData {
  email: string;
  name: string;
  workspaceId: string;
  roleId: string;
}

export interface WorkspaceInvite extends WorkspaceInviteData {
  id: string;
}

class WorkspaceInvitesRepository {
  private static serviceName = "workspace-invites";

  static async create(data: WorkspaceInviteData): Promise<WorkspaceInviteData> {
    try {
      const result = await client.service(this.serviceName).create(data);
      return result;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || 'Failed to create workspace invite');
    }
  }
}

export default WorkspaceInvitesRepository; 