"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
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

  const { results, id, competitors, format } = resultsRequest.data;

  return (
    <Container bg="bg">
      <VStack align="left">
        <ShowResults
          roundId={roundId}
          results={results}
          eventId={parseActivityCode(id).eventId}
          formatId={format}
          competitionId={competitionId}
          competitors={competitors}
        />
      </VStack>
    </Container>
  );
}
