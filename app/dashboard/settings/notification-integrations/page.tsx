"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useNotificationIntegrations } from "@/hooks/useNotificationIntegrations";
import {
  NotificationIntegration,
  CreateNotificationIntegrationInput,
  UpdateNotificationIntegrationInput,
} from "@/repositories/NotificationIntegrationsRepository";
import NotificationIntegrationsList from "./components/NotificationIntegrationsList";
import NotificationIntegrationForm from "./components/NotificationIntegrationForm";

export default function NotificationIntegrationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<NotificationIntegration | undefined>();

  const {
    integrations,
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    isCreating,
    isUpdating,
  } = useNotificationIntegrations();


  const handleAdd = () => {
    setEditingIntegration(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (integration: NotificationIntegration) => {
    setEditingIntegration(integration);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIntegration(id);
      toast.success("Notification integration deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete integration");
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await updateIntegration(id, { isEnabled: enabled });
      toast.success(`Integration ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update integration");
    }
  };

  const handleFormSubmit = async (data: CreateNotificationIntegrationInput | UpdateNotificationIntegrationInput) => {
    try {
      if (editingIntegration) {
        await updateIntegration(editingIntegration._id!, data as UpdateNotificationIntegrationInput);
        toast.success("Notification integration updated successfully");
      } else {
        await createIntegration(data as CreateNotificationIntegrationInput);
        toast.success("Notification integration created successfully");
      }
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save integration");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingIntegration(undefined);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Notification Integrations</h1>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Failed to load notification integrations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Notification Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Configure webhook endpoints to receive notifications when events occur in your workspace
          </p>
        </div>
      </div>

      <NotificationIntegrationsList
        integrations={integrations}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleEnabled={handleToggleEnabled}
      />

      <NotificationIntegrationForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        integration={editingIntegration}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
}
