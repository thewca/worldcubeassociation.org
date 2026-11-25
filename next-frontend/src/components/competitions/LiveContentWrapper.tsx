"use client";

import { duringCompetitionTabs } from "@/lib/wca/competitions/tabs";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";
import { components } from "@/types/openapi";
import Content from "./PageContent";

export default function LiveContentWrapper({
  competitionInfo,
  children,
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
  children: React.ReactNode;
}) {
  const { rounds } = useAllRoundsInfo();
  const tabs = duringCompetitionTabs(competitionInfo, rounds);

  return (
    <Content tabs={tabs} competition={competitionInfo}>
      {children}
    </Content>
  );
}
