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
import { IconTemplate } from "@tabler/icons-react";
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
import {
  Dialog as AlertDialog,
  DialogContent as AlertDialogContent,
  DialogDescription as AlertDialogDescription,
  DialogFooter as AlertDialogFooter,
  DialogHeader as AlertDialogHeader,
  DialogTitle as AlertDialogTitle,
  DialogClose as AlertDialogClose,
} from "@/components/ui/dialog";
import { useTemplates } from "@/hooks/useTemplates";

export default function ArchivedTemplatesPage() {
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const {
    templates,
    total,
    limit,
    setLimit,
    skip,
    setSkip,
    sortField,
    sortDirection,
    handleSort,
    searchTemplates,
    isTemplatesLoading,
  } = useTemplates(undefined, { archived: true });

  const [search, setSearch] = useState("");
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (value: string) => {
    setSearch(value);
    searchTemplates(value);
    setSkip(0);
  };

  const setPage = (newPage: number) => {
    setSkip((newPage - 1) * limit);
  };

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      setLoadingId(id);
      await featherClient.service("templates").patch(id, { archived: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setLoadingId(null);
    },
    onError: () => setLoadingId(null),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Archived Templates</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search Name"
                value={search}
                onChange={(e) => {
                  handleSearch(e.target.value);
                }}
                className="w-[300px] pl-9"
              />
            </div>
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
                <TableHead className="w-[60%] align-middle">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleSort(
                        "name",
                        sortField === "name" && sortDirection === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                    className="flex items-center gap-1 justify-start px-0 text-left hover:bg-transparent active:bg-transparent focus:bg-transparent"
                  >
                    Name
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[25%] align-middle">
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
                <TableHead className="w-[15%] align-middle">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTemplatesLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="items-center">
                    <TableCell colSpan={3} className="h-12 align-middle">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="h-6 w-1/4 bg-gray-200 rounded" />
                        <div className="h-6 w-1/6 bg-gray-200 rounded" />
                        <div className="h-8 w-24 bg-gray-200 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : templates.length === 0 ? (
                <TableRow className="items-center">
                  <TableCell
                    colSpan={3}
                    className="h-64 text-center align-middle"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 py-12">
                      <IconTemplate
                        size={40}
                        stroke={1.5}
                        className="text-gray-400"
                      />
                      <p className="text-lg font-medium">
                        No archived templates found
                      </p>
                      <p className="text-sm">
                        Templates you archive will appear here.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl: any) => (
                  <TableRow
                    key={tpl._id}
                    className="hover:bg-gray-50 items-center"
                  >
                    <TableCell className="flex items-center h-full min-h-[48px] gap-2 font-medium align-middle">
                      <IconTemplate
                        size={20}
                        stroke={1.5}
                        className="text-gray-400"
                      />
                      {tpl.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        Archived
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      {tpl.updatedAt
                        ? new Date(tpl.updatedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="align-middle">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Unarchive"
                        onClick={() => setOpenDialog(tpl._id)}
                        disabled={loadingId === tpl._id}
                      >
                        <RotateCcw className="h-4 w-4 text-blue-600" />
                      </Button>
                      {openDialog === tpl._id && (
                        <AlertDialog
                          open={true}
                          onOpenChange={(open: boolean) =>
                            open ? setOpenDialog(tpl._id) : setOpenDialog(null)
                          }
                        >
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Unarchive Template
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to unarchive this
                                template? It will be restored to your main
                                templates list.
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
                                  unarchiveMutation.mutate(tpl._id);
                                  setOpenDialog(null);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loadingId === tpl._id}
                              >
                                {loadingId === tpl._id
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
