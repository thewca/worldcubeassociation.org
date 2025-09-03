"use client";

import Link from "next/link";
import { route } from "nextjs-routes";
import { List, VStack } from "@chakra-ui/react";

export default function MobileMenu({
  competitionId,
  children,
}: {
  children: React.ReactNode;
  competitionId: string;
}) {
  return (
    <VStack hideFrom="md">
      <List.Root>
        <List.Item>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]",
              query: { competitionId },
            })}
          >
            General
          </Link>
        </List.Item>
        <List.Item>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]/register",
              query: { competitionId },
            })}
          >
            Register
          </Link>
        </List.Item>
        <List.Item>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]/competitors",
              query: { competitionId },
            })}
          >
            Competitors
          </Link>
        </List.Item>
      </List.Root>
      {children}
    </VStack>
  );
}
