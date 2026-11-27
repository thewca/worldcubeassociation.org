import { components } from "@/types/openapi";
import { getCompetitionInfo } from "../wca/competitions/getCompetitionInfo";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
  liveTab,
} from "../wca/competitions/tabs";
import { hasPassed, hasPassedEndOfDay } from "../wca/dates";
import { areResultsPosted } from "../wca/competitions/statusUtils";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export function competitionStatus(
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
) {
  const hasEnded =
    hasPassedEndOfDay(competitionInfo.end_date) && !LIVE_RESULT_BETA;

  const isOngoing = !hasEnded && hasPassed(competitionInfo.start_date);

  const isAwaitingResults =
    hasEnded && !areResultsPosted(competitionInfo.status);

  return { hasEnded, isOngoing, isAwaitingResults };
}

export const getCompetitionMenuData = async (competitionId: string) => {
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
};
