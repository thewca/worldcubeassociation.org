import { components } from "@/types/openapi";
import { hasPassed } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
} from "@/lib/wca/competitions/tabs";
import TabMenu from "@/components/competitions/TabMenu";
import LiveMenu from "@/components/competitions/LiveMenu";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default function CompetitionMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  if (!hasPassed(competitionInfo.start_date)) {
    const tabs = beforeCompetitionTabs(competitionInfo);
    return (
      <TabMenu competitionInfo={competitionInfo} tabs={tabs}>
        {children}
      </TabMenu>
    );
  }

  if (!hasPassed(competitionInfo.end_date) || LIVE_RESULT_BETA) {
    return <LiveMenu competitionInfo={competitionInfo}>{children}</LiveMenu>;
  }
  // TODO: Differentiate if the results have been posted
  const tabs = afterCompetitionTabs(competitionInfo);
  return (
    <TabMenu competitionInfo={competitionInfo} tabs={tabs}>
      {children}
    </TabMenu>
  );
}
