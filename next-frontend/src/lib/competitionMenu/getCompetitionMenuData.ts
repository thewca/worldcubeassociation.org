import { cache } from "react";
import { getCompetitionInfo } from "../wca/competitions/getCompetitionInfo";
import { competitionStatus } from "@/components/competitions/CompetitionMenu";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
  liveTab,
} from "../wca/competitions/tabs";

export const getCompetitionMenuData = cache(async (competitionId: string) => {
  const {
    data: competitionInfo,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) {
    return { ok: false as const, response };
  }

  const status = competitionStatus(competitionInfo);
  const { hasEnded, isOngoing, isAwaitingResults } = status;

  const baseTabs = hasEnded
    ? afterCompetitionTabs(competitionInfo, isAwaitingResults)
    : beforeCompetitionTabs(competitionInfo);

  const tabs = isOngoing ? [...baseTabs, liveTab(competitionInfo)] : baseTabs;

  return {
    ok: true as const,
    competitionInfo,
    status,
    tabs,
    customTabs: competitionInfo.tabs.map((tab) => tab.name),
  };
});
