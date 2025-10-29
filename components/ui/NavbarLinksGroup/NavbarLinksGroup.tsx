/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Box, Collapse, Group, ThemeIcon, UnstyledButton } from "@mantine/core";
import { IconCalendarStats, IconChevronRight } from "@tabler/icons-react";

import classes from "./NavbarLinksGroup.module.css";
import { appPath } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LinksGroupProps {
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string }[];
  link?: string;
}

export function LinksGroup({
  icon: Icon,
  label,
  initiallyOpened,
  links,
  link,
}: LinksGroupProps) {
  const pathname = usePathname();
  const hasLinks = Array.isArray(links);
  const [opened, setOpened] = useState(initiallyOpened || false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    if (path === appPath.dashboard.root) return pathname === appPath.dashboard.root;
    return pathname.startsWith(path);
  };

  const items = (hasLinks ? links : []).map((link) => (
    <Link 
      href={link.link} 
      key={link.label} 
      className={cn(classes.link, isActive(link.link) && classes.active)}
    >
      {link.label}
    </Link>
  ));

  const button = (
    <UnstyledButton
      onClick={() => setOpened((o) => !o)}
      className={cn(classes.control, link && isActive(link) && classes.active)}
    >
      <Group justify="space-between" gap={0}>
        <Box style={{ display: "flex", alignItems: "center" }}>
          <ThemeIcon variant="light" size={30}>
            <Icon size={18} />
          </ThemeIcon>
          <Box ml="md">{label}</Box>
        </Box>
        {hasLinks && (
          <IconChevronRight
            className={classes.chevron}
            stroke={1.5}
            size={16}
            style={{ transform: opened ? "rotate(-90deg)" : "none" }}
          />
        )}
      </Group>
    </UnstyledButton>
  );

  return (
    <>
      {link ? (
        <Link href={link} className="block">
          {button}
        </Link>
      ) : (
        button
      )}
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}

const mockdata = {
  label: "Releases",
  icon: IconCalendarStats,
  links: [
    { label: "Upcoming releases", link: appPath.releases.upcoming },
    { label: "Previous releases", link: appPath.releases.previous },
    { label: "Releases schedule", link: appPath.releases.schedule },
  ],
};

export function NavbarLinksGroup() {
  return (
    <Box mih={220} p="md">
      <LinksGroup {...mockdata} />
    </Box>
  );
}
