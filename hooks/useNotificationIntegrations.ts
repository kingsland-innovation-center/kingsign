import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  NotificationIntegrationsRepository,
  NotificationIntegration,
  CreateNotificationIntegrationInput,
  UpdateNotificationIntegrationInput,
  NotificationIntegrationData,
  NotificationIntegrationPatch
} from "@/repositories/NotificationIntegrationsRepository";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { Query } from '@feathersjs/feathers';

export const useNotificationIntegrations = (query?: Query) => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Query for fetching notification integrations
  const {
    data: integrations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notification-integrations", currentWorkspace?._id, query],
    queryFn: () => {
      if (!currentWorkspace?._id) {
        throw new Error("No workspace selected");
      }
      return NotificationIntegrationsRepository.findByWorkspace(currentWorkspace._id, { query });
    },
    enabled: !!currentWorkspace?._id,
  });

  // Create notification integration mutation
  const createIntegration = useMutation({
    mutationFn: async (data: CreateNotificationIntegrationInput) => {
      if (!currentWorkspace?._id) {
        throw new Error("No workspace selected");
      }
      return NotificationIntegrationsRepository.create({
        ...data,
        isEnabled: data.isEnabled ?? true,
        workspaceId: currentWorkspace._id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-integrations"] });
    },
  });

  // Update notification integration mutation
  const updateIntegration = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNotificationIntegrationInput }) => {
      return NotificationIntegrationsRepository.patch(id, data);
    },
    onSuccess: (updatedIntegration) => {
      queryClient.setQueryData(["notification-integrations", updatedIntegration._id], updatedIntegration);
      queryClient.invalidateQueries({ queryKey: ["notification-integrations"] });
    },
  });

  // Delete notification integration mutation
  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      return NotificationIntegrationsRepository.remove(id);
    },
    onSuccess: (deletedIntegration) => {
      queryClient.removeQueries({ queryKey: ["notification-integrations", deletedIntegration._id] });
      queryClient.invalidateQueries({ queryKey: ["notification-integrations"] });
    },
  });

  return {
    // Data
    integrations,
    
    // Loading states
    isLoading,
    
    // Errors
    error,
    
    // Actions
    refetch,
    createIntegration: (data: CreateNotificationIntegrationInput) => 
      createIntegration.mutateAsync(data),
    updateIntegration: (id: string, data: UpdateNotificationIntegrationInput) => 
      updateIntegration.mutateAsync({ id, data }),
    deleteIntegration: (id: string) => deleteIntegration.mutateAsync(id),
    
    // Mutation states
    isCreating: createIntegration.isLoading,
    isUpdating: updateIntegration.isLoading,
    isDeleting: deleteIntegration.isLoading,
    createError: createIntegration.error,
    updateError: updateIntegration.error,
    deleteError: deleteIntegration.error,
  };
};

export const useNotificationIntegration = (id: string) => {
  return useQuery({
    queryKey: ["notification-integrations", id],
    queryFn: () => NotificationIntegrationsRepository.get(id),
    enabled: !!id,
  });
};

export const useCreateNotificationIntegration = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateNotificationIntegrationInput) => {
      if (!currentWorkspace?._id) {
        throw new Error("No workspace selected");
      }
      return NotificationIntegrationsRepository.create({
        ...data,
        isEnabled: data.isEnabled ?? true,
        workspaceId: currentWorkspace._id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-integrations"] });
    },
  });
};

export const useUpdateNotificationIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationIntegrationInput }) => 
      NotificationIntegrationsRepository.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-integrations"] });
    },
  });
};

export const useDeleteNotificationIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => NotificationIntegrationsRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-integrations"] });
    },
  });
};
