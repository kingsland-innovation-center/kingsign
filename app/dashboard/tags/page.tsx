"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/useTags";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Tag, TagData, TagPatch } from "@/repositories/TagsRepository";
import { Trash2, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

const colorOptions = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e"
];

interface TagFormData {
  name: string;
  color: string;
}

function TagForm({ 
  tag, 
  onSubmit, 
  onCancel 
}: { 
  tag?: Tag; 
  onSubmit: (data: TagFormData) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<TagFormData>({
    name: tag?.name || "",
    color: tag?.color || colorOptions[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tag Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter tag name"
          required
        />
      </div>
      
      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 ${
                formData.color === color ? 'border-gray-800' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {tag ? "Update Tag" : "Create Tag"}
        </Button>
      </div>
    </form>
  );
}

export default function TagsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  
  const { currentWorkspace } = useWorkspace();
  const { data: tagsData } = useTags({ 
    query: { workspaceId: currentWorkspace?._id }
  });
  
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  const tags = tagsData?.data || [];

  const handleCreateTag = async (formData: TagFormData) => {
    if (!currentWorkspace?._id) return;
    
    try {
      const tagData: TagData = {
        name: formData.name,
        color: formData.color,
        workspaceId: currentWorkspace._id
      };
      
      await createTagMutation.mutateAsync(tagData);
      setIsCreateModalOpen(false);
      toast.success("Tag created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create tag");
    }
  };

  const handleUpdateTag = async (formData: TagFormData) => {
    if (!editingTag) return;
    
    try {
      const patchData: TagPatch = {
        name: formData.name,
        color: formData.color
      };
      
      await updateTagMutation.mutateAsync({ id: editingTag._id, data: patchData });
      setEditingTag(null);
      toast.success("Tag updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteTagMutation.mutateAsync(tagId);
      toast.success("Tag deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tags Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage tags to organize your documents and templates
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <TagForm
              onSubmit={handleCreateTag}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.map((tag: Tag) => (
          <Card key={tag._id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge 
                  style={{ backgroundColor: tag.color, color: 'white' }}
                  className="text-sm"
                >
                  {tag.name}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTag(tag)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTag(tag._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                Created: {new Date(tag.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {tags.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-center">
                No tags found. Create your first tag to get started!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Tag Modal */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <TagForm
              tag={editingTag}
              onSubmit={handleUpdateTag}
              onCancel={() => setEditingTag(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
