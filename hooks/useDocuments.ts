import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsRepository } from "@/repositories/DocumentsRepository";
import {
  Document,
  DocumentPatch,
  DocumentStatus,
} from "@/repositories/DocumentsRepository";
import { filesRepository } from "@/repositories/FilesRepository";
import { File } from "@/repositories/FilesRepository";
import { documentFieldsRepository } from "@/repositories/DocumentFieldsRepository";
import {
  DocumentField,
  DocumentFieldData,
  DocumentFieldPatch,
} from "@/repositories/DocumentFieldsRepository";
import { signatureFootprintRepository } from "@/repositories/SignatureFootprintRepository";
import { SignatureFootprint } from "@/repositories/SignatureFootprintRepository";
import { ContactsRepository } from "@/repositories/ContactsRepository";
import { Contact } from "@/repositories/ContactsRepository";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useState } from "react";

export const useDocuments = (
  documentId?: string,
  options?: { archived?: boolean }
) => {
  const { currentWorkspace, currentAccount } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "all">(
    "all"
  );
  const [sortField, setSortField] = useState<
    "title" | "createdAt" | "updatedAt"
  >("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const archived = options?.archived;

  const {
    data: documentData,
    isLoading: isDocumentLoading,
    error: documentError,
    refetch: refetchDocument,
  } = useQuery<Document | null>({
    queryKey: ["document", documentId],
    queryFn: async () => {
      if (!documentId) return null;
      return documentsRepository.get(documentId);
    },
    enabled: !!documentId,
  });

  const document = documentId ? (documentData as Document) : undefined;

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: [
      "documents",
      currentWorkspace?._id,
      searchTerm,
      filterStatus,
      sortField,
      sortDirection,
      skip,
      limit,
      archived,
    ],
    queryFn: async () => {
      if (!currentWorkspace?._id || !currentAccount?._id || documentId) {
        return {
          documents: [],
          total: 0,
          limit,
          skip,
        };
      }
      const query: {
        workspaceId: string;
        accountId: string;
        $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
        status?: DocumentStatus;
        $skip: number;
        $limit: number;
        $sort: { [key: string]: number };
        archived?: boolean;
      } = {
        workspaceId: currentWorkspace._id,
        accountId: String(currentAccount._id),
        $skip: skip,
        $limit: limit,
        $sort: {
          [sortField === "title"
            ? "title"
            : sortField === "createdAt"
            ? "createdAt"
            : "updatedAt"]: sortDirection === "asc" ? 1 : -1,
        },
      };
      if (typeof archived === "boolean") {
        query.archived = archived;
      }
      if (searchTerm) {
        const trimmedSearch = searchTerm.trim();
        query.$or = [
          { title: { $regex: trimmedSearch, $options: "i" } },
          { note: { $regex: trimmedSearch, $options: "i" } },
        ];
      }
      if (filterStatus !== "all") {
        query.status = filterStatus as DocumentStatus;
      }
      try {
        const result = await documentsRepository.find({ query });
        return {
          documents: Array.isArray(result) ? result : result.data || [],
          total: result.total || 0,
          limit: result.limit || limit,
          skip: result.skip || 0,
        };
      } catch (error) {
        console.error("Error fetching documents:", error);
        return {
          documents: [],
          total: 0,
          limit,
          skip,
        };
      }
    },
    enabled: !!currentWorkspace?._id && !!currentAccount?._id && !documentId,
  });

  const {
    data: fileData,
    isLoading: isFileLoading,
    error: fileError,
  } = useQuery<File>({
    queryKey: ["files", document?.fileId],
    queryFn: async () => {
      if (document?.fileId) {
        return filesRepository.get(document.fileId);
      }
      return null;
    },
    enabled: !!document?.fileId,
  });

  const {
    data: documentFields,
    isLoading: isDocumentFieldsLoading,
    error: documentFieldsError,
  } = useQuery<{ data: DocumentField[]; total: number }>({
    queryKey: ["document-fields", documentId],
    queryFn: async () => {
      if (documentId) {
        return documentFieldsRepository.findByDocumentId(documentId);
      }
      return [];
    },
    enabled: !!documentId,
  });

  const {
    data: signatureFootprintData,
    isLoading: isSignatureFootprintLoading,
    error: signatureFootprintError,
  } = useQuery<{ data: SignatureFootprint[]; total: number }>({
    queryKey: ["signature-footprint", documentId],
    queryFn: async () => {
      if (documentId) {
        return signatureFootprintRepository.find({
          query: {
            documentId: documentId,
          },
        });
      }
      return { data: [], total: 0 };
    },
    enabled: !!documentId,
  });

  console.log(signatureFootprintData);

  // Fetch contacts for document fields
  const {
    data: contactsData,
    isLoading: isContactsLoading,
    error: contactsError,
  } = useQuery<Contact[]>({
    queryKey: ["document-contacts", documentId, documentFields?.data],
    queryFn: async () => {
      if (!documentId || !documentFields?.data) {
        return [];
      }
      
      // Extract unique contact IDs from document fields
      const contactIds = [...new Set(
        documentFields.data
          .filter(field => field.contactId)
          .map(field => field.contactId)
      )] as string[];
      
      if (contactIds.length === 0) {
        return [];
      }
      
      // Fetch contacts by their IDs
      const contactsPromises = contactIds.map(contactId => 
        ContactsRepository.get(contactId)
      );
      
      try {
        const contacts = await Promise.all(contactsPromises);
        return contacts;
      } catch (error) {
        console.error("Error fetching contacts:", error);
        return [];
      }
    },
    enabled: !!documentId && !!documentFields?.data,
  });

  const updateDocument = useMutation({
    mutationFn: async (data: DocumentPatch) => {
      if (!documentId) {
        throw new Error("Document ID is required for update");
      }
      return documentsRepository.patch(documentId, data);
    },
    onSuccess: (updatedDocument) => {
      queryClient.setQueryData(["document", documentId], updatedDocument);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  // Document fields mutations
  const createDocumentField = useMutation({
    mutationFn: async (data: DocumentFieldData) => {
      return documentFieldsRepository.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-fields", documentId],
      });
    },
  });

  const updateDocumentField = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: DocumentFieldPatch;
    }) => {
      return documentFieldsRepository.patch(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-fields", documentId],
      });
    },
  });

  const searchDocuments = (search: string, status?: DocumentStatus | "all") => {
    setSearchTerm(search);
    if (status !== undefined) setFilterStatus(status);
    setSkip(0);
  };
  const handleSort = (
    field: "title" | "createdAt" | "updatedAt",
    direction: "asc" | "desc"
  ) => {
    setSortField(field);
    setSortDirection(direction);
    setSkip(0);
  };

  return {
    document,
    documents: documentsData?.documents || [],
    total: documentsData?.total || 0,
    skip: documentsData?.skip || 0,
    limit: documentsData?.limit || 10,
    setSkip,
    setLimit,
    sortField,
    sortDirection,
    handleSort,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    searchDocuments,
    isDocumentsLoading,
    isDocumentLoading,
    isFileLoading,
    documentsError,
    documentError,
    fileError,
    file: fileData,
    documentFields: documentFields?.data as DocumentField[],
    isDocumentFieldsLoading,
    documentFieldsError,
    signatureFootprintData: signatureFootprintData?.data as SignatureFootprint[],
    isSignatureFootprintLoading,
    signatureFootprintError,
    contacts: contactsData || [],
    isContactsLoading,
    contactsError,
    updateDocument,
    createDocumentField,
    updateDocumentField,
    refetch: refetchDocument,
  };
};
