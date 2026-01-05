import TabCompetitors from "@/components/competitions/TabCompetitors";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { hasPassed } from "@/lib/wca/dates";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function Competitors({
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

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return (
    <TabCompetitors
      id={competitionId}
      isLive={hasPassed(competitionInfo.start_date)}
    />
  );
}
