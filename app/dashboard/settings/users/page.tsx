/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useState } from "react";
import AddUserModal from "@/components/ui/AddUserModal";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./components/skeleton";
import { toast } from "sonner";
import { User } from "@/repositories/UserRepository";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";

// Define base types
interface UserBase {
  name: string;
  email: string;
  roleId: string;
}

type UserInput = UserBase;

interface UserWithId extends Omit<UserBase, 'roleId'> {
  _id: string; // MongoDB ID
}

type TableHeader = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

const TABLE_HEADERS: TableHeader[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "actions", label: "Actions", align: "right" },
];

const UsersTable = ({
  users,
  onAddClick,
  isLoading,
  session,
}: {
  users: UserWithId[];
  onAddClick: () => void;
  isLoading: boolean;
  session: Session | null;
}) => (
  <div className="rounded-md border">
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        {/* <h2 className="text-base font-medium">Contactbook</h2> */}
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <IconUpload className="h-4 w-4" />
          </Button>
          <Button onClick={onAddClick}>
            <IconPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
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
              {users.length > 0 ? (
                users.map((user, index) => (
                  <TableRow key={user._id || `row-${index}`}>
                    <TableCell className="capitalize">
                      {user.name}
                      {session?.user?.email === user.email && " (You)"}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          toast.info("Edit functionality coming soon");
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500">No users found</p>
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

export default function UsersPage() {
  const { 
    users, 
    isLoadingUsers, 
    inviteUser,
    currentWorkspace,
    roles
  } = useWorkspace();
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddUser = async (newUser: UserInput) => {
    try {
      if (!currentWorkspace?._id) {
        throw new Error("No workspace selected");
      }

      console.log({currentWorkspace})

      // Invite the user with the selected role
      await inviteUser({
        name: newUser.name,
        email: newUser.email,
        workspaceId: currentWorkspace._id,
        roleId: newUser.roleId
      });

      setIsModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to invite user";
      toast.error(errorMessage);
      console.error("Error inviting user:", error);
    }
  };

  // Convert User[] to UserWithId[] with type assertion for _id and ensure every item has a unique ID
  const displayUsers: UserWithId[] = users.map((user, index) => ({
    _id: typeof user.id === 'string' ? user.id : `temp-id-${index}`,
    name: user.name || '',
    email: user.email || '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">User Management</h1>
      </div>
      <UsersTable 
        users={displayUsers} 
        onAddClick={() => setIsModalOpen(true)}
        isLoading={isLoadingUsers}
        session={session}
      />

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddUser}
        roles={roles}
      />
    </div>
  );
} 