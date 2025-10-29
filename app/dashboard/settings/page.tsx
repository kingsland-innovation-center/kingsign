"use client";

import { IconUserShield, IconUsers, IconKey, IconBell, IconMail } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { appPath } from "@/lib/utils";

export default function SettingsPage() {
  const settingsModules = [
    {
      title: "User Management",
      description: "Manage users, invite new members, and assign roles",
      icon: IconUsers,
      href: appPath.dashboard.settings.users
    },
    {
      title: "Roles & Permissions",
      description: "Configure user roles and set permissions",
      icon: IconUserShield,
      href: appPath.dashboard.settings.roles
    },
    {
      title: "Email Templates",
      description: "Create and manage email templates with Handlebars",
      icon: IconMail,
      href: appPath.dashboard.settings.emailTemplates
    },
    {
      title: "Notification Integrations",
      description: "Configure webhook endpoints for event notifications",
      icon: IconBell,
      href: appPath.dashboard.settings.notificationIntegrations
    },
    {
      title: "API Integration",
      description: "Manage API keys and monitor API usage",
      icon: IconKey,
      href: appPath.dashboard.settings.api
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {settingsModules.map((module) => (
          <div key={module.title} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <module.icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium mb-1">{module.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{module.description}</p>
                <Link href={module.href}>
                  <Button variant="outline">Manage</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 