import { components } from "@/types/openapi";
import { duringCompetitionTabs } from "@/lib/wca/competitions/tabs";
import TabMenu from "@/components/competitions/TabMenu";
import { getRounds } from "@/lib/wca/live/getRounds";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function LiveMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { t } = await getT();

  const { data, error, response } = await getRounds(competitionInfo.id);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  const tabs = duringCompetitionTabs(competitionInfo, data.rounds);

  return (
    <TabMenu tabs={tabs} competitionInfo={competitionInfo} isLiveMenu>
      {children}
    </TabMenu>
  );
}
