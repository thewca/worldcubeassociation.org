import { getRounds } from "@/lib/wca/live/getRounds";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";
import LiveTabs from "@/components/competitions/LiveTabs";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function LiveLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const [
    {
      data: competitionInfo,
      error: competitionError,
      response: competitionResponse,
    },
    { data: roundsData, error: roundsError, response: roundsResponse },
  ] = await Promise.all([
    getCompetitionInfo(competitionId),
    getRounds(competitionId),
  ]);

  if (competitionError)
    return <OpenapiError response={competitionResponse} t={t} />;

  if (roundsError) {
    return <OpenapiError response={roundsResponse} t={t} />;
  }

  return (
    <RoundsInfoProvider
      competitionId={competitionId}
      initialRounds={roundsData.rounds}
    >
      <LiveTabs competitionInfo={competitionInfo}>{children}</LiveTabs>
    </RoundsInfoProvider>
  );
}
