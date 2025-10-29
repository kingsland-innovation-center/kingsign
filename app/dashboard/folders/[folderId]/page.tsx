"use client";

import { useState, useEffect, MouseEvent, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFolder } from "@/hooks/useFolders";
import { useTags } from "@/hooks/useTags";
import { documentsRepository } from "@/repositories/DocumentsRepository";
import { templatesRepository } from "@/repositories/TemplatesRepository";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { FolderFilterType } from "@/repositories/FoldersRepository";
import { DocumentStatus } from "@/repositories/DocumentsRepository";
import { format } from "date-fns";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  FileText,
  BookTemplateIcon,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortField = "title" | "name" | "status" | "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

function FilterTypeIcon({ filterType }: { filterType: FolderFilterType }) {
  switch (filterType) {
    case FolderFilterType.DOCUMENTS:
      return <FileText className="w-5 h-5" />;
    case FolderFilterType.TEMPLATES:
      return <BookTemplateIcon className="w-5 h-5" />;
    default:
      return <FolderOpen className="w-5 h-5" />;
  }
}

export default function FolderViewPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "all">("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { currentWorkspace } = useWorkspace();
  
  // Get folder details
  const { data: folder, isLoading: isFolderLoading, error: folderError } = useFolder(folderId);
  
  // Get tags for display
  const { data: tagsData } = useTags({ 
    query: { workspaceId: currentWorkspace?._id }
  });
  const availableTags = tagsData?.data || [];

  // Get documents or templates based on folder type
  const { data: documentsData, isLoading: isDocumentsLoading, error: documentsError } = useQuery({
    queryKey: ["folder-documents", folderId, currentPage, pageSize, search, filterStatus, folder?.tagIds],
    queryFn: async () => {
      if (!currentWorkspace?._id || !folder?.tagIds?.length) {
        return { data: [], total: 0, limit: pageSize, skip: (currentPage - 1) * pageSize };
      }

      const query: any = {
        workspaceId: currentWorkspace._id,
        tagIds: { $in: folder.tagIds },
        archived: false,
        $limit: pageSize,
        $skip: (currentPage - 1) * pageSize,
      };
      
      if (search) query.title = { $regex: search, $options: 'i' };
      if (filterStatus !== "all") query.status = filterStatus;
      
      try {
        const result = await documentsRepository.find({ query });
        return result;
      } catch (error) {
        console.error("Error fetching documents:", error);
        return { data: [], total: 0, limit: pageSize, skip: (currentPage - 1) * pageSize };
      }
    },
    enabled: !!folder && !!currentWorkspace?._id && folder.filterType === FolderFilterType.DOCUMENTS,
    staleTime: 30000, // 30 seconds
    retry: 2
  });

  const { data: templatesData, isLoading: isTemplatesLoading, error: templatesError } = useQuery({
    queryKey: ["folder-templates", folderId, currentPage, pageSize, search, folder?.tagIds],
    queryFn: async () => {
      if (!currentWorkspace?._id || !folder?.tagIds?.length) {
        return { data: [], total: 0, limit: pageSize, skip: (currentPage - 1) * pageSize };
      }

      const query: any = {
        workspaceId: currentWorkspace._id,
        tagIds: { $in: folder.tagIds },
        archived: false,
        $limit: pageSize,
        $skip: (currentPage - 1) * pageSize,
      };
      
      if (search) query.name = { $regex: search, $options: 'i' };
      
      try {
        const result = await templatesRepository.find({ query });
        return result;
      } catch (error) {
        console.error("Error fetching templates:", error);
        return { data: [], total: 0, limit: pageSize, skip: (currentPage - 1) * pageSize };
      }
    },
    enabled: !!folder && !!currentWorkspace?._id && folder.filterType === FolderFilterType.TEMPLATES,
    staleTime: 30000, // 30 seconds
    retry: 2
  });

  // Handle folder not found or error
  useEffect(() => {
    if (folderError) {
      toast.error("Folder not found");
      router.push("/dashboard/folders");
    }
  }, [folderError, router]);

  // Handle query errors
  useEffect(() => {
    if (documentsError) {
      console.error("Documents query error:", documentsError);
      toast.error("Failed to load documents");
    }
  }, [documentsError]);

  useEffect(() => {
    if (templatesError) {
      console.error("Templates query error:", templatesError);
      toast.error("Failed to load templates");
    }
  }, [templatesError]);

  if (isFolderLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">Folder not found</h2>
        <p className="text-gray-500 mb-4">The folder you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push("/dashboard/folders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Folders
        </Button>
      </div>
    );
  }

  const folderTags = availableTags.filter((tag: any) => folder.tagIds.includes(tag._id));
  const isDocumentView = folder.filterType === FolderFilterType.DOCUMENTS;
  const isTemplateView = folder.filterType === FolderFilterType.TEMPLATES;
  
  const documents = documentsData?.data || [];
  const templates = templatesData?.data || [];
  const total = documentsData?.total || templatesData?.total || 0;
  
  // Only show loading if the relevant query is loading and we don't have data yet
  const isLoading = (isDocumentView && isDocumentsLoading && !documentsData) || 
                   (isTemplateView && isTemplatesLoading && !templatesData);

  const items = isDocumentView ? documents : templates;
  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction * aValue.localeCompare(bValue);
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction * (aValue.getTime() - bValue.getTime());
    }
    
    return 0;
  });

  const handleRowClick = (item: any) => {
    if (isDocumentView) {
      router.push(`/dashboard/documents/sign?documentId=${item._id}`);
    } else {
      router.push(`/dashboard/templates/edit?templateId=${item._id}`);
    }
  };

  // Debug info (temporary)
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug info:', {
      folder: !!folder,
      currentWorkspace: !!currentWorkspace,
      folderTagsLength: folder?.tagIds?.length || 0,
      isDocumentView,
      isTemplateView,
      documentsData,
      templatesData,
      isDocumentsLoading,
      isTemplatesLoading,
      isLoading
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/folders")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Folders
        </Button>
        <div className="flex items-center gap-3">
          <FilterTypeIcon filterType={folder.filterType} />
          <div>
            <h1 className="text-3xl font-bold">{folder.name}</h1>
            {folder.description && (
              <p className="text-gray-600 mt-1">{folder.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Folder Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Folder Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Filter Type:</div>
              <Badge variant="outline" className="text-sm">
                <FilterTypeIcon filterType={folder.filterType} />
                <span className="ml-2">
                  {folder.filterType === FolderFilterType.DOCUMENTS ? "Documents Only" : "Templates Only"}
                </span>
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Filter Tags:</div>
              <div className="flex flex-wrap gap-1">
                {folderTags.map((tag: any) => (
                  <Badge 
                    key={tag._id}
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={`Search ${isDocumentView ? 'documents' : 'templates'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px] pl-9"
            />
          </div>
          
          {isDocumentView && (
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as DocumentStatus | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={DocumentStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={DocumentStatus.SIGNED}>Signed</SelectItem>
                <SelectItem value={DocumentStatus.COMPLETED}>Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Select
            value={String(pageSize)}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort(isDocumentView ? "title" : "name")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  {isDocumentView ? "Title" : "Name"}
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              
              {isDocumentView && (
                <>
                  <TableHead>Template</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                    >
                      Status
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                </>
              )}
              
              {isTemplateView && (
                <TableHead>Description</TableHead>
              )}
              
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Created At
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("updatedAt")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Updated At
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  {isDocumentView && (
                    <>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </>
                  )}
                  {isTemplateView && (
                    <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                  )}
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                </TableRow>
              ))
            ) : sortedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isDocumentView ? 5 : 4}
                  className="h-64 text-center align-middle"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-12">
                    <FilterTypeIcon filterType={folder.filterType} />
                    <p className="text-lg font-medium">
                      No {isDocumentView ? 'documents' : 'templates'} found
                    </p>
                    <p className="text-sm">
                      {search 
                        ? "Try adjusting your search or filters" 
                        : `No ${isDocumentView ? 'documents' : 'templates'} match the selected tags`
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item: any) => (
                <TableRow
                  key={item._id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  )}
                  onClick={() => handleRowClick(item)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleRowClick(item);
                    }
                  }}
                >
                  <TableCell className="font-medium">
                    {isDocumentView ? item.title : item.name}
                  </TableCell>
                  
                  {isDocumentView && (
                    <>
                      <TableCell>{item.template?.name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs capitalize ${
                            item.status === DocumentStatus.COMPLETED
                              ? "bg-green-100 text-green-800"
                              : item.status === DocumentStatus.SIGNED
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.status || "-"}
                        </span>
                      </TableCell>
                    </>
                  )}
                  
                  {isTemplateView && (
                    <TableCell className="text-gray-500">
                      {item.description || "-"}
                    </TableCell>
                  )}
                  
                  <TableCell>
                    {format(new Date(item.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.updatedAt), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {sortedItems.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
