import { getRounds } from "@/lib/wca/live/getRounds";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";
import LiveTabs from "@/components/competitions/LiveTabs";
import TabShell from "@/components/competitions/TabShell";

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

  if (competitionInfo.scoretaking_software !== "internal") {
    return children;
  }

  const {
    data: roundsData,
    error: roundsError,
    response: roundsResponse,
  } = await getRounds(competitionId);

  if (roundsError) {
    return <OpenapiError response={roundsResponse} t={t} />;
  }

  return (
    <RoundsInfoProvider
      competitionId={competitionId}
      initialRounds={roundsData.rounds}
    >
      <TabShell menu={<LiveTabs competitionInfo={competitionInfo} />}>
        {children}
      </TabShell>
    </RoundsInfoProvider>
  );
}
