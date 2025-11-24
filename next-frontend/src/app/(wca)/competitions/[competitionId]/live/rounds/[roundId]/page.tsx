"use server";

import { Container, Heading, VStack } from "@chakra-ui/react";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";

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
        <Heading textStyle="h1">Live Results</Heading>
        <LiveResultsTable
          results={results}
          eventId={parseActivityCode(id).eventId}
          competitors={competitors}
          competitionId={competitionId}
        />
      </VStack>
    </Container>
  );
}
