"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from "@/hooks/useFolders";
import { useTags } from "@/hooks/useTags";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Folder, FolderData, FolderPatch, FolderFilterType } from "@/repositories/FoldersRepository";
import { Tag } from "@/repositories/TagsRepository";
import { Trash2, Edit, Plus, FolderOpen, FileText, BookTemplateIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { appPath } from "@/lib/utils";

interface FolderFormData {
  name: string;
  description: string;
  tagIds: string[];
  filterType: FolderFilterType;
}

function FolderForm({ 
  folder, 
  onSubmit, 
  onCancel,
  availableTags 
}: { 
  folder?: Folder; 
  onSubmit: (data: FolderFormData) => void; 
  onCancel: () => void;
  availableTags: Tag[];
}) {
  const [formData, setFormData] = useState<FolderFormData>({
    name: folder?.name || "",
    description: folder?.description || "",
    tagIds: folder?.tagIds || [],
    filterType: folder?.filterType || FolderFilterType.DOCUMENTS
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    if (formData.tagIds.length === 0) {
      toast.error("Please select at least one tag");
      return;
    }
    onSubmit(formData);
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Folder Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter folder name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter folder description"
          rows={3}
        />
      </div>

      <div>
        <Label>Filter Type</Label>
        <Select 
          value={formData.filterType} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, filterType: value as FolderFilterType }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select what to show" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FolderFilterType.DOCUMENTS}>Documents Only</SelectItem>
            <SelectItem value={FolderFilterType.TEMPLATES}>Templates Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Tags to Filter By</Label>
        <div className="border rounded-md p-4 max-h-48 overflow-y-auto mt-2">
          {availableTags.length === 0 ? (
            <p className="text-gray-500 text-sm">No tags available. Create tags first.</p>
          ) : (
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <div key={tag._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag._id}
                    checked={formData.tagIds.includes(tag._id)}
                    onCheckedChange={() => handleTagToggle(tag._id)}
                  />
                  <Badge 
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={availableTags.length === 0}>
          {folder ? "Update Folder" : "Create Folder"}
        </Button>
      </div>
    </form>
  );
}

function FilterTypeIcon({ filterType }: { filterType: FolderFilterType }) {
  switch (filterType) {
    case FolderFilterType.DOCUMENTS:
      return <FileText className="w-4 h-4" />;
    case FolderFilterType.TEMPLATES:
      return <BookTemplateIcon className="w-4 h-4" />;
    default:
      return <FolderOpen className="w-4 h-4" />;
  }
}

function FilterTypeLabel({ filterType }: { filterType: FolderFilterType }) {
  switch (filterType) {
    case FolderFilterType.DOCUMENTS:
      return "Documents Only";
    case FolderFilterType.TEMPLATES:
      return "Templates Only";
    default:
      return "Documents Only";
  }
}

export default function FoldersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const router = useRouter();
  
  const { currentWorkspace, currentUser: user, currentAccount: account } = useWorkspace();
  
  const { data: foldersData } = useFolders({ 
    query: { workspaceId: currentWorkspace?._id }
  });
  
  const { data: tagsData } = useTags({ 
    query: { workspaceId: currentWorkspace?._id }
  });
  
  const createFolderMutation = useCreateFolder();
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  const folders = foldersData?.data || [];
  const availableTags = tagsData?.data || [];

  const handleCreateFolder = async (formData: FolderFormData) => {
    if (!currentWorkspace?._id || !account?._id) return;
    
    try {
      const folderData: FolderData = {
        name: formData.name,
        description: formData.description,
        tagIds: formData.tagIds,
        filterType: formData.filterType,
        workspaceId: currentWorkspace._id,
        accountId: account._id.toString()
      };
      
      await createFolderMutation.mutateAsync(folderData);
      setIsCreateModalOpen(false);
      toast.success("Folder created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create folder");
    }
  };

  const handleUpdateFolder = async (formData: FolderFormData) => {
    if (!editingFolder) return;
    
    try {
      const patchData: FolderPatch = {
        name: formData.name,
        description: formData.description,
        tagIds: formData.tagIds,
        filterType: formData.filterType
      };
      
      await updateFolderMutation.mutateAsync({ id: editingFolder._id, data: patchData });
      setEditingFolder(null);
      toast.success("Folder updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteFolderMutation.mutateAsync(folderId);
      toast.success("Folder deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete folder");
    }
  };

  const getTagsForFolder = (tagIds: string[]) => {
    return availableTags.filter((tag: Tag) => tagIds.includes(tag._id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Folders Management</h1>
          <p className="text-gray-600 mt-2">
            Create filtered views to organize your documents and templates by tags
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableTags.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <FolderForm
              onSubmit={handleCreateFolder}
              onCancel={() => setIsCreateModalOpen(false)}
              availableTags={availableTags}
            />
          </DialogContent>
        </Dialog>
      </div>

      {availableTags.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="text-sm">
                You need to create tags first before you can create folders. 
                <a href="/dashboard/tags" className="underline ml-1">Go to Tags Management</a>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder: Folder) => {
          const folderTags = getTagsForFolder(folder.tagIds);
          
          return (
            <Card key={folder._id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => router.push(appPath.dashboard.folderView(folder._id))}
                  >
                    <FilterTypeIcon filterType={folder.filterType} />
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(appPath.dashboard.folderView(folder._id))}
                      title="View folder contents"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingFolder(folder)}
                      title="Edit folder"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFolder(folder._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {folder.description && (
                  <p className="text-sm text-gray-600 mt-2">{folder.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Filter Type:</div>
                    <Badge variant="outline" className="text-xs">
                      <FilterTypeIcon filterType={folder.filterType} />
                      <span className="ml-1">
                        <FilterTypeLabel filterType={folder.filterType} />
                      </span>
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Tags:</div>
                    <div className="flex flex-wrap gap-1">
                      {folderTags.map((tag: Tag) => (
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
                  
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Created: {new Date(folder.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {folders.length === 0 && availableTags.length > 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                No folders found. Create your first folder to organize your content!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Folder Modal */}
      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          {editingFolder && (
            <FolderForm
              folder={editingFolder}
              onSubmit={handleUpdateFolder}
              onCancel={() => setEditingFolder(null)}
              availableTags={availableTags}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
