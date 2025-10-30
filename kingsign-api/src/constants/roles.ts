export interface RolePermissions {
  name: string;
  isDefault: boolean;
  canCreate: boolean;
  canSign: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
}

export const DEFAULT_ROLES: { [key: string]: RolePermissions } = {
  ADMINISTRATOR: {
    name: 'Administrator',
    isDefault: true,
    canCreate: true,
    canSign: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canAssignRoles: true,
  },
  MANAGER: {
    name: 'Manager',
    isDefault: false,
    canCreate: true,
    canSign: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canAssignRoles: false,
  },
  DOCUMENT_CREATOR: {
    name: 'Document Creator',
    isDefault: false,
    canCreate: true,
    canSign: true,
    canView: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canAssignRoles: false,
  },
  SIGNER: {
    name: 'Signer',
    isDefault: false,
    canCreate: false,
    canSign: true,
    canView: true,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canAssignRoles: false,
  },
  REVIEWER: {
    name: 'Reviewer',
    isDefault: false,
    canCreate: false,
    canSign: false,
    canView: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canAssignRoles: false,
  },
  VIEWER: {
    name: 'Viewer',
    isDefault: false,
    canCreate: false,
    canSign: false,
    canView: true,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canAssignRoles: false,
  },
}; 