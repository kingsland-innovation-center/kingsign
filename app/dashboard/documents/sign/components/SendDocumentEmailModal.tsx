"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  IconMail, 
  IconEye, 
  IconUsers, 
  IconUser,
  IconCheck,
  IconX,
  IconEdit,
  IconBold,
  IconItalic,
  IconUnderline,
  IconCopy
} from "@tabler/icons-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link } from '@tiptap/extension-link';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { useDocumentEmails } from "@/hooks/useDocumentEmails";
import { Contact } from "@/repositories/ContactsRepository";
import { EmailTemplate, EmailTemplatesRepository } from "@/repositories/EmailTemplatesRepository";
import Handlebars from "handlebars";
import { toast } from "sonner";

interface SendDocumentEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  assignedContacts: Contact[];
  workspaceName: string;
}

export function SendDocumentEmailModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  assignedContacts,
  workspaceName
}: SendDocumentEmailModalProps) {
  const { emailTemplates, isLoading: isTemplatesLoading } = useEmailTemplates();
  const { sendDocumentEmailToMultipleContacts, isSendingMultiple } = useDocumentEmails(documentId);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("template");
  const [editableSubject, setEditableSubject] = useState<string>("");
  const [editableHtmlContent, setEditableHtmlContent] = useState<string>("");
  const [isEditingContent, setIsEditingContent] = useState<boolean>(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const selectedTemplate = emailTemplates.find(t => t._id === selectedTemplateId);
  
  // Available Handlebars variables
  const availableVariables = EmailTemplatesRepository.getAvailableVariables();
  const sampleData = EmailTemplatesRepository.getSampleData();
  
  // Convert variables object to array of variable strings
  const variables = [
    '{{contact.name}}',
    '{{contact.email}}',
    '{{contact.phone}}',
    '{{document.title}}',
    '{{document.signUrl}}',
    '{{workspace.name}}'
  ];

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
    content: editableHtmlContent,
    onUpdate: ({ editor }) => {
      setEditableHtmlContent(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Update editor content when editable content changes
  useEffect(() => {
    if (editor && editor.getHTML() !== editableHtmlContent) {
      editor.commands.setContent(editableHtmlContent);
    }
  }, [editor, editableHtmlContent]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId("");
      setSelectedContactIds(assignedContacts.map(c => c._id as string));
      setActiveTab("template");
      setEditableSubject("");
      setEditableHtmlContent("");
      setIsEditingContent(false);
    }
  }, [isOpen, assignedContacts]);

  // Update editable content when template changes
  useEffect(() => {
    if (selectedTemplate) {
      // Keep the original Handlebars syntax in the editor
      setEditableSubject(selectedTemplate.subject);
      setEditableHtmlContent(selectedTemplate.htmlContent);
    }
  }, [selectedTemplate]);

  // Generate preview data
  const getPreviewData = (contact: Contact) => ({
    contact: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone || ''
    },
    document: {
      title: documentTitle,
      signUrl: `${window.location.origin}/public-sign?documentId=${documentId}&token=SAMPLE_TOKEN`
    },
    workspace: {
      name: workspaceName
    }
  });

  // Generate preview HTML for a specific contact
  const getPreviewHtml = (contact: Contact) => {
    if (!editableHtmlContent) return '';
    
    try {
      // Replace contact-specific variables in the editable content
      let personalizedHtml = editableHtmlContent;
      const contactData = getPreviewData(contact);
      
      // Replace contact-specific variables
      personalizedHtml = personalizedHtml.replace(/\{\{contact\.name\}\}/g, contactData.contact.name);
      personalizedHtml = personalizedHtml.replace(/\{\{contact\.email\}\}/g, contactData.contact.email);
      personalizedHtml = personalizedHtml.replace(/\{\{contact\.phone\}\}/g, contactData.contact.phone);
      personalizedHtml = personalizedHtml.replace(/\{\{document\.title\}\}/g, contactData.document.title);
      personalizedHtml = personalizedHtml.replace(/\{\{document\.signUrl\}\}/g, contactData.document.signUrl);
      personalizedHtml = personalizedHtml.replace(/\{\{workspace\.name\}\}/g, contactData.workspace.name);
      
      return personalizedHtml;
    } catch (error) {
      return editableHtmlContent;
    }
  };

  // Generate preview subject for a specific contact
  const getPreviewSubject = (contact: Contact) => {
    if (!editableSubject) return '';
    
    try {
      // Replace contact-specific variables in the editable subject
      let personalizedSubject = editableSubject;
      const contactData = getPreviewData(contact);
      
      // Replace contact-specific variables
      personalizedSubject = personalizedSubject.replace(/\{\{contact\.name\}\}/g, contactData.contact.name);
      personalizedSubject = personalizedSubject.replace(/\{\{contact\.email\}\}/g, contactData.contact.email);
      personalizedSubject = personalizedSubject.replace(/\{\{contact\.phone\}\}/g, contactData.contact.phone);
      personalizedSubject = personalizedSubject.replace(/\{\{document\.title\}\}/g, contactData.document.title);
      personalizedSubject = personalizedSubject.replace(/\{\{document\.signUrl\}\}/g, contactData.document.signUrl);
      personalizedSubject = personalizedSubject.replace(/\{\{workspace\.name\}\}/g, contactData.workspace.name);
      
      return personalizedSubject;
    } catch (error) {
      return editableSubject;
    }
  };

  const handleContactSelection = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContactIds(prev => [...prev, contactId]);
    } else {
      setSelectedContactIds(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAllContacts = () => {
    if (selectedContactIds.length === assignedContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(assignedContacts.map(c => c._id as string));
    }
  };

  const handleSendEmails = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select an email template");
      return;
    }

    if (selectedContactIds.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    if (!editableSubject || !editableHtmlContent) {
      toast.error("Please ensure subject and content are not empty");
      return;
    }

    try {
      await sendDocumentEmailToMultipleContacts({
        contactIds: selectedContactIds,
        documentId,
        emailTemplateId: selectedTemplateId,
        subject: editableSubject,
        htmlContent: editableHtmlContent,
      });
      onClose();
    } catch (error) {
      console.error("Error sending emails:", error);
    }
  };

  const selectedContacts = assignedContacts.filter(c => selectedContactIds.includes(c._id as string));

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariable(text);
      setTimeout(() => setCopiedVariable(null), 2000);
      toast.success(`Copied ${text} to clipboard!`);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5" />
            Send Document Email
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <IconMail className="h-4 w-4" />
              Template
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <IconUsers className="h-4 w-4" />
              Recipients ({selectedContactIds.length})
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!selectedTemplate}>
              <IconEye className="h-4 w-4" />
              Edit & Preview
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="template" className="h-full">
              <div className="space-y-4 h-full">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Email Template
                  </label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an email template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isTemplatesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading templates...
                        </SelectItem>
                      ) : emailTemplates.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No email templates available
                        </SelectItem>
                      ) : (
                        emailTemplates.map((template) => (
                          <SelectItem key={template._id} value={template._id!}>
                            {template.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Subject Template:</label>
                        <p className="text-sm bg-gray-50 p-2 rounded border font-mono">
                          {selectedTemplate.subject}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          This template will be loaded into the editor where you can customize it before sending.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>


            <TabsContent value="contacts" className="h-full">
              <div className="space-y-4 h-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Select Recipients</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllContacts}
                  >
                    {selectedContactIds.length === assignedContacts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {assignedContacts.map((contact) => (
                      <Card key={contact._id} className="p-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedContactIds.includes(contact._id as string)}
                            onCheckedChange={(checked) => 
                              handleContactSelection(contact._id as string, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <IconUser className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{contact.name}</span>
                            </div>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-xs text-gray-400">{contact.phone}</p>
                            )}
                          </div>
                          {selectedContactIds.includes(contact._id as string) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <IconCheck className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {assignedContacts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <IconUsers className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No contacts assigned to this document</p>
                    <p className="text-sm">Assign contacts to document fields first</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="space-y-4 h-full flex flex-col">
                {selectedContacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <IconEye className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No contacts selected for preview</p>
                    <p className="text-sm">Select recipients to see email editor and previews.</p>
                  </div>
                ) : (
                  <>
                    {/* Available Variables Section */}
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="text-sm font-medium">Available Variables</h3>
                      <div className="flex flex-wrap gap-2">
                        {variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="secondary"
                            className="cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-1"
                            onClick={() => insertVariable(variable)}
                          >
                            {variable}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(variable);
                              }}
                            >
                              {copiedVariable === variable ? (
                                <IconCheck className="h-3 w-3 text-green-500" />
                              ) : (
                                <IconCopy className="h-3 w-3" />
                              )}
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Email Editor Section */}
                    <div className="space-y-4 border-b pb-4">
                      <div>
                        <Label htmlFor="editSubject">Email Subject</Label>
                        <Input
                          id="editSubject"
                          value={editableSubject}
                          onChange={(e) => setEditableSubject(e.target.value)}
                          placeholder="Enter email subject..."
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="editContent">Email Content</Label>
                        <div className="border rounded-md mt-1">
                          <EditorToolbar />
                          <EditorContent 
                            editor={editor} 
                            className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Click on variables above to insert them, or use the rich text editor to format your email.
                        </p>
                      </div>
                    </div>

                    {/* Preview Section */}
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-sm font-medium mb-3">Email Previews for Recipients</h3>
                      <ScrollArea className="h-full">
                        <div className="space-y-4 p-1">
                          {selectedContacts.map((contact, index) => (
                            <Card key={contact._id} className="p-4 space-y-3">
                              <CardHeader className="p-0">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <IconUser className="h-5 w-5 text-blue-600" />
                                  {contact.name} ({contact.email})
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-0 space-y-2">
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Subject:</label>
                                  <p className="text-sm font-semibold">
                                    {getPreviewSubject(contact)}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Content:</label>
                                  <div className="border rounded p-3 bg-white max-h-40 overflow-y-auto">
                                    <div 
                                      className="prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: getPreviewHtml(contact) }}
                                      style={{ 
                                        fontFamily: 'Arial, sans-serif',
                                        lineHeight: '1.6',
                                        color: '#333',
                                        fontSize: '14px'
                                      }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                              {index < selectedContacts.length - 1 && <Separator />}
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {selectedTemplate && selectedContactIds.length > 0 && (
              <>
                <IconMail className="h-4 w-4" />
                Sending &quot;{selectedTemplate.name}&quot; to {selectedContactIds.length} recipient{selectedContactIds.length !== 1 ? 's' : ''}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSendingMultiple}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmails}
              disabled={!selectedTemplateId || selectedContactIds.length === 0 || !editableSubject || !editableHtmlContent || isSendingMultiple}
            >
              {isSendingMultiple ? "Sending..." : `Send Email${selectedContactIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
