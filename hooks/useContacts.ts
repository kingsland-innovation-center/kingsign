import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactsRepository, Contact, ContactData, ContactPatch } from "@/repositories/ContactsRepository";
import { useState } from "react";
import { useWorkspace } from "@/providers/WorkspaceProvider";

export const useContacts = (contactId?: string) => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Query key based on whether we're fetching single contact or all contacts
  const queryKey = contactId ? ["contacts", contactId] : ["contacts"];

  // Fetch single contact or all contacts
  const {
    data: contactData,
    isLoading: isContactsLoading,
    error: contactsError,
    refetch: refetchContacts,
  } = useQuery<Contact | Contact[]>({
    queryKey,
    queryFn: async () => {
      if (contactId) {
        return ContactsRepository.get(contactId);
      }
      return ContactsRepository.find({
        query: {
          workspaceId: currentWorkspace?._id,
        }
      });
    },
    enabled: !!currentWorkspace?._id,
  });

  // Extract single contact or contacts list based on contactId
  const contact = contactId ? (contactData as Contact) : undefined;
  const contacts = !contactId ? (Array.isArray(contactData) ? contactData : (contactData as any)?.data || []) : undefined;

  // Search contacts by email
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useQuery<Contact[]>({
    queryKey: ["contacts", "search", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      return ContactsRepository.findByEmail(searchTerm.trim());
    },
    enabled: !!searchTerm.trim(),
  });

  // Create contact mutation
  const createContact = useMutation({
    mutationFn: async (data: ContactData) => {
      return ContactsRepository.create(data);
    },
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  // Update contact mutation
  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContactPatch }) => {
      return ContactsRepository.patch(id, data);
    },
    onSuccess: (updatedContact) => {
      queryClient.setQueryData(["contacts", updatedContact._id], updatedContact);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  // Delete contact mutation
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      return ContactsRepository.remove(id);
    },
    onSuccess: (deletedContact) => {
      queryClient.removeQueries({ queryKey: ["contacts", deletedContact._id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  // Search function
  const searchContactsByEmail = (email: string) => {
    setSearchTerm(email);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  return {
    // Data
    contact,
    contacts,
    searchResults,
    
    // Loading states
    isLoading: isContactsLoading,
    isSearchLoading,
    
    // Errors
    error: contactsError,
    searchError,
    
    // Actions
    refetch: refetchContacts,
    createContact: (data: ContactData) => createContact.mutateAsync({...data, workspaceId: currentWorkspace?._id || "" }),
    updateContact: (id: string, data: ContactPatch) => 
      updateContact.mutateAsync({ id, data }),
    deleteContact: (id: string) => deleteContact.mutateAsync(id),
    searchContactsByEmail,
    clearSearch,
    
    // Mutation states
    isCreating: createContact.isLoading,
    isUpdating: updateContact.isLoading,
    isDeleting: deleteContact.isLoading,
    createError: createContact.error,
    updateError: updateContact.error,
    deleteError: deleteContact.error,
  };
}; 