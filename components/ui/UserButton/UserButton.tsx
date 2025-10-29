import { Avatar, Group, Text, UnstyledButton, Menu } from "@mantine/core";
import { IconChevronRight, IconLogout } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import classes from "./UserButton.module.css";

export function UserButton() {
  const { data } = useSession();
  const { logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  console.log(data);

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton className={classes.user}>
          <Group>
            <Avatar
              radius="xl"
              color="blue"
            >
              {data?.user?.name ? getInitials(data.user.name) : '??'}
            </Avatar>

            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {data?.user?.name}
              </Text>
              <Text c="dimmed" size="xs" truncate>
                {data?.user?.email}
              </Text>
            </div>

            <IconChevronRight size={14} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconLogout size={14} />}
          onClick={() => logout()}
          color="red"
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
