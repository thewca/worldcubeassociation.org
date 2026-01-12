"use client";

import Link from "next/link";
import { Separator, Tabs, Text } from "@chakra-ui/react";
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
import { route } from "nextjs-routes";
import BetaDisabledTooltip from "@/components/BetaDisabledTooltip";

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
        textAlign="center"
        gap="3"
      >
        {tabs.map((tab) => (
          <BetaDisabledTooltip disabled={!tab.betaDisabled}>
            <Tabs.Trigger key={tab.i18nKey} value={tab.menuKey} disabled={tab.betaDisabled} asChild>
              <Text textStyle="bodyEmphasis" asChild maxW="44">
                <Link href={tab.href}>{t(tab.i18nKey)}</Link>
              </Text>
            </Tabs.Trigger>
          </BetaDisabledTooltip>
        ))}
        <Separator />
        {competitionInfo.tab_names.map((tabName) => (
          <Tabs.Trigger key={tabName} value={tabName} asChild>
            <Text textStyle="bodyEmphasis" asChild maxW="44">
              <Link
                href={route({
                  pathname: "/competitions/[competitionId]/tabs/[tabName]",
                  query: {
                    competitionId: competitionInfo.id,
                    tabName: encodeURIComponent(tabName),
                  },
                })}
              >
                {tabName}
              </Link>
            </Text>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content width="full" value={currentPath!}>
        {children}
      </Tabs.Content>
    </Tabs.Root>
  );
}
