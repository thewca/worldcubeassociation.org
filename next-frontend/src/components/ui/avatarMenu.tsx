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
import { MobileNavButton, MobileNavLink } from "@/components/MobileNav";
import { LuChevronDown } from "react-icons/lu";
import _ from "lodash";
import RailsLink from "@/components/RailsLink";
import { type UserPermissions } from "@/lib/wca/permissions";
import type { AvatarMenuEntry } from "@/types/payload";
import { useT } from "@/lib/i18n/useI18n";
import buildAvatarMenuEntries, {
  type FlatMenuEntry,
} from "@/lib/wca/avatarMenuEntries";

const AVATAR_COLORS = ["green", "white", "red", "yellow", "blue", "orange"];

function EntryLink({
  entry,
  ...rest
}: {
  entry: FlatMenuEntry;
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
  cmsEntries,
  permissions,
}: {
  session: Session | null;
  cmsEntries: AvatarMenuEntry[];
  permissions?: UserPermissions;
}) {
  return (
    <ClientOnly fallback={<Skeleton boxSize={8} />}>
      <AvatarMenu
        session={session}
        cmsEntries={cmsEntries}
        permissions={permissions}
      />
    </ClientOnly>
  );
}

function AvatarMenu({
  session,
  cmsEntries,
  permissions,
}: {
  session: Session | null;
  cmsEntries: AvatarMenuEntry[];
  permissions?: UserPermissions;
}) {
  const router = useRouter();
  const { t } = useT();

  // Better Auth's `signOut` only clears the cookies and resolves; unlike NextAuth's, it does not
  // navigate. `session` here is a prop from a server component, so without a refresh the navbar
  // keeps rendering the signed-in state and the button looks like it did nothing.
  const handleSignOut = () =>
    signOut({ fetchOptions: { onSuccess: () => router.refresh() } });

  if (!session) {
    return (
      <>
        <Button
          hideBelow="md"
          onClick={() => signIn()}
          variant="ghost"
          size="sm"
          px={2}
          justifyContent="flex-start"
        >
          Sign in
        </Button>
        <MobileNavButton hideFrom="md" onClick={() => signIn()}>
          Sign in
        </MobileNavButton>
      </>
    );
  }

  const colorPalette = _.sample(AVATAR_COLORS);

  const avatarNode = (
    <Avatar.Root
      colorPalette={colorPalette}
      variant="solid"
      size={{ base: "xs", md: "md" }}
      boxSize={{ base: 7, md: 10 }}
    >
      <Avatar.Fallback name={session.user?.name ?? undefined} />
      <Avatar.Image src={session.user?.image ?? undefined} />
    </Avatar.Root>
  );

  const entries = buildAvatarMenuEntries(session, cmsEntries, t, permissions);

  return (
    <>
      {/* Desktop: popup dropdown */}
      <Box hideBelow="md">
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger rounded="full" me={2}>
            {avatarNode}
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              {entries.map((entry, index) => {
                if (entry.kind === "group") {
                  return (
                    <React.Fragment key={index}>
                      {index > 0 && <Menu.Separator />}
                      <Menu.ItemGroup>
                        <Menu.ItemGroupLabel>
                          {entry.header}
                        </Menu.ItemGroupLabel>
                        {entry.entries.map((groupEntry, groupIndex) => (
                          <Menu.Item
                            key={groupIndex}
                            value={`${index}-${groupIndex}`}
                            asChild
                          >
                            <EntryLink entry={groupEntry} />
                          </Menu.Item>
                        ))}
                      </Menu.ItemGroup>
                    </React.Fragment>
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
        <Collapsible.Root overflowPadding display="flex" flexDirection="column">
          <Collapsible.Trigger asChild>
            <MobileNavButton>
              <HStack gap={2}>
                {avatarNode}
                <Text>{session.user?.name}</Text>
              </HStack>
              <Collapsible.Indicator ms="auto">
                <LuChevronDown />
              </Collapsible.Indicator>
            </MobileNavButton>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <VStack align="stretch" ps={2} gap={1} py={1}>
              {entries.map((entry, index) => {
                if (entry.kind === "group") {
                  return (
                    <React.Fragment key={index}>
                      {index > 0 && <Separator />}
                      <Text textStyle="sm" fontWeight="bold">
                        {entry.header}
                      </Text>
                      {entry.entries.map((groupEntry, groupIndex) => (
                        <MobileNavLink key={groupIndex}>
                          <EntryLink entry={groupEntry} />
                        </MobileNavLink>
                      ))}
                    </React.Fragment>
                  );
                }

                return (
                  <MobileNavLink key={index}>
                    <EntryLink entry={entry} />
                  </MobileNavLink>
                );
              })}
              <Separator />
              <MobileNavButton onClick={handleSignOut}>Log Out</MobileNavButton>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </>
  );
}
