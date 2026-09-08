"use client";

import TabMenu from "@/components/competitions/TabMenu";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";
import { components } from "@/types/openapi";
import { duringCompetitionTabs } from "@/lib/wca/competitions/tabs";

export default function LiveTabs({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { rounds } = useAllRoundsInfo();

  const tabs = duringCompetitionTabs(competitionInfo, rounds);

  return (
    <TabMenu tabs={tabs} competitionInfo={competitionInfo}>
      {children}
    </TabMenu>
  );
}
