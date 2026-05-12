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
import { route } from "nextjs-routes";
import React from "react";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { WCA_PROVIDER_ID } from "@/auth.config";
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
  if (!session) {
    return (
      <Button onClick={() => signIn(WCA_PROVIDER_ID)} variant="ghost" size="sm">
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

  return (
    <>
      {/* Desktop: popup dropdown */}
      <Box hideBelow="md">
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger rounded="full">{avatarNode}</Menu.Trigger>
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
              <Menu.Item value="logout" onSelect={() => signOut()}>
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
              <Button
                asChild
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
              >
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
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
              >
                <Link href="/dashboard">Developer Dashboard</Link>
              </Button>
              <Separator />
              <Button
                asChild
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
              >
                <Link href="/competitions/mine">My Competitions</Link>
              </Button>
              {session.user?.wcaId && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                >
                  <Link
                    href={route({
                      pathname: "/persons/[wcaId]",
                      query: { wcaId: session.user.wcaId },
                    })}
                  >
                    My Results
                  </Link>
                </Button>
              )}
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                onClick={() => signOut()}
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
