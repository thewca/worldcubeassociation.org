"use client";

import TabMenu from "@/components/competitions/TabMenu";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";
import { components } from "@/types/openapi";
import { duringCompetitionTabs } from "@/lib/wca/competitions/tabs";
import { route } from "nextjs-routes";

export default function LiveTabs({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { rounds } = useAllRoundsInfo();

  const tabs = duringCompetitionTabs(competitionInfo, rounds);

  return (
    <TabMenu
      tabs={tabs}
      competitionInfo={competitionInfo}
      backHref={route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      })}
    />
  );
}
