"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useTags } from "@/hooks/useTags";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { Tag } from "@/repositories/TagsRepository";
import { Check, Plus, X, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TagManagerProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  disabled?: boolean;
  title?: string;
}

export function TagManager({ 
  selectedTagIds = [], 
  onTagsChange, 
  disabled = false,
  title = "Tags"
}: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const { currentWorkspace } = useWorkspace();
  
  const { data: tagsData } = useTags({ 
    query: { workspaceId: currentWorkspace?._id }
  });
  
  const availableTags = tagsData?.data || [];
  const selectedTags = availableTags.filter((tag: Tag) => selectedTagIds.includes(tag._id));

  const handleTagToggle = (tagId: string) => {
    if (disabled) return;
    
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    onTagsChange(newTagIds);
  };

  const handleRemoveTag = (tagId: string) => {
    if (disabled) return;
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs text-gray-600">{title}</Label>
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:bg-gray-100"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup className="max-h-48 overflow-y-auto">
                  {availableTags.map((tag: Tag) => (
                    <CommandItem
                      key={tag._id}
                      value={tag.name}
                      onSelect={() => {
                        handleTagToggle(tag._id);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.name}</span>
                      {selectedTagIds.includes(tag._id) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="min-h-[60px] p-3 bg-gray-50 rounded-md border border-gray-200">
        {selectedTags.length === 0 ? (
          <div className="flex items-center justify-center h-12 text-gray-400 text-xs">
            <Tags className="w-4 h-4 mr-2" />
            No tags assigned
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag: Tag) => (
              <Badge 
                key={tag._id}
                style={{ backgroundColor: tag.color, color: 'white' }}
                className="text-xs flex items-center gap-1 pr-1"
              >
                <span>{tag.name}</span>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveTag(tag._id)}
                    className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                    title="Remove tag"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {availableTags.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          No tags available. Create tags in the{" "}
          <a href="/dashboard/tags" className="text-blue-600 hover:underline">
            Tags Management
          </a>{" "}
          page.
        </p>
      )}
    </div>
  );
}
