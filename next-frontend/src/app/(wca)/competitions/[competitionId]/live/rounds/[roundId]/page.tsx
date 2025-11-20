"use client";

import { useParams } from "next/navigation";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { Container, Heading, VStack } from "@chakra-ui/react";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

export default function ResultPage() {
  const { roundId, competitionId } =
    useParams<"/competitions/[competitionId]/live/rounds/[roundId]">();

  const api = useAPI();

  const { data: resultsRequest, isLoading } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      params: { path: { roundId, competitionId } },
    },
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!resultsRequest) {
    return <p>Error loading Results</p>;
  }

  const { results, id, competitors } = resultsRequest;

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
