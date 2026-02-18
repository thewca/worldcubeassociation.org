"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import LiveUpdatingDualRoundsTable from "@/components/live/LiveUpdatingDualRoundsTable";
import _ from "lodash";
import { components } from "@/types/openapi";

// Temporary fix, there is an issue where results are not correctly overwritten
// in the allOf. I think this is an openapi-typescript issue caused by having a union type with the same
// results key.
type FixedLiveRound = Omit<components["schemas"]["WcifRound"], "results"> &
  Omit<components["schemas"]["LiveRound"], "results"> & {
    results: components["schemas"]["LiveResult"][];
  };
import ShowResults from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/ShowResults";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ roundId: string; competitionId: string }>;
}) {
  const { roundId, competitionId } = await params;

  const resultsRequest = await getResultByRound(competitionId, roundId);

  if (!resultsRequest.data) {
    return <p>Error loading Results</p>;
  }

  const { results, id, competitors, format, linked_round_ids } =
    resultsRequest.data as FixedLiveRound;

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
        <LiveUpdatingResultsTable
          roundId={roundId}
          results={results}
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
