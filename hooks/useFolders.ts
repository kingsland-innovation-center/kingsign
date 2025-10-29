import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersRepository, FolderData, FolderPatch } from '@/repositories/FoldersRepository';
import { Query } from '@feathersjs/feathers';

export const useFolders = (query?: Query) => {
  return useQuery({
    queryKey: ['folders', query],
    queryFn: () => foldersRepository.find(query || {}),
  });
};

export const useFolder = (id: string) => {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => foldersRepository.get(id),
    enabled: !!id,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FolderData) => foldersRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FolderPatch }) => 
      foldersRepository.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => foldersRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
};
