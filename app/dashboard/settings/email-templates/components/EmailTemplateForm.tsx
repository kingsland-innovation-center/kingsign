"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IconEye, IconCode, IconCopy, IconCheck, IconBold, IconItalic, IconUnderline } from "@tabler/icons-react";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { 
  EmailTemplate, 
  CreateEmailTemplateInput, 
  UpdateEmailTemplateInput,
  EmailTemplatesRepository 
} from "@/repositories/EmailTemplatesRepository";
import Handlebars from "handlebars";
import { toast } from "sonner";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link } from '@tiptap/extension-link';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  onSuccess: () => void;
}

export function EmailTemplateForm({ template, onSuccess }: EmailTemplateFormProps) {
  const { createEmailTemplate, updateEmailTemplate, isCreating, isUpdating } = useEmailTemplates();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    subject: template?.subject || "",
    htmlContent: template?.htmlContent || "",
    textContent: template?.textContent || "",
  });
  const [activeTab, setActiveTab] = useState("editor");
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const isEditing = !!template;
  const isSubmitting = isCreating || isUpdating;

  // Available Handlebars variables
  const variables = EmailTemplatesRepository.getAvailableVariables();
  const sampleData = EmailTemplatesRepository.getSampleData();

  // TipTap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: formData.htmlContent,
    onUpdate: ({ editor }) => {
      handleInputChange('htmlContent', editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Update editor content when form data changes
  useEffect(() => {
    if (editor && editor.getHTML() !== formData.htmlContent) {
      editor.commands.setContent(formData.htmlContent);
    }
  }, [editor, formData.htmlContent]);

  // Generate preview HTML
  const getPreviewHtml = () => {
    try {
      const compiledTemplate = Handlebars.compile(formData.htmlContent);
      return compiledTemplate(sampleData);
    } catch (error) {
      return `<div style="color: red; padding: 20px; border: 1px solid red; border-radius: 4px;">
        <h3>Template Error:</h3>
        <p>${error instanceof Error ? error.message : 'Invalid template syntax'}</p>
      </div>`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await updateEmailTemplate({
          id: template._id!,
          data: formData as UpdateEmailTemplateInput,
        });
      } else {
        await createEmailTemplate(formData as CreateEmailTemplateInput);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save email template:", error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyVariable = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(variable);
      setCopiedVariable(variable);
      setTimeout(() => setCopiedVariable(null), 2000);
      toast.success("Variable copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy variable");
    }
  };

  const insertVariable = (variable: string) => {
    if (editor) {
      // Insert variable at current cursor position
      editor.chain().focus().insertContent(` ${variable} `).run();
      toast.success(`Variable ${variable} inserted`);
    }
  };

  // Toolbar component for TipTap editor
  const EditorToolbar = () => {
    if (!editor) return null;

    return (
      <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <IconUnderline className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Document Invitation"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="e.g., Please sign: {{document.title}}"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variables Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Available Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Contact</h4>
                <div className="space-y-1">
                  {Object.entries(variables.contact).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-gray-200"
                        onClick={() => insertVariable(value)}
                      >
                        {value}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyVariable(value)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedVariable === value ? (
                          <IconCheck className="h-3 w-3" />
                        ) : (
                          <IconCopy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Document</h4>
                <div className="space-y-1">
                  {Object.entries(variables.document).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-gray-200"
                        onClick={() => insertVariable(value)}
                      >
                        {value}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyVariable(value)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedVariable === value ? (
                          <IconCheck className="h-3 w-3" />
                        ) : (
                          <IconCopy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Workspace</h4>
                <div className="space-y-1">
                  {Object.entries(variables.workspace).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-gray-200"
                        onClick={() => insertVariable(value)}
                      >
                        {value}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyVariable(value)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedVariable === value ? (
                          <IconCheck className="h-3 w-3" />
                        ) : (
                          <IconCopy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor and Preview */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <IconCode className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <IconEye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="htmlContent">HTML Content</Label>
                <div className="border rounded-md">
                  <EditorToolbar />
                  <EditorContent 
                    editor={editor} 
                    className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Use the rich text editor to format your email. Click on variables above to insert them.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textContent">Text Content (Optional)</Label>
                <Textarea
                  id="textContent"
                  value={formData.textContent}
                  onChange={(e) => handleInputChange('textContent', e.target.value)}
                  placeholder="Plain text version of your email..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-gray-500">
                  Fallback for email clients that don&apos;t support HTML
                </p>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Email Preview</CardTitle>
                  <p className="text-xs text-gray-500">
                    Preview with sample data: {JSON.stringify(sampleData, null, 2)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="mb-4 pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-1">Subject:</div>
                      <div className="font-medium">
                        {(() => {
                          try {
                            const compiledSubject = Handlebars.compile(formData.subject);
                            return compiledSubject(sampleData);
                          } catch (error) {
                            return formData.subject;
                          }
                        })()}
                      </div>
                    </div>
                    <div
                      className="prose prose-sm max-w-none bg-white p-4 rounded border"
                      dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                      style={{ 
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.6',
                        color: '#333'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}


