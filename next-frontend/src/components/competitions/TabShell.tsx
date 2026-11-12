"use client";

import { Box, Tabs } from "@chakra-ui/react";
import { useParams, usePathname } from "next/navigation";
import _ from "lodash";

export default function TabShell({
  menu,
  mobileMenu,
  children,
}: {
  menu: React.ReactNode;
  mobileMenu: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathName = usePathname();
  const { competitionId } = useParams<"/competitions/[competitionId]">();

  const path = _.last(pathName.split("/"));
  const currentPath = !path || path === competitionId ? "general" : path;

  return (
    <>
      <Tabs.Root
        variant="enclosed"
        width="full"
        value={currentPath}
        orientation="vertical"
        sideNav
        lazyMount
        unmountOnExit
        display={{ base: "contents", md: "flex" }}
      >
        <Box hideBelow="md">{menu}</Box>

        {/* Tabs.Content is a flex item, which has `min-width: auto`.
         It will grow as wide as the table if not set to 0 so the Table scrolling will never trigger */}
        <Tabs.Content width="full" minWidth="0" value={currentPath}>
          {children}
        </Tabs.Content>
      </Tabs.Root>

      <Box hideFrom="md">{mobileMenu}</Box>
    </>
  );
}
