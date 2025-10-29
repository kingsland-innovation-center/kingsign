import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  EmailTemplatesRepository, 
  EmailTemplate, 
  CreateEmailTemplateInput, 
  UpdateEmailTemplateInput 
} from '@/repositories/EmailTemplatesRepository';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { toast } from 'sonner';

export const useEmailTemplates = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = currentWorkspace?._id;

  const {
    data: emailTemplates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['email-templates', workspaceId],
    queryFn: () => EmailTemplatesRepository.findByWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const createEmailTemplateMutation = useMutation({
    mutationFn: (data: CreateEmailTemplateInput) =>
      EmailTemplatesRepository.create({
        ...data,
        workspaceId: workspaceId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', workspaceId] });
      toast.success('Email template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create email template');
    },
  });

  const updateEmailTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailTemplateInput }) =>
      EmailTemplatesRepository.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', workspaceId] });
      toast.success('Email template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update email template');
    },
  });

  const deleteEmailTemplateMutation = useMutation({
    mutationFn: (id: string) => EmailTemplatesRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', workspaceId] });
      toast.success('Email template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete email template');
    },
  });

  const getEmailTemplate = (id: string) => {
    return useQuery({
      queryKey: ['email-template', id],
      queryFn: () => EmailTemplatesRepository.get(id),
      enabled: !!id,
    });
  };

  return {
    emailTemplates,
    isLoading,
    error,
    refetch,
    createEmailTemplate: createEmailTemplateMutation.mutateAsync,
    updateEmailTemplate: updateEmailTemplateMutation.mutateAsync,
    deleteEmailTemplate: deleteEmailTemplateMutation.mutateAsync,
    isCreating: createEmailTemplateMutation.isPending,
    isUpdating: updateEmailTemplateMutation.isPending,
    isDeleting: deleteEmailTemplateMutation.isPending,
    getEmailTemplate,
  };
};

export const useEmailTemplate = (id: string) => {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: () => EmailTemplatesRepository.get(id),
    enabled: !!id,
  });
};


