"use client";

import Link from "next/link";
import { Box, Collapsible, Tabs, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import _ from "lodash";
import { components } from "@/types/openapi";
import { useT } from "@/lib/i18n/useI18n";
import {
  duringCompetitionTabs,
  TabWithChildren,
} from "@/lib/wca/competitions/tabs";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { useState } from "react";
import { TFunction } from "i18next";

export default function LiveMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const pathName = usePathname();
  const { t } = useT();
  const api = useAPI();

  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionInfo.id ? "general" : path;

  const { data, isLoading } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds",
    { params: { path: { competitionId: competitionInfo.id } } },
  );

  if (isLoading) {
    return <Loading />;
  }

  const tabs = duringCompetitionTabs(competitionInfo, data!.rounds);

  return (
    <Tabs.Root
      variant="enclosed"
      width="full"
      defaultValue={currentPath}
      orientation="vertical"
      lazyMount
      unmountOnExit
      hideBelow="md"
      colorPalette="white"
    >
      <Tabs.List
        height="fit-content"
        position="sticky"
        minWidth="fit-content"
        textAlign="center"
        gap="3"
      >
        {tabs.map((tab) =>
          "href" in tab ? (
            <Tabs.Trigger value={tab.menuKey} asChild key={tab.menuKey}>
              <Text asChild textStyle="bodyEmphasis">
                <Link href={tab.href}>{t(tab.i18nKey)}</Link>
              </Text>
            </Tabs.Trigger>
          ) : (
            <CollapsibleTabGroup
              key={tab.menuKey}
              tab={tab}
              t={t}
              isOpen={openGroup === tab.menuKey}
              onToggle={() =>
                setOpenGroup((prev) =>
                  prev === tab.menuKey ? null : tab.menuKey,
                )
              }
            />
          ),
        )}
      </Tabs.List>
      <Tabs.Content width="full" value={currentPath!}>
        {children}
      </Tabs.Content>
    </Tabs.Root>
  );
}

function CollapsibleTabGroup({
  tab,
  t,
  isOpen,
  onToggle,
}: {
  tab: TabWithChildren;
  t: TFunction;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible.Root open={isOpen} onOpenChange={onToggle}>
      <Collapsible.Trigger
        width="full"
        display="flex"
        justifyContent="space-between"
        px="3"
        py="2"
        borderRadius="md"
        _hover={{ bg: "bg.subtle" }}
      >
        <Text textStyle="bodyEmphasis" textAlign="center">
          {t(tab.i18nKey)}
        </Text>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <Box pl="3" display="flex" flexDirection="column" gap="1" pt="1">
          {tab.children.map((child) => (
            <Tabs.Trigger value={child.menuKey} asChild key={child.menuKey}>
              <Text asChild>
                <Link href={child.href}>{t(child.i18nKey)}</Link>
              </Text>
            </Tabs.Trigger>
          ))}
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
