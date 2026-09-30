import { components } from "@/types/openapi";
import { hasPassed, hasPassedEndOfDay } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
  liveTab,
} from "@/lib/wca/competitions/tabs";
import TabMenu from "@/components/competitions/TabMenu";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default function CompetitionMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const hasEnded =
    hasPassedEndOfDay(competitionInfo.end_date) && !LIVE_RESULT_BETA;

  const isOngoing = !hasEnded && hasPassed(competitionInfo.start_date);

  // TODO: Differentiate if the results have been posted
  const baseTabs = hasEnded
    ? afterCompetitionTabs(competitionInfo)
    : beforeCompetitionTabs(competitionInfo);

  const tabs = isOngoing ? [...baseTabs, liveTab(competitionInfo)] : baseTabs;

  return (
    <TabMenu
      competitionInfo={competitionInfo}
      tabs={tabs}
      customTabs={competitionInfo.tab_names}
    >
      {children}
    </TabMenu>
  );
}
