import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsRepository, TagData, TagPatch } from '@/repositories/TagsRepository';
import { Query } from '@feathersjs/feathers';

export const useTags = (query?: Query) => {
  return useQuery({
    queryKey: ['tags', query],
    queryFn: () => tagsRepository.find(query || {}),
  });
};

export const useTag = (id: string) => {
  return useQuery({
    queryKey: ['tags', id],
    queryFn: () => tagsRepository.get(id),
    enabled: !!id,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TagData) => tagsRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagPatch }) => 
      tagsRepository.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => tagsRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};
