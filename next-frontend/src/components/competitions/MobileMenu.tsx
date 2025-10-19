"use client";

import Link from "next/link";
import { Card, List, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { hasPassed } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
} from "@/lib/wca/competitions/tabs";
import { components } from "@/types/openapi";
import { useT } from "@/lib/i18n/useI18n";
import _ from "lodash";
import { usePathname } from "next/navigation";

export default function MobileMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { t } = useT();
  const pathName = usePathname();
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
    <VStack hideFrom="md" align="left">
      <Card.Root>
        <Card.Body>
          <List.Root align="center" variant="plain" gap={2}>
            {tabs.map((tab) => {
              const { menuKey, i18nKey, href, icon: IconComponent } = tab;
              return (
                <List.Item
                  key={menuKey}
                  color={currentPath === menuKey ? "blue" : "gray"}
                  width="100%"
                >
                  <List.Indicator asChild>
                    <IconComponent />
                  </List.Indicator>
                  <Link href={href}>{t(i18nKey)}</Link>
                </List.Item>
              );
            })}
          </List.Root>
        </Card.Body>
      </Card.Root>
      {children}
    </VStack>
  );
}
