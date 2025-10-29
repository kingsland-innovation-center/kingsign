"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { WorkspaceRepository, Workspace, WorkspaceData, WorkspacePatch } from "@/repositories/WorkspaceRepository";
import { AccountsRepository, Account, AccountData, AccountPatch } from "@/repositories/AccountsRepository";
import { RolesRepository, Role, RoleData, RolePatch } from "@/repositories/RolesRepository";
import { UserRepository, User } from "@/repositories/UserRepository";
import WorkspaceInvitesRepository, { WorkspaceInviteData } from "@/repositories/WorkspaceInvitesRepository";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

// Type definition for account with user data
export type AccountWithUser = Account & {
  user: User | undefined;
};

type WorkspaceContextType = {
  // Workspace
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoadingWorkspaces: boolean;
  createWorkspace: (data: WorkspaceData) => Promise<Workspace>;
  updateWorkspace: (id: string, data: WorkspacePatch) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  generateApiKey: () => Promise<Workspace>;

  // Current User and Account
  currentUser: User | null;
  currentAccount: Account | null;

  // Accounts
  accounts: Account[];
  isLoadingAccounts: boolean;
  createAccount: (data: AccountData) => Promise<void>;
  updateAccount: (id: string, data: AccountPatch) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountsWithUsers: () => AccountWithUser[];
  findAccountWithUser: (id: string) => AccountWithUser | undefined;

  // Roles
  roles: Role[];
  isLoadingRoles: boolean;
  createRole: (data: RoleData) => Promise<void>;
  updateRole: (id: string, data: RolePatch) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;

  // Users
  users: User[];
  isLoadingUsers: boolean;
  createUser: (data: Partial<User>) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  inviteUser: (data: WorkspaceInviteData) => Promise<void>;
};

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  // Workspace Queries
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces", session?.user?._id] as const,
    queryFn: async () => {
      return WorkspaceRepository.findUserWorkspaces();
    },
    enabled: !!session?.user?._id,
  });

  // Set initial workspace based on URL param or first available workspace
  useEffect(() => {
    if (!workspacesData) return;
    
    const workspace = workspaceId 
      ? workspacesData.find(w => w._id === workspaceId)
      : workspacesData[0];
    
    if (workspace && (!currentWorkspace || currentWorkspace._id !== workspace._id)) {
      setCurrentWorkspace(workspace);
    }
  }, [workspaceId, workspacesData, currentWorkspace]);

  // Accounts Queries
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts", currentWorkspace?._id] as const,
    queryFn: async () => {
      if (!currentWorkspace?._id) return [];
      return AccountsRepository.findWorkspaceAccounts(currentWorkspace._id);
    },
    enabled: !!currentWorkspace?._id,
  });

  // Roles Queries
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles", currentWorkspace?._id] as const,
    queryFn: async () => {
      if (!currentWorkspace?._id) return [];
      return RolesRepository.findWorkspaceRoles(currentWorkspace._id);
    },
    enabled: !!currentWorkspace?._id,
  });

  // Users Queries
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", currentWorkspace?._id] as const,
    queryFn: async () => {
      if (!currentWorkspace?._id) return [];
      
      // First get all accounts for the current workspace
      const workspaceAccounts = await AccountsRepository.findWorkspaceAccounts(currentWorkspace._id);
      
      if (!workspaceAccounts.length) return [];

      // Get unique user IDs from the accounts
      const userIds = [...new Set(workspaceAccounts.map(account => account.userId))];

      // Fetch only the users that have accounts in this workspace
      const users = await UserRepository.find({
        query: {
          _id: {
            $in: userIds
          }
        }
      });

      return users;
    },
    enabled: !!currentWorkspace?._id,
  });

  // Get current user and account
  const currentUser = usersData?.find(user => user._id === session?.user?._id) || null;
  const currentAccount = accountsData?.find(account => account.userId.toString() === session?.user?._id) || null;

  // Workspace Mutations
  const { mutateAsync: createWorkspace } = useMutation({
    mutationFn: async (data: WorkspaceData) => {
      const workspace = await WorkspaceRepository.create(data);
      toast.success("Workspace created successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      return workspace;
    },
  });

  const { mutateAsync: updateWorkspace } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkspacePatch }) => {
      const workspace = await WorkspaceRepository.patch(id, data);
      toast.success("Workspace updated successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      return workspace;
    },
  });

  const { mutateAsync: deleteWorkspace } = useMutation({
    mutationFn: async (id: string) => {
      await WorkspaceRepository.remove(id);
      toast.success("Workspace deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  const { mutateAsync: generateApiKey } = useMutation({
    mutationFn: async () => {
      const workspace = await WorkspaceRepository.generateApiKey(currentWorkspace?._id || "");
      toast.success("API key generated successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      return workspace;
    },
  });

  // Account Mutations
  const { mutateAsync: createAccount } = useMutation({
    mutationFn: async (data: AccountData) => {
      await AccountsRepository.create(data);
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { mutateAsync: updateAccount } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AccountPatch }) => {
      await AccountsRepository.patch(id, data);
      toast.success("Account updated successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { mutateAsync: deleteAccount } = useMutation({
    mutationFn: async (id: string) => {
      await AccountsRepository.remove(id);
      toast.success("Account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Role Mutations
  const { mutateAsync: createRole } = useMutation({
    mutationFn: async (data: RoleData) => {
      await RolesRepository.create(data);
      toast.success("Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const { mutateAsync: updateRole } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RolePatch }) => {
      await RolesRepository.patch(id, data);
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const { mutateAsync: deleteRole } = useMutation({
    mutationFn: async (id: string) => {
      await RolesRepository.remove(id);
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  // User Mutations
  const { mutateAsync: createUser } = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const user = await UserRepository.create(data);
      if (!user) throw new Error("Failed to create user");
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      return user;
    },
  });

  const { mutateAsync: updateUser } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      await UserRepository.patch(id, data);
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const { mutateAsync: deleteUser } = useMutation({
    mutationFn: async (id: string) => {
      await UserRepository.remove(id);
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  // Invite User Mutation
  const { mutateAsync: inviteUser } = useMutation({
    mutationFn: async (data: WorkspaceInviteData) => {
      await WorkspaceInvitesRepository.create(data);
      toast.success("User invited successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Helper function to get accounts with their respective user data
  const getAccountsWithUsers = (): AccountWithUser[] => {
    if (!accountsData || !usersData) return [];
    
    return accountsData.map(account => ({
      ...account,
      user: usersData.find(user => user._id === account.userId)
    }));
  };

  // Helper function to find an account by ID with its user data
  const findAccountWithUser = (id: string): AccountWithUser | undefined => {
    if (!accountsData || !usersData) return undefined;
    
    const account = accountsData.find(acc => acc._id === id);
    if (!account) return undefined;

    return {
      ...account,
      user: usersData.find(user => user._id === account.userId)
    };
  };

  // console.log({
  //   // Workspace
  //   currentWorkspace,
  //   workspaces: workspacesData,
  //   isLoadingWorkspaces,
  //   createWorkspace,
  //   deleteWorkspace,
  //   setCurrentWorkspace,

  //   // Current User and Account
  //   currentUser,
  //   currentAccount,

  //   // Accounts
  //   accounts: accountsData || [],
  //   isLoadingAccounts,
  //   createAccount,
  //   deleteAccount,
  //   getAccountsWithUsers,
  //   findAccountWithUser,

  //   // Roles
  //   roles: rolesData || [],
  //   isLoadingRoles,
  //   createRole,
  //   deleteRole,

  //   // Users
  //   users: usersData || [],
  //   isLoadingUsers,
  //   createUser,
  //   deleteUser,
  //   inviteUser,
  // })

  return (
    <WorkspaceContext.Provider
      value={{
        // Workspace
        currentWorkspace,
        workspaces: workspacesData || [],
        isLoadingWorkspaces,
        createWorkspace,
        updateWorkspace: (id, data) => updateWorkspace({ id, data }),
        deleteWorkspace,
        setCurrentWorkspace,
        generateApiKey,

        // Current User and Account
        currentUser,
        currentAccount,

        // Accounts
        accounts: accountsData || [],
        isLoadingAccounts,
        createAccount,
        updateAccount: (id, data) => updateAccount({ id, data }),
        deleteAccount,
        getAccountsWithUsers,
        findAccountWithUser,

        // Roles
        roles: rolesData || [],
        isLoadingRoles,
        createRole,
        updateRole: (id, data) => updateRole({ id, data }),
        deleteRole,

        // Users
        users: usersData || [],
        isLoadingUsers,
        createUser,
        updateUser: (id, data) => updateUser({ id, data }),
        deleteUser,
        inviteUser,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

// Custom hooks for specific workspace data
export const useWorkspaceMembers = () => {
  const { users, isLoadingUsers } = useWorkspace();
  return { members: users, isLoading: isLoadingUsers };
};

export const useWorkspaceRoles = () => {
  const { roles, isLoadingRoles } = useWorkspace();
  return { roles: roles, isLoading: isLoadingRoles };
};

export const useWorkspaceAccounts = () => {
  const { accounts, isLoadingAccounts } = useWorkspace();
  return { accounts: accounts, isLoading: isLoadingAccounts };
};

export const useCurrentWorkspace = () => {
  const { currentWorkspace, isLoadingWorkspaces } = useWorkspace();
  return { workspace: currentWorkspace, isLoading: isLoadingWorkspaces };
}; 