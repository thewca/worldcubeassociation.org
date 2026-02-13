"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import LiveUpdatingDualRoundsTable from "@/components/live/LiveUpdatingDualRoundsTable";
import _ from "lodash";

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
    resultsRequest.data;

  if (linked_round_ids) {
    const linkedResults = (
      await Promise.all(
        linked_round_ids
          .filter((wcif_id) => wcif_id !== id)
          .map((wcif_id) => getResultByRound(competitionId, wcif_id)),
      )
    ).flatMap((round) =>
      round.data!.results.map((r) => ({ ...r, wcifId: round.data!.id })),
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
          roundId={Number.parseInt(roundId, 10)}
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
