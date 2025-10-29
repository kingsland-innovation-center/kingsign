import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { awsObjectStorageRepository } from "@/repositories/AwsObjectStorageRepository";
import {
  templatesRepository,
  TemplateData,
  Template,
} from "@/repositories/TemplatesRepository";
import {
  templateFieldsRepository,
  TemplateFieldData,
  TemplateFieldPatch,
  TemplateField,
} from "@/repositories/TemplateFieldsRepository";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useState } from "react";
import { filesRepository } from "@/repositories/FilesRepository";
import { File as FileType } from "@/repositories/FilesRepository";

export const useTemplates = (templateId?: string, options?: { archived?: boolean }) => {
  const {
    currentUser: user,
    currentAccount: account,
    currentWorkspace,
  } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState<"name" | "createdAt" | "updatedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const archived = options?.archived;

  // Fetch single template if templateId is provided
  const {
    data: templateData,
    isLoading: isTemplateLoading,
    error: templateError,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      return templatesRepository.get(templateId);
    },
    enabled: !!templateId,
  });

  const template = templateId ? (templateData as Template) : undefined;

  const {
    data: fileData,
    isLoading: isFileLoading,
    error: fileError,
  } = useQuery<FileType>({
    queryKey: ["files", template?.fileId],
    queryFn: async () => {
      if (template?.fileId) {
        return filesRepository.get(template.fileId);
      }
      return null;
    },
    enabled: !!template?.fileId,
  });

  // Fetch templates for the current workspace with search
  const {
    data: templatesData,
    isLoading: isTemplatesLoading,
    error: templatesError,
  } = useQuery({
    queryKey: [
      "templates",
      currentWorkspace?._id,
      searchTerm,
      skip,
      limit,
      sortField,
      sortDirection,
      archived,
    ],
    queryFn: async () => {
      if (!currentWorkspace?._id || !account?._id) {
        return {
          templates: [],
          total: 0,
          limit,
          skip,
        };
      }

      const query: {
        $skip: number;
        $limit: number;
        $sort: { [key: string]: number };
        workspaceId: string;
        accountId: string;
        $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
        archived?: boolean;
      } = {
        $skip: skip,
        $limit: limit,
        $sort: { [sortField === "name" ? "name" : sortField === "createdAt" ? "created_at" : "updated_at"]: sortDirection === "asc" ? 1 : -1 },
        workspaceId: currentWorkspace._id,
        accountId: String(account._id),
      };

      if (typeof archived === "boolean") {
        query.archived = archived;
      }

      if (searchTerm) {
        const trimmedSearch = searchTerm.trim();
        const regex = `(?i)${trimmedSearch}`;
        query.$or = [
          { name: { $regex: regex, $options: 'i' } },
          { description: { $regex: regex, $options: 'i' } },
        ];
      }

      try {
        const result = await templatesRepository.find({ query });
        return {
          templates: Array.isArray(result) ? result : result.data || [],
          total: result.total || 0,
          limit: result.limit || limit,
          skip: result.skip || 0,
        };
      } catch (error) {
        console.error("Error fetching templates:", error);
        return {
          templates: [],
          total: 0,
          limit,
          skip,
        };
      }
    },
    enabled: !!currentWorkspace?._id && !!account?._id && !templateId,
  });

  // Fetch template fields if templateId is provided
  const {
    data: templateFieldsData,
    isLoading: isTemplateFieldsLoading,
    error: templateFieldsError,
  } = useQuery<TemplateField[]>({
    queryKey: ["template-fields", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const result = await templateFieldsRepository.find({
        query: {
          templateId: templateId,
        },
      });
      return Array.isArray(result) ? result : result.data || [];
    },
    enabled: !!templateId,
  });

  // Mutation for uploading a file and creating a template
  const uploadMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      data: Omit<TemplateData, "fileId" | "createdBy">;
    }) => {
      const { file, data } = params;
      if (!currentWorkspace?._id || !account?._id || !user?._id) {
        throw new Error("Workspace, account, or user not found");
      }

      // First upload to AWS
      // Validate file exists and has content
      if (!file) {
        throw new Error("No file provided");
      }
      
      if (file.size === 0) {
        throw new Error("File is empty");
      }
      
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      
      const arrayBuffer = await file.arrayBuffer();
      console.log("ArrayBuffer length:", arrayBuffer.byteLength);
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("File content is empty after reading");
      }
      
      const uint8Array = new Uint8Array(arrayBuffer);
      const buffer = Buffer.from(uint8Array);
      
      console.log("Buffer details:", {
        isBuffer: Buffer.isBuffer(buffer),
        length: buffer.length
      });
      
      const awsResponse = await awsObjectStorageRepository.upload({
        file: buffer,
        filename: file.name,
        contentType: file.type,
        workspaceId: currentWorkspace._id,
        accountId: String(account._id),
      });

      // Create template record with all required fields
      const templateData: TemplateData = {
        name: data.name,
        description: data.description,
        fileId: awsResponse?._id,
        workspaceId: currentWorkspace._id,
        createdBy: String(user._id),
      };

      return templatesRepository.create(templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  // Mutation for creating a template field
  const createFieldMutation = useMutation({
    mutationFn: async (data: TemplateFieldData) => {
      return templateFieldsRepository.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    },
  });

  // Mutation for removing a template field
  const removeFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      return templateFieldsRepository.remove(fieldId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    },
  });

  // Mutation for updating a template field
  const updateFieldMutation = useMutation({
    mutationFn: async (params: { id: string; data: TemplateFieldPatch }) => {
      const { id, data } = params;
      return templateFieldsRepository.patch(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    },
  });

  const searchTemplates = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setSkip(0); // Reset pagination when search changes
  };

  const handleSort = (field: "name" | "createdAt" | "updatedAt", direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
    setSkip(0); // Reset pagination when sort changes
  };

  return {
    uploadAndCreateTemplate: (
      file: File,
      data: Omit<TemplateData, "fileId" | "createdBy">
    ) => uploadMutation.mutateAsync({ file, data }),
    createField: (data: TemplateFieldData) =>
      createFieldMutation.mutateAsync(data),
    removeField: (fieldId: string) => removeFieldMutation.mutateAsync(fieldId),
    updateField: (id: string, data: TemplateFieldPatch) =>
      updateFieldMutation.mutateAsync({ id, data }),
    searchTemplates,
    handleSort,
    sortField,
    sortDirection,
    templates: templatesData?.templates || [],
    template: template || null,
    file: fileData,
    templateFields: templateFieldsData || [],
    isTemplateFieldsLoading,
    templateFieldsError,
    total: templatesData?.total || 0,
    skip: templatesData?.skip || 0,
    limit: templatesData?.limit || 10,
    setSkip,
    setLimit,
    isTemplatesLoading,
    isTemplateLoading,
    isFileLoading,
    templatesError,
    templateError,
    fileError,
  };
};
