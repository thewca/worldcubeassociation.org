"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import LiveUpdatingDualRoundsTable from "@/components/live/LiveUpdatingDualRoundsTable";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import _ from "lodash";
import { components } from "@/types/openapi";

// Temporary fix, there is an issue where results are not correctly overwritten
// in the allOf. I think this is an openapi-typescript issue caused by having a union type with the same
// results key.
type FixedLiveRound = Omit<components["schemas"]["WcifRound"], "results"> &
  Omit<components["schemas"]["LiveRound"], "results"> & {
    results: components["schemas"]["LiveResult"][];
  };

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

  const { competitors, format } = data as FixedLiveRound;

  if (linked_round_ids) {
    const linkedResults = (
      await Promise.all(
        linked_round_ids
          .filter((wcif_id) => wcif_id !== id)
          .map((wcif_id) => getResultByRound(competitionId, wcif_id)),
      )
    ).flatMap((round) =>
      (round.data! as FixedLiveRound).results.map((r) => ({
        ...r,
        wcifId: round.data!.id,
      })),
    );

    const totalResults = [
      ...results.map((r) => ({ ...r, wcifId: id })),
      ...linkedResults,
    ];

    const resultsByRegistrationId = _.groupBy(totalResults, "registration_id");

    return (
      <Container bg="bg">
        <VStack align="left">
          <LiveUpdatingDualRoundsTable
            roundId={roundId}
            resultsByRegistrationId={resultsByRegistrationId}
            formatId={format}
            eventId={parseActivityCode(id).eventId}
            competitors={competitors}
            competitionId={competitionId}
            title="Live Results"
          />
        </VStack>
      </Container>
    );
  }

  return (
    <Container bg="bg">
      <VStack align="left">
        <LiveResultProvider initialRound={data} competitionId={competitionId}>
          <LiveUpdatingResultsTable
            formatId={format}
            eventId={parseActivityCode(roundId).eventId}
            competitors={competitors}
            competitionId={competitionId}
            title="Live Results"
          />
        </LiveResultProvider>
      </VStack>
    </Container>
  );
}
