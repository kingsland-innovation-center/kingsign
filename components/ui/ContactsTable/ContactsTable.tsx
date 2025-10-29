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
  Users,
  Trash2,
  Edit,
} from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { Contact } from "@/repositories/ContactsRepository";
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
import { ContactsRepository } from "@/repositories/ContactsRepository";
import { AddContactModal } from "./AddContactModal";

type SortField = "name" | "email" | "createdAt" | "updatedAt";

export function ContactsTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [limit, setLimit] = useState(10);
  const [skip, setSkip] = useState(0);

  const {
    contacts,
    isLoading,
    error,
  } = useContacts();

  // Filter and sort contacts locally since the hook doesn't have pagination/search built-in
  const filteredAndSortedContacts = contacts
    ?.filter((contact: Contact) => {
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt || 0);
          bValue = new Date(b.updatedAt || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }) || [];

  // Pagination
  const total = filteredAndSortedContacts.length;
  const paginatedContacts = filteredAndSortedContacts.slice(skip, skip + limit);
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  const onSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      await ContactsRepository.remove(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete contact");
      console.error("Delete contact error:", error);
    },
  });

  const handleDeleteContact = (e: MouseEvent<HTMLButtonElement>, contactId: string) => {
    e.stopPropagation();
    deleteContactMutation.mutate(contactId);
  };

  const capitalizeWords = (str: string) => {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px] pl-9"
            />
          </div>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setSkip(0); // Reset to first page
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
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
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
                  className="flex items-center gap-1"
                >
                  Name
                  <ArrowUpDown className={cn("h-4 w-4", sortField === "name" && "text-primary")} />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort("email")}
                  className="flex items-center gap-1"
                >
                  Email
                  <ArrowUpDown className={cn("h-4 w-4", sortField === "email" && "text-primary")} />
                </Button>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort("createdAt")}
                  className="flex items-center gap-1"
                >
                  Created At
                  <ArrowUpDown className={cn("h-4 w-4", sortField === "createdAt" && "text-primary")} />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort("updatedAt")}
                  className="flex items-center gap-1"
                >
                  Updated At
                  <ArrowUpDown className={cn("h-4 w-4", sortField === "updatedAt" && "text-primary")} />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
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
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Users className="h-8 w-8" />
                    <p>No contacts found</p>
                    {search && (
                      <p className="text-sm">Try adjusting your search</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact: Contact) => (
                <TableRow key={contact._id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {contact.name ? capitalizeWords(contact.name) : "-"}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell className="text-gray-500">
                    {contact.phone || "-"}
                  </TableCell>
                  <TableCell>
                    {contact.createdAt ? format(new Date(contact.createdAt), "MMM dd, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    {contact.updatedAt ? format(new Date(contact.updatedAt), "MMM dd, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this contact? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogClose asChild>
                              <Button
                                variant="outline"
                                onClick={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                              >
                                Cancel
                              </Button>
                            </AlertDialogClose>
                            <Button
                              onClick={(e: MouseEvent<HTMLButtonElement>) => handleDeleteContact(e, contact._id as string)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Contact
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {paginatedContacts.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} results
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

      <AddContactModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
} 