"use client";

import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useState } from "react";
import { Permission, PermissionLabels } from "@/components/ui/RoleFormModal";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./components/skeleton";
import { toast } from "sonner";
import { Role, RoleData } from "@/repositories/RolesRepository";
import { PaginatedResponse } from "@/repositories/WorkspaceRepository";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Badge
} from "@/components/ui/badge";
import RoleFormModal, { RoleFormData } from "@/components/ui/RoleFormModal";

type TableHeader = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

const TABLE_HEADERS: TableHeader[] = [
  { key: "name", label: "Name" },
  { key: "default", label: "Default" },
  { key: "permissions", label: "Permissions" },
  { key: "actions", label: "Actions", align: "right" },
];

const PermissionBadge = ({ label, enabled }: { label: string; enabled: boolean }) => (
  <Badge variant={enabled ? "default" : "outline"} className="mr-1 mb-1">
    {label}
  </Badge>
);

const RolesTable = ({
  roles,
  onAddClick,
  onEditClick,
  onDeleteClick,
  isLoading,
}: {
  roles: Role[];
  onAddClick: () => void;
  onEditClick: (role: Role) => void;
  onDeleteClick: (role: Role) => void;
  isLoading: boolean;
}) => (
  <div className="rounded-md border">
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        {/* <h2 className="text-base font-medium">Roles & Permissions</h2> */}
        <div className="flex gap-2">
          <Button onClick={onAddClick}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {TABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header.key}
                    className={header.align === "right" ? "text-right" : ""}
                  >
                    {header.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      {role.isDefault ? (
                        <Badge variant="default">Default</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="flex flex-wrap">
                        {/* Use Permission enum to ensure type safety */}
                        {Object.values(Permission).map(permission => {
                          const permissionKey = permission as keyof typeof role;
                          const permissionValue = role[permissionKey] as boolean;
                          return permissionValue ? (
                            <PermissionBadge 
                              key={permission}
                              label={PermissionLabels[permission]} 
                              enabled={permissionValue} 
                            />
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditClick(role)}
                        className="mr-1"
                        disabled={role.isDefault}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteClick(role)}
                        disabled={role.isDefault}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500">No roles found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  </div>
);

export default function RolesPage() {
  const { 
    roles: rolesData,
    isLoadingRoles,
    createRole,
    deleteRole,
    updateRole,
    currentWorkspace
  } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Extract roles from the paginated response
  const roles: Role[] = Array.isArray(rolesData) ? rolesData : (rolesData as PaginatedResponse<Role>)?.data || [];

  const handleAddRole = async (roleFormData: RoleFormData) => {
    try {
      if (!currentWorkspace?._id) {
        throw new Error("No workspace selected");
      }

      // Add workspaceId to the role data
      const roleData: RoleData = {
        ...roleFormData,
        workspaceId: currentWorkspace._id,
      };

      await createRole(roleData);
      setIsModalOpen(false);
      toast.success("Role created successfully");
    } catch (error) {
      toast.error("Failed to create role");
      console.error("Error creating role:", error);
    }
  };

  const handleEditRole = async (roleFormData: RoleFormData) => {
    try {
      if (!selectedRole?._id) {
        throw new Error("No role selected for editing");
      }

      if (selectedRole.isDefault) {
        toast.error("Cannot edit default role");
        return;
      }

      const roleData: RoleData = {
        ...roleFormData,
        workspaceId: selectedRole.workspaceId,
      };

      await updateRole(selectedRole._id.toString(), roleData);
      setIsModalOpen(false);
      setSelectedRole(null);
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
      console.error("Error updating role:", error);
    }
  };

  const openEditModal = (role: Role) => {
    if (role.isDefault) {
      toast.error("Default roles cannot be edited");
      return;
    }

    setSelectedRole({...role}); // Create a new reference to trigger useEffect
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedRole(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      if (role.isDefault) {
        toast.error("Cannot delete the default role");
        return;
      }

      // Confirm before deleting
      if (!confirm(`Are you sure you want to delete the ${role.name} role?`)) {
        return;
      }

      await deleteRole(role._id as string);
      toast.success("Role deleted successfully");
    } catch (error) {
      toast.error("Failed to delete role");
      console.error("Error deleting role:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Role Management</h1>
      </div>
      <RolesTable
        roles={roles}
        onAddClick={openAddModal}
        onEditClick={openEditModal}
        onDeleteClick={handleDeleteRole}
        isLoading={isLoadingRoles}
      />

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddRole}
        onEdit={handleEditRole}
        mode={modalMode}
        initialData={selectedRole ? {
          name: selectedRole.name,
          isDefault: selectedRole.isDefault,
          canCreate: selectedRole.canCreate || false,
          canSign: selectedRole.canSign || false,
          canView: selectedRole.canView || true,
          canEdit: selectedRole.canEdit || false,
          canDelete: selectedRole.canDelete || false,
          canManageUsers: selectedRole.canManageUsers || false,
          canAssignRoles: selectedRole.canAssignRoles || false,
        } : undefined}
      />
    </div>
  );
} 