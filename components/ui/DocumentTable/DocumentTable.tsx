"use client";

import { useState, useEffect, MouseEvent, useMemo } from "react";
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
import { DocumentStatus } from "@/repositories/DocumentsRepository";
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
import { useDocuments } from "@/hooks/useDocuments";
import { useWorkspace } from "@/providers/WorkspaceProvider";
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
import { documentsRepository } from "@/repositories/DocumentsRepository";

type SortField =
  | "title"
  | "templateName"
  | "status"
  | "creator"
  | "assignee"
  | "createdAt"
  | "updatedAt";
type SortDirection = "asc" | "desc";

export function DocumentTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "all">(
    "all"
  );
  const [filterCreator, setFilterCreator] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const {
    documents,
    total,
    skip,
    limit,
    setSkip,
    setLimit,
    isDocumentsLoading,
  } = useDocuments();

  const { findAccountWithUser, accounts } = useWorkspace();
  const [openDialog, setOpenDialog] = useState<{
    id: string;
    type: "archive" | "delete" | null;
  } | null>(null);

  // Get unique creators from accounts
  const creators = useMemo(() => {
    const uniqueCreators = new Map();
    accounts.forEach((account) => {
      if (account._id) {
        const accountWithUser = findAccountWithUser(String(account._id));
        if (accountWithUser?.user) {
          uniqueCreators.set(account._id, {
            id: account._id,
            name: accountWithUser.user.name || "Unknown User",
          });
        }
      }
    });
    return Array.from(uniqueCreators.values());
  }, [accounts, findAccountWithUser]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "title":
        return direction * a.title.localeCompare(b.title);
      case "templateName":
        return direction * a.template.name.localeCompare(b.template.name);
      case "status":
        return direction * a.status.localeCompare(b.status);
      case "creator":
        return (
          direction *
          getUserName(a.creator_account_id).localeCompare(
            getUserName(b.creator_account_id)
          )
        );
      case "assignee":
        const aAssignee = a.assigned_account_id
          ? getUserName(a.assigned_account_id)
          : "Unassigned";
        const bAssignee = b.assigned_account_id
          ? getUserName(b.assigned_account_id)
          : "Unassigned";
        return direction * aAssignee.localeCompare(bAssignee);
      case "createdAt":
      case "updatedAt":
        return (
          direction *
          (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime())
        );
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  const handlePreviousPage = () => {
    if (skip > 0) {
      setSkip(skip - limit);
    }
  };

  const handleNextPage = () => {
    if (skip + limit < total) {
      setSkip(skip + limit);
    }
  };

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await documentsRepository.remove(documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete document");
      console.error("Delete document error:", error);
    },
  });

  const handleDeleteDocument = (
    e: MouseEvent<HTMLButtonElement>,
    documentId: string
  ) => {
    e.stopPropagation(); // Prevent row click event
    deleteDocumentMutation.mutate(documentId);
  };

  // Archive document mutation
  const archiveDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await documentsRepository.patch(documentId, { archived: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document archived successfully");
    },
    onError: (error) => {
      toast.error("Failed to archive document");
      console.error("Archive document error:", error);
    },
  });

  const handleArchiveDocument = (
    e: MouseEvent<HTMLButtonElement>,
    documentId: string
  ) => {
    e.stopPropagation();
    archiveDocumentMutation.mutate(documentId);
  };

  const getUserName = (accountId: string) => {
    const accountWithUser = findAccountWithUser(accountId);
    return accountWithUser?.user?.name || "Unknown User";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search Title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px] pl-9"
            />
          </div>
          <Select
            value={filterStatus}
            onValueChange={(value) =>
              setFilterStatus(value as DocumentStatus | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={DocumentStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={DocumentStatus.SIGNED}>Signed</SelectItem>
              <SelectItem value={DocumentStatus.COMPLETED}>
                Completed
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCreator} onValueChange={setFilterCreator}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by creator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              {creators.map((creator) => (
                <SelectItem key={creator.id} value={creator.id}>
                  {creator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Button
          onClick={() => router.push("/dashboard/documents/create-document")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Document
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Title
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("templateName")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Template Name
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
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
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("creator")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Creator
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("assignee")}
                  className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                >
                  Assignee
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
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
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isDocumentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedDocuments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-64 text-center align-middle"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-12">
                    <FileText className="h-8 w-8 mb-1" />
                    <p className="text-lg font-medium">No documents found</p>
                    {search ? (
                      <p className="text-sm">Try adjusting your search</p>
                    ) : (
                      <p className="text-sm">
                        Documents you create will appear here.
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedDocuments.map((doc) => (
                <TableRow
                  key={doc._id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  )}
                  onClick={() =>
                    router.push(
                      `/dashboard/documents/sign?documentId=${doc._id}`
                    )
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(
                        `/dashboard/documents/sign?documentId=${doc._id}`
                      );
                    }
                  }}
                >
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell className="font-medium">
                    {doc.template?.name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${
                        doc.status === DocumentStatus.COMPLETED
                          ? "bg-green-100 text-green-800"
                          : doc.status === DocumentStatus.SIGNED
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {doc.status ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>{getUserName(doc.creator_account_id)}</TableCell>
                  <TableCell>
                    {doc.assigned_account_id
                      ? getUserName(doc.assigned_account_id)
                      : "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.updatedAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Archive"
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setOpenDialog({ id: doc._id, type: "archive" });
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
                          setOpenDialog({ id: doc._id, type: "delete" });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {openDialog?.id === doc._id &&
                      openDialog?.type === "archive" && (
                        <AlertDialog
                          open={true}
                          onOpenChange={(open) =>
                            open
                              ? setOpenDialog({ id: doc._id, type: "archive" })
                              : setOpenDialog(null)
                          }
                        >
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Archive Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to archive this document?
                                You can restore it from the Archive section.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogClose asChild>
                                <Button
                                  variant="outline"
                                  onClick={(e: MouseEvent<HTMLButtonElement>) =>
                                    e.stopPropagation()
                                  }
                                >
                                  Cancel
                                </Button>
                              </AlertDialogClose>
                              <Button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  handleArchiveDocument(e, doc._id);
                                  setOpenDialog(null);
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                                disabled={
                                  archiveDocumentMutation.isLoading &&
                                  archiveDocumentMutation.variables === doc._id
                                }
                              >
                                {archiveDocumentMutation.isLoading &&
                                archiveDocumentMutation.variables === doc._id
                                  ? "Archiving..."
                                  : "Archive"}
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    {openDialog?.id === doc._id &&
                      openDialog?.type === "delete" && (
                        <AlertDialog
                          open={true}
                          onOpenChange={(open) =>
                            open
                              ? setOpenDialog({ id: doc._id, type: "delete" })
                              : setOpenDialog(null)
                          }
                        >
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this document?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogClose asChild>
                                <Button
                                  variant="outline"
                                  onClick={(e: MouseEvent<HTMLButtonElement>) =>
                                    e.stopPropagation()
                                  }
                                >
                                  Cancel
                                </Button>
                              </AlertDialogClose>
                              <Button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  handleDeleteDocument(e, doc._id);
                                  setOpenDialog(null);
                                }}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {sortedDocuments.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
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
              onClick={handleNextPage}
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
