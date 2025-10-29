"use client";

import { useAuth } from "@/providers/AuthProvider";
import { appPath } from "@/lib/utils";
import { Code, Group, ScrollArea } from "@mantine/core";
import {
  IconAddressBook,
  IconAdjustments,
  IconGauge,
  IconArchive,
  IconScript,
  IconTemplate,
  IconUserShield,
  IconKey,
  IconTags,
  IconFolders,
  IconBell,
  IconMail,
} from "@tabler/icons-react";

import { Logo } from "../Logo";
import { LinksGroup } from "../NavbarLinksGroup/NavbarLinksGroup";
import { UserButton } from "../UserButton/UserButton";
import classes from "./Navbar.module.css";

const navbarData = [
  { label: "Overview", icon: IconGauge, link: appPath.dashboard.root },
  { label: "Templates", icon: IconTemplate, link: appPath.dashboard.templates },
  {
    label: "Documents",
    icon: IconScript,
    link: appPath.dashboard.documents.root,
  },
  { label: "Contacts", icon: IconAddressBook, link: appPath.dashboard.contacts },
  { label: "Tags", icon: IconTags, link: appPath.dashboard.tags },
  { label: "Folders", icon: IconFolders, link: appPath.dashboard.folders },
  {
    label: "Settings",
    icon: IconAdjustments,
    initiallyOpened: false,
    links: [
      {
        label: "User Management",
        link: appPath.dashboard.settings.users,
        icon: IconAddressBook,
      },
      {
        label: "Roles & Permissions",
        link: appPath.dashboard.settings.roles,
        icon: IconUserShield,
      },
      {
        label: "Notification Integrations",
        link: appPath.dashboard.settings.notificationIntegrations,
        icon: IconBell,
      },
      {
        label: "API Integration",
        link: appPath.dashboard.settings.api,
        icon: IconKey,
      },
      {
        label: "Email Templates",
        link: appPath.dashboard.settings.emailTemplates,
        icon: IconMail,
      },
    ],
  },
  {
    label: "Archive",
    icon: IconArchive,
    initiallyOpened: false,
    links: [
      {
        label: "Documents",
        link: appPath.dashboard.archive.documents,
        icon: IconScript,
      },
      {
        label: "Templates",
        link: appPath.dashboard.archive.templates,
        icon: IconTemplate,
      },
    ],
  },
];

export function Navbar() {
  const links = navbarData.map((item) => (
    <LinksGroup {...item} key={item.label} />
  ));

  const { logout } = useAuth();

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group justify="space-between">
          <Logo style={{ width: 50, height: 50 }} />
          <Code fw={700}>v0</Code>
        </Group>
      </div>

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>

      <div className={classes.footer}>
        <UserButton />
      </div>
    </nav>
  );
}
