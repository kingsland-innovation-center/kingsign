"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import featherClient from "@/services/FeathersClient";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RotateCcw, Search } from "lucide-react";
import { IconScript } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { DocumentStatus } from "@/repositories/DocumentsRepository";
import {
  Dialog as AlertDialog,
  DialogContent as AlertDialogContent,
  DialogDescription as AlertDialogDescription,
  DialogFooter as AlertDialogFooter,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogClose as AlertDialogClose,
} from "@/components/ui/dialog";
import { useDocuments } from "@/hooks/useDocuments";

export default function ArchivedDocumentsPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const {
    documents,
    total,
    limit,
    setLimit,
    skip,
    setSkip,
    sortField,
    sortDirection,
    handleSort,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    isDocumentsLoading,
  } = useDocuments(undefined, { archived: true });

  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSkip(0);
  };

  const setPage = (newPage: number) => {
    setSkip((newPage - 1) * limit);
  };

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      setLoadingId(id);
      await featherClient.service("documents").patch(id, { archived: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["documents", currentWorkspace?._id]);
      setLoadingId(null);
    },
    onError: () => setLoadingId(null),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Archived Documents</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search Title"
                value={searchTerm}
                onChange={(e) => {
                  handleSearch(e.target.value);
                }}
                className="w-[300px] pl-9"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                setFilterStatus(value as any);
                setPage(1);
              }}
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
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                setPage(1);
              }}
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="items-center">
                <TableHead className="w-[40%] align-middle">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleSort(
                        "title",
                        sortField === "title" && sortDirection === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                    className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                  >
                    Title
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[20%] align-middle">Status</TableHead>
                <TableHead className="w-[20%] align-middle">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleSort(
                        "updatedAt",
                        sortField === "updatedAt" && sortDirection === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                    className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                  >
                    Date Archived
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[20%] align-middle">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDocumentsLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="items-center">
                    <TableCell colSpan={4} className="h-12 align-middle">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="h-6 w-1/4 bg-gray-200 rounded" />
                        <div className="h-6 w-1/6 bg-gray-200 rounded" />
                        <div className="h-8 w-24 bg-gray-200 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow className="items-center">
                  <TableCell
                    colSpan={4}
                    className="h-64 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-12">
                      <IconScript
                        size={40}
                        stroke={1.5}
                        className="text-gray-400"
                      />
                      <p className="text-lg font-medium">
                        No archived documents found
                      </p>
                      <p className="text-sm">
                        Documents you archive will appear here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc: any) => (
                  <TableRow
                    key={doc._id}
                    className="hover:bg-gray-50 items-center"
                  >
                    <TableCell className="flex items-center h-full min-h-[48px] gap-2 font-medium align-middle">
                      <IconScript
                        size={20}
                        stroke={1.5}
                        className="text-gray-400"
                      />
                      {doc.title}
                      <Badge variant="outline" className="ml-2 text-xs">
                        Archived
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      <span
                        className={`px-2 py-1 rounded-full text-xs capitalize ${
                          doc.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : doc.status === "signed"
                            ? "bg-blue-100 text-blue-800"
                            : doc.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {doc.status ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">
                      {doc.updatedAt
                        ? new Date(doc.updatedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Unarchive"
                        onClick={() => setOpenDialog(doc._id)}
                        disabled={loadingId === doc._id}
                      >
                        <RotateCcw className="h-4 w-4 text-blue-600" />
                      </Button>
                      {openDialog === doc._id && (
                        <AlertDialog
                          open={true}
                          onOpenChange={(open: boolean) =>
                            open ? setOpenDialog(doc._id) : setOpenDialog(null)
                          }
                        >
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Unarchive Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to unarchive this
                                document? It will be restored to your main
                                documents list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogClose asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => setOpenDialog(null)}
                                >
                                  Cancel
                                </Button>
                              </AlertDialogClose>
                              <Button
                                onClick={() => {
                                  unarchiveMutation.mutate(doc._id);
                                  setOpenDialog(null);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loadingId === doc._id}
                              >
                                {loadingId === doc._id
                                  ? "Unarchiving..."
                                  : "Unarchive"}
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
        {total > 0 && (
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="text-sm text-gray-500">
              Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
