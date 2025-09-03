"use client";

import Link from "next/link";
import { List, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { hasPassed } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
} from "@/lib/wca/competitions/tabs";
import { components } from "@/types/openapi";
import { useT } from "@/lib/i18n/useI18n";

export default function MobileMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { t } = useT();

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
    <VStack hideFrom="md">
      <List.Root>
        {tabs.map((tab) => (
          <List.Item key={tab.menuKey}>
            <Link href={tab.href}>{t(tab.i18nKey)}</Link>
          </List.Item>
        ))}
      </List.Root>
      {children}
    </VStack>
  );
}
