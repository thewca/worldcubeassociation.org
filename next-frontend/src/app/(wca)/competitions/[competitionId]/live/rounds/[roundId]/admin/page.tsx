"use server";

import { Container, Heading, VStack } from "@chakra-ui/react";
import PermissionCheck from "@/components/PermissionCheck";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getRoundResults } from "@/lib/wca/competitions/live/getRoundResults";
import AddResults from "./AddResults";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ roundId: string; competitionId: string }>;
}) {
  const { roundId, competitionId } = await params;

  const resultsRequest = await getRoundResults(competitionId, roundId);

  if (!resultsRequest.data) {
    return <p>There was an error fetching the Round Results</p>;
  }

  const { results, id, competitors } = resultsRequest.data;

  return (
    <Container bg="bg">
      <PermissionCheck
        requiredPermission="canAdministerCompetition"
        item={competitionId}
      >
        <VStack align="left">
          <Heading textStyle="h1">Live Results</Heading>
          <AddResults
            results={results!}
            eventId={parseActivityCode(id).eventId}
            roundId={roundId}
            competitionId={competitionId}
            competitors={competitors!}
          />
        </VStack>
      </PermissionCheck>
    </Container>
  );
}
