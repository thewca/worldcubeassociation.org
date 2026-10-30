import { components } from "@/types/openapi";
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
import { Alert, Link } from "@chakra-ui/react";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

function competitionStatus(
  competitionInfo: components["schemas"]["CompetitionInfo"],
) {
  const hasEnded =
    hasPassedEndOfDay(competitionInfo.end_date) && !LIVE_RESULT_BETA;

  const isOngoing = !hasEnded && hasPassed(competitionInfo.start_date);

  const isAwaitingResults = hasEnded && !competitionInfo.results_posted_at;

  return { hasEnded, isOngoing, isAwaitingResults };
}

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

  const { hasEnded, isOngoing, isAwaitingResults } =
    competitionStatus(competitionInfo);

  const baseTabs = hasEnded
    ? afterCompetitionTabs(competitionInfo, isAwaitingResults)
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

// Streams in on its own, so the tab content above which it sits isn't held back by it.
export async function AwaitingResultsAlert({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  // `CompetitionMenu` already renders the error for this same cached request.
  if (error) return null;

  if (!competitionStatus(competitionInfo).isAwaitingResults) return null;

  const { t } = await getT();
  const competitionLiveTab = liveTab(competitionInfo);
  const liveResultsHref =
    competitionLiveTab.externalHref ?? competitionLiveTab.href;

  return (
    <Alert.Root status="info" marginBottom="4">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("competitions.messages.upload_results")}</Alert.Title>
        {!competitionLiveTab.disabled && (
          <Alert.Description>
            {t("competitions.messages.provisional_live_results")}{" "}
            <Link href={liveResultsHref}>{t("competitions.live.title")}</Link>
          </Alert.Description>
        )}
      </Alert.Content>
    </Alert.Root>
  );
}
