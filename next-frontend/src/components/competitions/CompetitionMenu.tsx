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
  const isOngoing =
    !hasPassedEndOfDay(competitionInfo.end_date) || LIVE_RESULT_BETA;

  // TODO: Differentiate if the results have been posted
  const tabs = isOngoing
    ? beforeCompetitionTabs(competitionInfo)
    : afterCompetitionTabs(competitionInfo);

  if (isOngoing && hasPassed(competitionInfo.start_date)) {
    tabs.push(liveTab(competitionInfo));
  }

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
