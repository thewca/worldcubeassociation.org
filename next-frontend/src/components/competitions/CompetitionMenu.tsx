import { components } from "@/types/openapi";
import { hasPassed, hasPassedEndOfDay } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
  liveTab,
} from "@/lib/wca/competitions/tabs";
import TabMenu from "@/components/competitions/TabMenu";
import { Alert, Link } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default async function CompetitionMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { t } = await getT();

  const hasEnded =
    hasPassedEndOfDay(competitionInfo.end_date) && !LIVE_RESULT_BETA;

  const isOngoing = !hasEnded && hasPassed(competitionInfo.start_date);

  const isAwaitingResults = hasEnded && !competitionInfo.results_posted_at;

  const baseTabs = hasEnded
    ? afterCompetitionTabs(competitionInfo, isAwaitingResults)
    : beforeCompetitionTabs(competitionInfo);

  const competitionLiveTab = liveTab(competitionInfo);

  const tabs = isOngoing ? [...baseTabs, competitionLiveTab] : baseTabs;

  const liveResultsHref =
    competitionLiveTab.externalHref ?? competitionLiveTab.href;

  return (
    <TabMenu
      competitionInfo={competitionInfo}
      tabs={tabs}
      customTabs={competitionInfo.tab_names}
    >
      {isAwaitingResults && (
        <Alert.Root status="info" marginBottom="4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>
              {t("competitions.messages.upload_results")}
            </Alert.Title>
            {!competitionLiveTab.disabled && (
              <Alert.Description>
                {t("competitions.messages.provisional_live_results")}{" "}
                <Link href={liveResultsHref}>
                  {t("competitions.live.title")}
                </Link>
              </Alert.Description>
            )}
          </Alert.Content>
        </Alert.Root>
      )}
      {children}
    </TabMenu>
  );
}
