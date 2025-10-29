import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DocumentEmailsRepository, 
  DocumentEmail, 
  CreateDocumentEmailInput, 
  SendDocumentEmailInput,
  SendDocumentEmailResponse 
} from '@/repositories/DocumentEmailsRepository';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export const useDocumentEmails = (documentId?: string) => {
  const { currentWorkspace } = useWorkspace();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const workspaceId = currentWorkspace?._id;
  const userId = session?.user?._id;

  const {
    data: documentEmails = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['document-emails', workspaceId, documentId],
    queryFn: () => {
      if (documentId) {
        return DocumentEmailsRepository.findByDocument(documentId);
      }
      return DocumentEmailsRepository.findByWorkspace(workspaceId!);
    },
    enabled: !!workspaceId && (!!documentId || !documentId),
  });

  const createDocumentEmailMutation = useMutation({
    mutationFn: (data: CreateDocumentEmailInput) =>
      DocumentEmailsRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-emails', workspaceId] });
      toast.success('Document email record created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create document email record');
    },
  });

  const sendDocumentEmailMutation = useMutation({
    mutationFn: (data: SendDocumentEmailInput) =>
      DocumentEmailsRepository.sendDocumentEmail(data),
    onSuccess: (response: SendDocumentEmailResponse) => {
      queryClient.invalidateQueries({ queryKey: ['document-emails', workspaceId] });
      toast.success(`Email sent successfully to ${response.emailSent.to}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send document email');
    },
  });

  const sendDocumentEmailToMultipleContactsMutation = useMutation({
    mutationFn: (data: Omit<SendDocumentEmailInput, 'contactId'> & { contactIds: string[] }) =>
      DocumentEmailsRepository.sendDocumentEmailToMultipleContacts(data),
    onSuccess: (responses: SendDocumentEmailResponse[]) => {
      queryClient.invalidateQueries({ queryKey: ['document-emails', workspaceId] });
      const successCount = responses.length;
      toast.success(`Successfully sent ${successCount} email${successCount !== 1 ? 's' : ''}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send document emails');
    },
  });

  const getDocumentEmailsByContact = (contactId: string) => {
    return useQuery({
      queryKey: ['document-emails', 'contact', contactId],
      queryFn: () => DocumentEmailsRepository.findByContact(contactId),
      enabled: !!contactId,
    });
  };

  const sendDocumentEmail = async (data: {
    contactId: string;
    documentId: string;
    emailTemplateId: string;
  }) => {
    const currentWorkspaceId = currentWorkspace?._id;
    const currentUserId = session?.user?._id;
    
    if (!currentWorkspaceId || !currentUserId) {
      throw new Error('Workspace or user not available');
    }

    return sendDocumentEmailMutation.mutateAsync({
      ...data,
      workspaceId: currentWorkspaceId,
      userId: currentUserId,
    });
  };

  const sendDocumentEmailToMultipleContacts = async (data: {
    contactIds: string[];
    documentId: string;
    emailTemplateId: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
  }) => {
    const currentWorkspaceId = currentWorkspace?._id;
    const currentUserId = session?.user?._id;
    
    console.log({currentWorkspaceId, currentUserId});
    if (!currentWorkspaceId || !currentUserId) {
      throw new Error('Workspace or user not available');
    }

    return sendDocumentEmailToMultipleContactsMutation.mutateAsync({
      ...data,
      workspaceId: currentWorkspaceId,
      userId: currentUserId,
    });
  };

  return {
    documentEmails,
    isLoading,
    error,
    refetch,
    createDocumentEmail: createDocumentEmailMutation.mutateAsync,
    sendDocumentEmail,
    sendDocumentEmailToMultipleContacts,
    isCreating: createDocumentEmailMutation.isLoading,
    isSending: sendDocumentEmailMutation.isLoading,
    isSendingMultiple: sendDocumentEmailToMultipleContactsMutation.isLoading,
    getDocumentEmailsByContact,
  };
};

export const useDocumentEmailsByContact = (contactId: string) => {
  return useQuery({
    queryKey: ['document-emails', 'contact', contactId],
    queryFn: () => DocumentEmailsRepository.findByContact(contactId),
    enabled: !!contactId,
  });
};

export const useDocumentEmailsByDocument = (documentId: string) => {
  return useQuery({
    queryKey: ['document-emails', 'document', documentId],
    queryFn: () => DocumentEmailsRepository.findByDocument(documentId),
    enabled: !!documentId,
  });
};
