import { hasPassed, hasPassedEndOfDay } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
  liveTab,
} from "@/lib/wca/competitions/tabs";
import TabMenu from "@/components/competitions/TabMenu";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default async function CompetitionMenu({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();
  const {
    data: competitionInfo,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

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
    />
  );
}
