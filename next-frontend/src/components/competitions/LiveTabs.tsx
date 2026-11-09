"use client";

import TabMenu from "@/components/competitions/TabMenu";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";
import { components } from "@/types/openapi";
import { duringCompetitionTabs } from "@/lib/wca/competitions/tabs";
import { route } from "nextjs-routes";
import MobileTabMenu from "./MobileTabMenu";

export default function LiveTabs({
  competitionInfo,
  mode = "desktop",
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  mode?: "desktop" | "mobile";
}) {
  const { rounds } = useAllRoundsInfo();

  const tabs = duringCompetitionTabs(competitionInfo, rounds);

  if (mode === "mobile") {
    return <MobileTabMenu tabs={tabs} competitionId={competitionInfo.id} />;
  }

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
