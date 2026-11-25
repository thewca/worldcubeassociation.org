import { adminTabs, liveTab } from "@/lib/wca/competitions/tabs";
import { getPermissions } from "@/lib/wca/permissions.server";
import TabMenu from "@/components/competitions/TabMenu";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { Alert, Link } from "@chakra-ui/react";
import {
  competitionStatus,
  getCompetitionMenuData,
} from "@/lib/competitionMenu/getCompetitionMenuData";
import MobileTabMenu from "./MobileTabMenu";

export default async function CompetitionMenu({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const menu = await getCompetitionMenuData(competitionId);

  if (!menu.ok) return <OpenapiError t={t} response={menu.response} />;

  const permissions = await getPermissions();

  const tabs = [
    ...menu.tabs,
    ...(permissions ? adminTabs(menu.competitionInfo, permissions) : []),
  ];

  const customTabs = menu.competitionInfo.tabs.map((tab) => tab.name);

  return (
    <>
      <TabMenu
        competitionInfo={menu.competitionInfo}
        tabs={tabs}
        customTabs={customTabs}
      />
      <MobileTabMenu
        tabs={tabs}
        customTabs={customTabs}
        competitionId={competitionId}
      />
    </>
  );
}

// Streams in on its own, so the tab content above which it sits isn't held back by it.
export async function AwaitingResultsAlert({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const menu = await getCompetitionMenuData(competitionId);

  // `CompetitionMenu` already renders the error for this same cached request.
  if (!menu.ok) return null;

  if (!competitionStatus(menu.competitionInfo).isAwaitingResults) return null;

  const { t } = await getT();
  const competitionLiveTab = liveTab(menu.competitionInfo);
  const liveResultsHref =
    competitionLiveTab.type === "tab-with-external-link"
      ? competitionLiveTab.externalHref
      : competitionLiveTab.href;

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
