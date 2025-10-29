"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDocument } from "@/providers/DocumentProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useTemplates } from "@/hooks/useTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import { DocumentStatus } from "@/repositories/DocumentsRepository";
import { Template } from "@/repositories/TemplatesRepository";
import { appPath } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUpDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  templateFieldsRepository,
  TemplateField,
} from "@/repositories/TemplateFieldsRepository";
import { documentFieldsRepository } from "@/repositories/DocumentFieldsRepository";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateDocumentPageContent />
    </Suspense>
  );
}

function CreateDocumentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const { createDocumentFromTemplate } = useDocument();
  const { currentAccount } = useWorkspace();
  const {
    templates,
    isTemplatesLoading,
    searchTemplates,
    total,
    skip,
    limit,
    setSkip,
    setLimit,
  } = useTemplates();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<
    "name" | "createdAt" | "updatedAt"
  >("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  // Load template if templateId is provided in URL
  useEffect(() => {
    if (templateId) {
      const template = templates.find((t: Template) => t._id === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [templateId, templates]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTemplates(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchTemplates]);

  const handleSort = (field: "name" | "createdAt" | "updatedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (sortField === "name") {
      return direction * a.name.localeCompare(b.name);
    }
    return (
      direction *
      (new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime())
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (!title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const document = await createDocumentFromTemplate({
        title,
        note: description,
        status: DocumentStatus.PENDING,
        creatorAccountId: String(currentAccount?._id || ""),
        templateId: selectedTemplate._id,
        fileId: selectedTemplate.fileId,
      });

      // Create document fields based on template fields
      const templateFields = await templateFieldsRepository.find({
        query: {
          templateId: selectedTemplate._id,
        },
      });

      // Create document fields for each template field
      const createFieldPromises = templateFields.data.map(
        (templateField: TemplateField) =>
          documentFieldsRepository.create({
            documentId: document._id,
            fieldId: templateField._id,
            value: null, // Initialize with null value
            fileId: selectedTemplate.fileId,
          })
      );

      await Promise.all(createFieldPromises);

      toast.success("Document created successfully");
      router.push(appPath.dashboard.documents.root);
    } catch (error) {
      toast.error("Failed to create document");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {selectedTemplate && (
          <Button
            variant="ghost"
            onClick={() => setSelectedTemplate(null)}
            className="gap-2"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Templates
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold mb-2">Create Document</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTemplate
              ? "Fill in the document details to create a new document from template."
              : "Select a template to create a new document."}
          </p>
        </div>
      </div>

      {selectedTemplate ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              Document Title
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              Description
              <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Enter document description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              className="w-32 bg-[#0A2472] hover:bg-gradient-to-r hover:from-[#0A2472]/90 hover:to-[#4A6FA5]/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-32"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
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
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1"
                    >
                      Name
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1"
                    >
                      Created At
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("updatedAt")}
                      className="flex items-center gap-1"
                    >
                      Updated At
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
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
                    </TableRow>
                  ))
                ) : sortedTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                        <FileText className="h-8 w-8" />
                        <p>No templates found</p>
                        {search && (
                          <p className="text-sm">Try adjusting your search</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTemplates.map((template: Template) => (
                    <TableRow
                      key={template._id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedTemplate(template);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        {template.name}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {template.description || "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(template.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(template.updatedAt), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {sortedTemplates.length > 0 && (
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
      )}
    </div>
  );
}
