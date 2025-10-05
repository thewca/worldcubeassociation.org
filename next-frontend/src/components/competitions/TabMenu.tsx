"use client";

import Link from "next/link";
import { route } from "nextjs-routes";
import { Separator, Tabs } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import _ from "lodash";
import { components } from "@/types/openapi";
import { useMemo } from "react";
import { hasPassed } from "@/lib/wca/dates";
import { useT } from "@/lib/i18n/useI18n";

const beforeCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
) => {
  return [
    {
      i18nKey: "competitions.nav.menu.general",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
    },
    {
      i18nKey: "competitions.nav.menu.register",
      href: route({
        pathname: "/competitions/[competitionId]/register",
        query: { competitionId: competitionInfo.id },
      }),
    },
    {
      i18nKey: "competitions.nav.menu.competitors",
      href: route({
        pathname: "/competitions/[competitionId]/competitors",
        query: { competitionId: competitionInfo.id },
      }),
    },
    {
      i18nKey: "competitions.nav.menu.events",
      href: route({
        pathname: "/competitions/[competitionId]/events",
        query: { competitionId: competitionInfo.id },
      }),
    },
    {
      i18nKey: "competitions.nav.menu.schedule",
      href: route({
        pathname: "/competitions/[competitionId]/schedule",
        query: { competitionId: competitionInfo.id },
      }),
    },
  ];
};
// TODO: Later for WCA Live Integration
const duringCompetitionTabs = [];
const afterCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
) => {
  return [
    {
      i18nKey: "competitions.nav.menu.general",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
    },
    {
      i18nKey: "competitions.nav.menu.podiums",
      href: route({
        pathname: "/competitions/[competitionId]/podiums",
        query: { competitionId: competitionInfo.id },
      }),
    },
    {
      i18nKey: "competitions.nav.menu.scrambles",
      href: route({
        pathname: "/competitions/[competitionId]/scrambles",
        query: { competitionId: competitionInfo.id },
      }),
    },
  ];
};

export default function TabMenu({
  competitionInfo,
  competitionId,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
  competitionId: string;
}) {
  const pathName = usePathname();
  const { t } = useT();

  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionId ? "general" : path;

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
      w="100%"
      defaultValue={currentPath}
      orientation="vertical"
      lazyMount
      unmountOnExit
    >
      <Tabs.List height="fit-content" position="sticky" top="3">
        {tabs.map((tab) => (
          <Link href={tab.href} key={tab.i18nKey}>
            <Tabs.Trigger value="general">{t(tab.i18nKey)}</Tabs.Trigger>
          </Link>
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
