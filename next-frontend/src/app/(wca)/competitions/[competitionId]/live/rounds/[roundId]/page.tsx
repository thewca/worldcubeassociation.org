"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";

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

  const { results, id, competitors } = resultsRequest.data;

  return (
    <Container bg="bg">
      <VStack align="left">
        <LiveUpdatingResultsTable
          roundId={Number.parseInt(roundId, 10)}
          results={results}
          eventId={parseActivityCode(id).eventId}
          competitors={competitors}
          competitionId={competitionId}
          title="Live Results"
        />
      </VStack>
    </Container>
  );
}
