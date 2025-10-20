"use client";

import Link from "next/link";
import { Separator, Tabs } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import _ from "lodash";
import { components } from "@/types/openapi";
import { useMemo } from "react";
import { hasPassed } from "@/lib/wca/dates";
import { useT } from "@/lib/i18n/useI18n";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
} from "@/lib/wca/competitions/tabs";

export default function TabMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const pathName = usePathname();
  const { t } = useT();

  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionInfo.id ? "general" : path;

  const tabs = useMemo(() => {
    if (!hasPassed(competitionInfo.start_date)) {
      return beforeCompetitionTabs(competitionInfo);
    }
    // TODO: Change for WCA Live Integration
    if (!hasPassed(competitionInfo.end_date)) {
      return beforeCompetitionTabs(competitionInfo);
    }
    // TODO: Differentiate if the results have been posted
    return afterCompetitionTabs(competitionInfo);
  }, [competitionInfo]);

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
        gap="3"
      >
        {tabs.map((tab) => (
          <Tabs.Trigger key={tab.i18nKey} value={tab.menuKey} asChild>
            <Link href={tab.href} key={tab.i18nKey}>
              {t(tab.i18nKey)}
            </Link>
          </Tabs.Trigger>
        ))}
        <Separator />
        <Tabs.Trigger value="custom-1">Custom 1</Tabs.Trigger>
        <Tabs.Trigger value="custom-2">Custom 2</Tabs.Trigger>
        <Tabs.Trigger value="custom-3">Custom 3</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value={currentPath!}>{children}</Tabs.Content>
    </Tabs.Root>
  );
}
