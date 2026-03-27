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
import events from "@/lib/wca/data/events";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getRounds } from "@/lib/wca/live/getRounds";
import _ from "lodash";

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

  // This will always be cached because we need to create the live layout
  const {
    error: roundsError,
    data: roundsData,
    response: roundResponse,
  } = await getRounds(competitionId);

  if (roundsError) {
    return <OpenapiError response={roundResponse} t={t} />;
  }

  const roundsByEventId = _.groupBy(
    roundsData.rounds,
    (r) => parseActivityCode(r.id).eventId,
  );

  const { format, id, linked_round_ids, cutoff } = data;

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
              title={t("competitions.live.results.dual_round")}
              isLinkedRound
            />
          </MultiRoundResultProvider>
        </VStack>
      </Container>
    );
  }

  const { eventId, roundNumber } = parseActivityCode(roundId);

  const roundTypeId = getRoundTypeId(
    roundNumber!,
    roundsByEventId[eventId].length,
    Boolean(cutoff),
  );

  return (
    <Container bg="bg">
      <VStack align="left">
        <LiveResultProvider initialRound={data} competitionId={competitionId}>
          <LiveUpdatingResultsTable
            formatId={format}
            roundWcifId={roundId}
            competitionId={competitionId}
            title={
              events.byId[eventId].name + " " + t(`rounds.${roundTypeId}.name`)
            }
          />
        </LiveResultProvider>
      </VStack>
    </Container>
  );
}
