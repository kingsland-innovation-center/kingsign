import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const appPath = {
  root: "/",
  auth: {
    root: "/auth",
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    signupSuccess: "/auth/signup-sucessful",
    verificationSuccess: "/auth/verification-successful",
  },
  dashboard: {
    root: "/dashboard",
    request: "/dashboard/request",
    templates: "/dashboard/templates",
    templatesCreate: "/dashboard/templates/create",
    templatesEdit: "/dashboard/templates/edit",
    contacts: "/dashboard/contacts",
    forecasts: "/dashboard/forecasts",
    outlook: "/dashboard/outlook",
    realtime: "/dashboard/real-time",
    // sign: "/dashboard/sign-yourself",
    settings: {
      root: "/dashboard/settings",
      users: "/dashboard/settings/users",
      roles: "/dashboard/settings/roles",
      api: "/dashboard/settings/api",
      notificationIntegrations: "/dashboard/settings/notification-integrations",
      emailTemplates: "/dashboard/settings/email-templates",
    },
    documents: {
      root: "/dashboard/documents",
      needSign: "/dashboard/documents/need-sign",
      inProgress: "/dashboard/documents/in-progress",
      completed: "/dashboard/documents/completed",
      drafts: "/dashboard/documents/drafts",
      declined: "/dashboard/documents/declined",
      expired: "/dashboard/documents/expired",
      create: "/dashboard/documents/create-document",
    },
    archive: {
      root: "/dashboard/archive",
      documents: "/dashboard/archive/documents",
      templates: "/dashboard/archive/templates",
    },
    tags: "/dashboard/tags",
    folders: "/dashboard/folders",
    folderView: (folderId: string) => `/dashboard/folders/${folderId}`,
  },
  releases: {
    root: "/releases",
    upcoming: "/releases/upcoming",
    previous: "/releases/previous",
    schedule: "/releases/schedule",
  },
  settings: "/settings",
};
