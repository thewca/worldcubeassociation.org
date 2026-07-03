import TabCompetitors from "@/components/competitions/TabCompetitors";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { hasPassed } from "@/lib/wca/dates";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import getPermissions from "@/lib/wca/permissions";

export default async function Competitors({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const [{ data: competitionInfo, error, response }, permissions] =
    await Promise.all([getCompetitionInfo(competitionId), getPermissions()]);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  const isLive =
    hasPassed(competitionInfo.start_date) &&
    !hasPassed(competitionInfo.end_date);

  return (
    <TabCompetitors
      id={competitionId}
      isLive={isLive}
      canAddOnTheSpot={
        isLive &&
        !!permissions &&
        permissions.canAdministerCompetition(competitionId)
      }
    />
  );
}
