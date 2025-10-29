import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { awsObjectStorageRepository } from "@/repositories/AwsObjectStorageRepository";
import {
  documentsRepository,
  Document,
  DocumentData,
  DocumentStatus,
} from "@/repositories/DocumentsRepository";
import { useWorkspace } from "./WorkspaceProvider";
import { useState } from "react";

interface DocumentContextType {
  uploadAndCreateDocument: (
    file: File,
    data: Omit<DocumentData, "fileId" | "creatorAccountId">
  ) => Promise<Document>;
  createDocumentFromTemplate: (
    data: Omit<DocumentData, "created_by">
  ) => Promise<Document>;
  documents: Document[];
  isLoading: boolean;
  error: Error | null;
  updateDocumentStatus: (
    id: string,
    status: DocumentStatus
  ) => Promise<Document>;
  searchDocuments: (searchTerm: string, status?: DocumentStatus, creatorId?: string) => void;
  total: number;
  skip: number;
  limit: number;
  setSkip: (skip: number) => void;
  setLimit: (limit: number) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const {
    currentUser: user,
    currentAccount: account,
    currentWorkspace,
  } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | undefined>();
  const [creatorFilter, setCreatorFilter] = useState<string | undefined>();
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);

  // Fetch documents for the current workspace with search and filter
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "documents",
      currentWorkspace?._id,
      searchTerm,
      statusFilter,
      creatorFilter,
      skip,
      limit,
    ],
    queryFn: async () => {
      try {
        const query: {
          workspaceId?: string;
          accountId?: string;
          $or?: Array<{ [key: string]: { $regex: string } }>;
          status?: DocumentStatus;
          creator_account_id?: string;
          $skip?: number;
          $limit?: number;
          $sort?: { [key: string]: 1 | -1 };
        } = {
          $skip: skip,
          $limit: limit,
          $sort: { createdAt: -1 }, // Sort by newest first
        };

        if (currentWorkspace?._id) query.workspaceId = currentWorkspace._id;
        if (account?._id) query.accountId = String(account._id);
        if (statusFilter) query.status = statusFilter;
        if (creatorFilter) query.creator_account_id = creatorFilter;
        if (searchTerm) {
          const trimmedSearch = searchTerm.trim();
          query.$or = [
            { title: { $regex: trimmedSearch } },
            { note: { $regex: trimmedSearch } },
          ];
        }

        const result = await documentsRepository.find({ query });
        return {
          documents: Array.isArray(result) ? result : result.data || [],
          total: result.total || 0,
          limit: result.limit || limit,
          skip: result.skip || 0,
        };
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        throw error;
      }
    },
    enabled: !!currentWorkspace?._id && !!account?._id,
  });

  // Updated mutation for uploading a file and creating a document
  const uploadMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      data: Omit<DocumentData, "fileId" | "creatorAccountId">;
    }) => {
      const { file, data } = params;
      if (!currentWorkspace?._id || !account?._id || !user?._id) {
        throw new Error("Workspace, account, or user not found");
      }

      // First upload to AWS
      const awsResponse = await awsObjectStorageRepository.upload({
        file: Buffer.from(await file.arrayBuffer()),
        filename: file.name,
        contentType: file.type,
        workspaceId: currentWorkspace._id,
        accountId: String(account._id),
      });

      console.log(awsResponse);

      // Create document record with all required fields
      const documentData: DocumentData = {
        title: data.title,
        note: data.note,
        templateId: data.templateId,
        fileId: awsResponse?._id,
        assignedAccountId: data.assignedAccountId,
        creatorAccountId: String(account._id!),
        status: data.status || DocumentStatus.PENDING,
        workspaceId: currentWorkspace._id,
      };

      return documentsRepository.create(documentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  // Mutation for updating document status
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: DocumentStatus;
    }) => {
      return documentsRepository.patch(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  // Mutation for creating a document from template
  const createFromTemplateMutation = useMutation({
    mutationFn: async (data: Omit<DocumentData, "creatorAccountId">) => {
      if (!currentWorkspace?._id || !account?._id || !user?._id) {
        throw new Error("Workspace, account, or user not found");
      }

      // Create document record with all required fields
      const documentData: DocumentData = {
        title: data.title,
        note: data.note,
        templateId: data.templateId,
        fileId: data.fileId,
        assignedAccountId: data.assignedAccountId,
        creatorAccountId: String(account._id!),
        status: data.status || DocumentStatus.PENDING,
        workspaceId: currentWorkspace._id,
      };

      return documentsRepository.create(documentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const value = {
    uploadAndCreateDocument: (
      file: File,
      data: Omit<DocumentData, "fileId" | "creatorAccountId">
    ) => uploadMutation.mutateAsync({ file, data }),
    createDocumentFromTemplate: (data: Omit<DocumentData, "created_by">) =>
      createFromTemplateMutation.mutateAsync(data),
    updateDocumentStatus: (id: string, status: DocumentStatus) =>
      statusMutation.mutateAsync({ id, status }),
    searchDocuments: (searchTerm: string, status?: DocumentStatus, creatorId?: string) => {
      setSearchTerm(searchTerm);
      setStatusFilter(status);
      setCreatorFilter(creatorId);
      setSkip(0); // Reset pagination when search changes
    },
    documents: data?.documents || [],
    total: data?.total || 0,
    skip: data?.skip || 0,
    limit: data?.limit || 10,
    setSkip,
    setLimit,
    isLoading,
    error: error as Error | null,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
