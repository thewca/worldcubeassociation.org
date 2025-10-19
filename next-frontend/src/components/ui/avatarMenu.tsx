"use client";

import { Avatar, Button, Menu } from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";
import React from "react";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { WCA_PROVIDER_ID } from "@/auth.config";

export default function AvatarMenu({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <Button onClick={() => signIn(WCA_PROVIDER_ID)} variant="ghost" size="sm">
        Sign in
      </Button>
    );
  }

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger rounded="full">
        <Avatar.Root>
          <Avatar.Fallback name={session.user?.name ?? undefined} />
          <Avatar.Image src={session.user?.image ?? undefined} />
        </Avatar.Root>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item value="payloadcms" asChild>
            <Link
              href={route({ pathname: "/payload/[[...segments]]", query: {} })}
              target="_blank"
              rel="noreferrer"
            >
              Payload CMS
            </Link>
          </Menu.Item>
          <Menu.Item value="dashboard" asChild>
            <Link href="/dashboard">Developer Dashboard</Link>
          </Menu.Item>
          {session.user?.wcaId && (
            <>
              <Menu.Separator />
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
            </>
          )}
          <Menu.Separator />
          <Menu.Item value="logout" onSelect={() => signOut()}>
            Log Out
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
