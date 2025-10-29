"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  NotificationIntegration, 
  NotificationType,
  CreateNotificationIntegrationInput,
  UpdateNotificationIntegrationInput
} from "@/repositories/NotificationIntegrationsRepository";

interface NotificationIntegrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNotificationIntegrationInput | UpdateNotificationIntegrationInput) => Promise<void>;
  integration?: NotificationIntegration;
  isSubmitting?: boolean;
}

const notificationTypeOptions = [
  {
    value: NotificationType.DOCUMENT_COMPLETED,
    label: "Document Completed",
    description: "Triggered when a document is fully signed"
  },
  {
    value: NotificationType.DOCUMENT_UPDATED,
    label: "Document Updated", 
    description: "Triggered when a document is updated"
  }
];

export default function NotificationIntegrationForm({
  isOpen,
  onClose,
  onSubmit,
  integration,
  isSubmitting = false,
}: NotificationIntegrationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    notificationType: NotificationType.DOCUMENT_COMPLETED,
    isEnabled: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!integration;

  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        url: integration.url,
        notificationType: integration.notificationType,
        isEnabled: integration.isEnabled,
      });
    } else {
      setFormData({
        name: "",
        url: "",
        notificationType: NotificationType.DOCUMENT_COMPLETED,
        isEnabled: true,
      });
    }
    setErrors({});
  }, [integration, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = "URL must be a valid HTTP/HTTPS URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Notification Integration" : "Add Notification Integration"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the notification integration details below."
              : "Create a new webhook integration to receive notifications when events occur."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Slack Notifications"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Webhook URL</Label>
            <Input
              id="url"
              placeholder="https://hooks.slack.com/services/..."
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              className={errors.url ? "border-red-500" : ""}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notificationType">Notification Type</Label>
            <Select
              value={formData.notificationType}
              onValueChange={(value: NotificationType) => 
                handleInputChange("notificationType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isEnabled">Enable Integration</Label>
              <div className="text-sm text-gray-500">
                When enabled, this integration will receive webhook notifications
              </div>
            </div>
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) => handleInputChange("isEnabled", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
