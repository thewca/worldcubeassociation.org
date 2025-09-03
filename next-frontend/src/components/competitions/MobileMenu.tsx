"use client";

import Link from "next/link";
import { route } from "nextjs-routes";
import {
  Button,
  CloseButton,
  Drawer,
  List,
  Portal,
  VStack,
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import _ from "lodash";

export default function MobileMenu({
  competitionId,
  children,
}: {
  children: React.ReactNode;
  competitionId: string;
}) {
  const pathName = usePathname();

  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionId ? "general" : path;

  return (
    <VStack hideFrom="md">
      <Drawer.Root placement="top">
        <Drawer.Trigger asChild>
          <Button variant="outline" size="sm" w="100%">
            General
          </Button>
        </Drawer.Trigger>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Menu</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
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
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
      {children}
    </VStack>
  );
}
