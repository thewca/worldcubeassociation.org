import PermissionCheck from "@/components/PermissionCheck";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import DoubleCheck from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/double-check/DoubleCheck";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import { Container } from "@chakra-ui/react";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import { DateTime } from "luxon";
import { getRoundName } from "@/lib/wca/live/getRoundName";
import { getRounds } from "@/lib/wca/live/getRounds";
import RoundOpenCheck from "@/components/live/RoundOpenCheck";

export default async function DoubleCheckPage({
  params,
}: {
  params: Promise<{ roundId: string; competitionId: string }>;
}) {
  const { roundId, competitionId } = await params;

  const { t } = await getT();

  const { data, error, response } = await getResultByRound(
    competitionId,
    roundId,
  );

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  const { results, id, format } = data;

  const sortedResults = results.toSorted(
    (a, b) =>
      DateTime.fromISO(b.last_attempt_entered_at).toMillis() -
      DateTime.fromISO(a.last_attempt_entered_at).toMillis(),
  );

  const {
    data: roundsData,
    error: roundsError,
    response: roundsResponse,
  } = await getRounds(competitionId);

  if (roundsError) return <OpenapiError response={roundsResponse} t={t} />;

  const roundName = getRoundName(id, t, roundsData.rounds, true);

  const round = roundsData.rounds.find((r) => r.id === id)!;

  return (
    <Container>
      <RoundOpenCheck state={round.state} t={t}>
        <PermissionCheck
          requiredPermission="canAdministerCompetition"
          item={competitionId}
        >
          <LiveResultProvider initialRound={data} competitionId={competitionId}>
            <LiveResultAdminProvider
              competitionId={competitionId}
              initialRegistrationId={sortedResults[0].registration_id}
              round={round}
            >
              <DoubleCheck
                competitionId={competitionId}
                results={sortedResults}
                formatId={format}
                roundWcifId={id}
                roundName={roundName}
              />
            </LiveResultAdminProvider>
          </LiveResultProvider>
        </PermissionCheck>
      </RoundOpenCheck>
    </Container>
  );
}
