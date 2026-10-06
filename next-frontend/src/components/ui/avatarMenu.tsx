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
import { route } from "nextjs-routes";
import React from "react";
import { signIn, signOut, type Session } from "@/auth.client";
import { MobileNavButton, MobileNavLink } from "@/components/MobileNav";
import { LuChevronDown } from "react-icons/lu";
import _ from "lodash";

const AVATAR_COLORS = ["green", "white", "red", "yellow", "blue", "orange"];

export default function Wrapper({ session }: { session: Session | null }) {
  return (
    <ClientOnly fallback={<Skeleton boxSize={8} />}>
      <AvatarMenu session={session} />
    </ClientOnly>
  );
}

function AvatarMenu({ session }: { session: Session | null }) {
  const router = useRouter();

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
              <Menu.Item value="payloadcms" asChild>
                <Link
                  href={route({
                    pathname: "/payload/[[...segments]]",
                    query: {},
                  })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Payload CMS
                </Link>
              </Menu.Item>
              <Menu.Item value="dashboard" asChild>
                <Link href="/dashboard">Developer Dashboard</Link>
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item value="mycompetitions" asChild>
                <Link href="/competitions/mine">My Competitions</Link>
              </Menu.Item>
              {session.user?.wcaId && (
                <Menu.Item value="myresults" asChild>
                  <Link
                    href={route({
                      pathname: "/persons/[wcaId]",
                      query: { wcaId: session.user.wcaId },
                    })}
                  >
                    My Results
                  </Link>
                </Menu.Item>
              )}
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
              <MobileNavLink>
                <Link
                  href={route({
                    pathname: "/payload/[[...segments]]",
                    query: {},
                  })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Payload CMS
                </Link>
              </MobileNavLink>
              <MobileNavLink>
                <Link href="/dashboard">Developer Dashboard</Link>
              </MobileNavLink>
              <Separator />
              <MobileNavLink>
                <Link href="/competitions/mine">My Competitions</Link>
              </MobileNavLink>
              {session.user?.wcaId && (
                <MobileNavLink>
                  <Link
                    href={route({
                      pathname: "/persons/[wcaId]",
                      query: { wcaId: session.user.wcaId },
                    })}
                  >
                    My Results
                  </Link>
                </MobileNavLink>
              )}
              <Separator />
              <MobileNavButton onClick={handleSignOut}>Log Out</MobileNavButton>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </>
  );
}
