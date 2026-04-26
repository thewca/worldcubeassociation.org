"use server";

import { Container, VStack } from "@chakra-ui/react";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import {
  LiveResultProvider,
  MultiRoundResultProvider,
} from "@/providers/LiveResultProvider";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import { getRoundName } from "@/lib/wca/live/getRoundName";
import { getRounds } from "@/lib/wca/live/getRounds";
import getPermissions from "@/lib/wca/permissions";
import RoundOpenCheck from "@/components/live/RoundOpenCheck";

export default async function ResultPage({
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

  const { format, id, linked_round_ids } = data;

  const permissions = await getPermissions();

  const canManage =
    !!permissions && permissions.canAdministerCompetition(competitionId);

  if (linked_round_ids) {
    const linkedRounds = await Promise.all(
      linked_round_ids
        .filter((wcif_id) => wcif_id !== id)
        .map((wcif_id) => getResultByRound(competitionId, wcif_id)),
    );

    const erroredResponse = linkedRounds.find((data) => data.error);

    if (erroredResponse) {
      return <OpenapiError response={erroredResponse.response} t={t} />;
    }

    return (
      <Container bg="bg">
        <VStack align="left">
          <MultiRoundResultProvider
            initialRounds={[data, ...linkedRounds.map((d) => d.data!)]}
            competitionId={competitionId}
          >
            <LiveUpdatingResultsTable
              formatId={format}
              roundWcifId={roundId}
              competitionId={competitionId}
              title="Combined Dual Rounds"
              isLinkedRound
              canManage={canManage}
            />
          </MultiRoundResultProvider>
        </VStack>
      </Container>
    );
  }

  const {
    data: roundsData,
    error: roundsError,
    response: roundsResponse,
  } = await getRounds(competitionId);

  if (roundsError) return <OpenapiError response={roundsResponse} t={t} />;

  const roundName = getRoundName(id, t, roundsData.rounds, true);

  const round = roundsData.rounds.find((r) => r.id === id)!;

  return (
    <Container bg="bg">
      <VStack align="left">
        <RoundOpenCheck state={round.state} t={t}>
          <LiveResultProvider initialRound={data} competitionId={competitionId}>
            <LiveUpdatingResultsTable
              formatId={format}
              roundWcifId={roundId}
              competitionId={competitionId}
              title={roundName}
              canManage={canManage}
            />
          </LiveResultProvider>
        </RoundOpenCheck>
      </VStack>
    </Container>
  );
}
