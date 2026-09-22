"use client";

import { Tabs } from "@chakra-ui/react";
import { useParams, usePathname } from "next/navigation";
import _ from "lodash";

// Holds the tab chrome without any competition data, so the menu can stream in separately from
//   the content instead of the two blocking each other.
export default function TabShell({
  menu,
  children,
}: {
  menu: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathName = usePathname();
  const { competitionId } = useParams<"/competitions/[competitionId]">();

  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionId ? "general" : path;

  return (
    <Tabs.Root
      variant="enclosed"
      width="full"
      value={currentPath}
      orientation="vertical"
      sideNav
      lazyMount
      unmountOnExit
    >
      {menu}
      <Tabs.Content width="full" value={currentPath!}>
        {children}
      </Tabs.Content>
    </Tabs.Root>
  );
}
