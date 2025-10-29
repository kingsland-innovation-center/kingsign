"use client";

import { useState } from "react";
import { IconPlus, IconEdit, IconTrash, IconBell, IconToggleLeft, IconToggleRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { NotificationIntegration, NotificationType } from "@/repositories/NotificationIntegrationsRepository";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationIntegrationsListProps {
  integrations: NotificationIntegration[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (integration: NotificationIntegration) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}

const getNotificationTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.DOCUMENT_COMPLETED:
      return "Document Completed";
    case NotificationType.DOCUMENT_UPDATED:
      return "Document Updated";
    default:
      return type;
  }
};

const getNotificationTypeBadgeVariant = (type: NotificationType): "default" | "secondary" => {
  switch (type) {
    case NotificationType.DOCUMENT_COMPLETED:
      return "default";
    case NotificationType.DOCUMENT_UPDATED:
      return "secondary";
    default:
      return "default";
  }
};

export default function NotificationIntegrationsList({
  integrations,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onToggleEnabled,
}: NotificationIntegrationsListProps) {
  const [deleteIntegrationId, setDeleteIntegrationId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteIntegrationId) {
      onDelete(deleteIntegrationId);
      setDeleteIntegrationId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-medium">Notification Integrations</h2>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <IconBell className="h-5 w-5" />
              <h2 className="text-base font-medium">Notification Integrations</h2>
            </div>
            <Button onClick={onAdd}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.length > 0 ? (
                  integrations.map((integration) => (
                    <TableRow key={integration._id}>
                      <TableCell className="font-medium">
                        {integration.name}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {integration.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getNotificationTypeBadgeVariant(integration.notificationType)}>
                          {getNotificationTypeLabel(integration.notificationType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleEnabled(integration._id!, !integration.isEnabled)}
                            className="p-1 h-auto"
                          >
                            {integration.isEnabled ? (
                              <IconToggleRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <IconToggleLeft className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                          <span className={`text-sm ${integration.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {integration.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {integration.createdAt ? 
                          new Date(integration.createdAt).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(integration)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteIntegrationId(integration._id!)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <IconBell className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No notification integrations found</p>
                        <p className="text-xs text-gray-400">Add your first integration to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteIntegrationId} onOpenChange={() => setDeleteIntegrationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification integration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
