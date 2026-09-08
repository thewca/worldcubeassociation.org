import { getRounds } from "@/lib/wca/live/getRounds";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";
import LiveTabs from "@/components/competitions/LiveTabs";

export default async function LiveLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const {
    data: competitionInfo,
    error: competitionError,
    response: competitionResponse,
  } = await getCompetitionInfo(competitionId);

  if (competitionError)
    return <OpenapiError response={competitionResponse} t={t} />;

  const { data, error, response } = await getRounds(competitionId);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return (
    <RoundsInfoProvider
      competitionId={competitionId}
      initialRounds={data.rounds}
    >
      <LiveTabs competitionInfo={competitionInfo}>{children}</LiveTabs>
    </RoundsInfoProvider>
  );
}
