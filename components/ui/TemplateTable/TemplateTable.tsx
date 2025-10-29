"use client";

import { useState, useEffect, MouseEvent } from "react";
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
import { format } from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  FileText,
  Trash2,
  Archive,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTemplates } from "@/hooks/useTemplates";
import { appPath } from "@/lib/utils";
import { Template } from "@/repositories/TemplatesRepository";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContent,
  DialogDescription as AlertDialogDescription,
  DialogFooter as AlertDialogFooter,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogClose as AlertDialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { templatesRepository } from "@/repositories/TemplatesRepository";

type SortField = "name" | "createdAt" | "updatedAt";

export function TemplateTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const {
    templates,
    isTemplatesLoading,
    searchTemplates,
    total,
    skip,
    limit,
    setSkip,
    setLimit,
    handleSort,
    sortField,
    sortDirection,
  } = useTemplates();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        searchTemplates(search);
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, searchTemplates]);

  const onSort = (field: SortField) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    handleSort(field, newDirection);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await templatesRepository.remove(templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete template");
      console.error("Delete template error:", error);
    },
  });

  const handleDeleteTemplate = (
    e: MouseEvent<HTMLButtonElement>,
    templateId: string
  ) => {
    e.stopPropagation(); // Prevent row click event
    deleteTemplateMutation.mutate(templateId);
  };

  const archiveTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await templatesRepository.patch(templateId, { archived: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template archived successfully");
    },
    onError: (error) => {
      toast.error("Failed to archive template");
      console.error("Archive template error:", error);
    },
  });

  const handleArchiveTemplate = (
    e: MouseEvent<HTMLButtonElement>,
    templateId: string
  ) => {
    e.stopPropagation();
    archiveTemplateMutation.mutate(templateId);
  };

  const [openDialog, setOpenDialog] = useState<{
    id: string;
    type: "archive" | "delete" | null;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px] pl-9"
            />
          </div>
          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(Number(value))}
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
        <Button onClick={() => router.push(appPath.dashboard.templatesCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort("name")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Name
                  <ArrowUpDown
                    className={cn(
                      "h-4 w-4",
                      sortField === "name" && "text-primary"
                    )}
                  />
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort("createdAt")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Created At
                  <ArrowUpDown
                    className={cn(
                      "h-4 w-4",
                      sortField === "createdAt" && "text-primary"
                    )}
                  />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort("updatedAt")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Updated At
                  <ArrowUpDown
                    className={cn(
                      "h-4 w-4",
                      sortField === "updatedAt" && "text-primary"
                    )}
                  />
                </Button>
              </TableHead>
              <TableHead className="w-[100]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTemplatesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[300px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-64 text-center align-middle"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-12">
                    <FileText className="h-8 w-8 mb-1" />
                    <p className="text-lg font-medium">No templates found</p>
                    {search ? (
                      <p className="text-sm">Try adjusting your search</p>
                    ) : (
                      <p className="text-sm">
                        Templates you create will appear here.
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template: Template) => (
                <TableRow
                  key={template._id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  )}
                  onClick={() =>
                    router.push(
                      `/dashboard/templates/edit?templateId=${template._id}`
                    )
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(
                        `/dashboard/templates/edit?templateId=${template._id}`
                      );
                    }
                  }}
                >
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-gray-500">
                    {template.description || "-"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(template.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(template.updatedAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Archive"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setOpenDialog({ id: template._id, type: "archive" });
                        }}
                      >
                        <Archive className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Delete"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setOpenDialog({ id: template._id, type: "delete" });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      {openDialog?.id === template._id &&
                        openDialog?.type === "archive" && (
                          <AlertDialog
                            open={true}
                            onOpenChange={(open) =>
                              open
                                ? setOpenDialog({
                                    id: template._id,
                                    type: "archive",
                                  })
                                : setOpenDialog(null)
                            }
                          >
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Archive Template
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to archive this
                                  template? You can restore it from the Archive
                                  section.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogClose asChild>
                                  <Button
                                    variant="outline"
                                    onClick={(
                                      e: MouseEvent<HTMLButtonElement>
                                    ) => e.stopPropagation()}
                                  >
                                    Cancel
                                  </Button>
                                </AlertDialogClose>
                                <Button
                                  onClick={(
                                    e: MouseEvent<HTMLButtonElement>
                                  ) => {
                                    handleArchiveTemplate(e, template._id);
                                    setOpenDialog(null);
                                  }}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                                  disabled={
                                    archiveTemplateMutation.isLoading &&
                                    archiveTemplateMutation.variables ===
                                      template._id
                                  }
                                >
                                  {archiveTemplateMutation.isLoading &&
                                  archiveTemplateMutation.variables ===
                                    template._id
                                    ? "Archiving..."
                                    : "Archive"}
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      {openDialog?.id === template._id &&
                        openDialog?.type === "delete" && (
                          <AlertDialog
                            open={true}
                            onOpenChange={(open) =>
                              open
                                ? setOpenDialog({
                                    id: template._id,
                                    type: "delete",
                                  })
                                : setOpenDialog(null)
                            }
                          >
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Template
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Warning: This action will permanently delete
                                  this template. This action cannot be undone.
                                  Are you sure you want to proceed?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogClose asChild>
                                  <Button
                                    variant="outline"
                                    onClick={(
                                      e: MouseEvent<HTMLButtonElement>
                                    ) => e.stopPropagation()}
                                  >
                                    Cancel
                                  </Button>
                                </AlertDialogClose>
                                <Button
                                  onClick={(
                                    e: MouseEvent<HTMLButtonElement>
                                  ) => {
                                    handleDeleteTemplate(e, template._id);
                                    setOpenDialog(null);
                                  }}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete Template
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {templates.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkip(skip - limit)}
              disabled={skip === 0}
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
              onClick={() => setSkip(skip + limit)}
              disabled={skip + limit >= total}
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
