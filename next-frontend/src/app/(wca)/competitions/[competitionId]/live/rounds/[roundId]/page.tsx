"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { CurrentEventId, parseActivityCode } from "@wca/helpers";
import { Container, Heading, VStack } from "@chakra-ui/react";
import LiveResultsTable from "@/components/live/LiveResultsTable";

function roundResultsKey(roundId: string, competitionId: string) {
  return ["live-round", roundId, competitionId];
}
export default function ResultPage() {
  const { roundId, competitionId } =
    useParams<"/competitions/[competitionId]/live/rounds/[roundId]">();

  const api = useAPI();

  const { data: resultsRequest, isLoading } = useQuery({
    queryKey: roundResultsKey(roundId, competitionId),
    queryFn: () =>
      api.GET("/v1/competitions/{competitionId}/live/rounds/{roundId}", {
        params: { path: { roundId, competitionId } },
      }),
    select: (data) => data.data,
  });

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
        <Heading size="5xl">Live Results</Heading>
        <LiveResultsTable
          results={results}
          eventId={parseActivityCode(id).eventId as CurrentEventId}
          competitors={competitors}
          competitionId={competitionId}
        />
      </VStack>
    </Container>
  );
}
