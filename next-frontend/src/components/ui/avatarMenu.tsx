"use client";

import {
  Avatar,
  Box,
  Button,
  ClientOnly,
  Collapsible,
  HStack,
  Menu,
  Separator,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { signIn, signOut, type Session } from "@/auth.client";
import { LuChevronDown } from "react-icons/lu";
import _ from "lodash";
import RailsLink from "@/components/RailsLink";
import { type UserPermissions } from "@/lib/wca/permissions";
import buildAvatarMenuEntries, {
  type MenuEntry,
} from "@/lib/wca/avatarMenuEntries";

const AVATAR_COLORS = ["green", "white", "red", "yellow", "blue", "orange"];

function EntryLink({
  entry,
  ...rest
}: {
  entry: Extract<MenuEntry, { kind: "link" | "rails" }>;
} & React.ComponentPropsWithoutRef<"a">) {
  if (entry.kind === "rails") {
    return (
      <RailsLink {...rest} href={entry.href}>
        {entry.label}
      </RailsLink>
    );
  }

  return (
    <Link
      {...rest}
      href={entry.href}
      target={entry.newTab ? "_blank" : undefined}
      rel={entry.newTab ? "noreferrer" : undefined}
    >
      {entry.label}
    </Link>
  );
}

export default function Wrapper({
  session,
  permissions,
}: {
  session: Session | null;
  permissions?: UserPermissions;
}) {
  return (
    <ClientOnly fallback={<Skeleton boxSize={8} />}>
      <AvatarMenu session={session} permissions={permissions} />
    </ClientOnly>
  );
}

function AvatarMenu({
  session,
  permissions,
}: {
  session: Session | null;
  permissions?: UserPermissions;
}) {
  const router = useRouter();

  // Better Auth's `signOut` only clears the cookies and resolves; unlike NextAuth's, it does not
  // navigate. `session` here is a prop from a server component, so without a refresh the navbar
  // keeps rendering the signed-in state and the button looks like it did nothing.
  const handleSignOut = () =>
    signOut({ fetchOptions: { onSuccess: () => router.refresh() } });

  if (!session) {
    return (
      <Button onClick={() => signIn()} variant="ghost" size="sm">
        Sign in
      </Button>
    );
  }

  const colorPalette = _.sample(AVATAR_COLORS);

  const avatarNode = (
    <Avatar.Root colorPalette={colorPalette} variant="solid">
      <Avatar.Fallback name={session.user?.name ?? undefined} />
      <Avatar.Image src={session.user?.image ?? undefined} />
    </Avatar.Root>
  );

  const entries = buildAvatarMenuEntries(session, permissions);

  return (
    <>
      {/* Desktop: popup dropdown */}
      <Box hideBelow="md">
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger rounded="full">{avatarNode}</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content maxHeight="80vh" overflowY="auto">
              {entries.map((entry, index) => {
                if (entry.kind === "separator") {
                  return <Menu.Separator key={index} />;
                }

                if (entry.kind === "header") {
                  return (
                    // `ItemGroupLabel` reads its group's context, so it needs the
                    // wrapper even though our entries are a flat list.
                    <Menu.ItemGroup key={index}>
                      <Menu.ItemGroupLabel>{entry.label}</Menu.ItemGroupLabel>
                    </Menu.ItemGroup>
                  );
                }

                return (
                  <Menu.Item key={index} value={String(index)} asChild>
                    <EntryLink entry={entry} />
                  </Menu.Item>
                );
              })}
              <Menu.Separator />
              <Menu.Item value="logout" onSelect={handleSignOut}>
                Log Out
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>

      {/* Mobile: inline collapsible */}
      <Box hideFrom="md" width="full">
        <Collapsible.Root>
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              width="full"
            >
              <HStack gap={2}>
                {avatarNode}
                <Text>{session.user?.name}</Text>
              </HStack>
              <Collapsible.Indicator ml="auto">
                <LuChevronDown />
              </Collapsible.Indicator>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <VStack align="stretch" pl={4} gap={1} py={1}>
              {entries.map((entry, index) => {
                if (entry.kind === "separator") {
                  return <Separator key={index} />;
                }

                if (entry.kind === "header") {
                  return (
                    <Text key={index} textStyle="sm" fontWeight="bold" px={3}>
                      {entry.label}
                    </Text>
                  );
                }

                return (
                  <Button
                    key={index}
                    asChild
                    variant="ghost"
                    size="sm"
                    justifyContent="flex-start"
                  >
                    <EntryLink entry={entry} />
                  </Button>
                );
              })}
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                onClick={handleSignOut}
              >
                Log Out
              </Button>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </>
  );
}
