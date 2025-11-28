"use client";

import { components } from "@/types/openapi";
import { useCallback, useState } from "react";
import useResultsSubscription from "@/lib/hooks/useResultsSubscription";
import ResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";

function updateOrAddResult(
  previousResults: components["schemas"]["LiveResult"][],
  newResult: components["schemas"]["LiveResult"],
) {
  const resultsWithoutNewResult = previousResults.filter(
    (r) => r.registration_id !== newResult.registration_id,
  );

  return [...resultsWithoutNewResult, newResult];
}

export default function LiveUpdatingResultsTable({
  roundId,
  results,
  eventId,
  competitionId,
  competitors,
  title,
  isAdmin = false,
  showEmpty = true,
}: {
  roundId: number;
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const [liveResults, updateLiveResults] =
    useState<components["schemas"]["LiveResult"][]>(results);

  // Move to onEffectEvent when we are on React 19
  const onReceived = useCallback(
    (result: components["schemas"]["LiveResult"]) => {
      updateLiveResults((results) => updateOrAddResult(results, result));
    },
    [updateLiveResults],
  );

  const connectionState = useResultsSubscription(roundId, onReceived);

  return (
    <VStack align="left">
      <HStack>
        <Heading textStyle="h1">{title}</Heading>
        <ConnectionPulse connectionState={connectionState} />
      </HStack>
      <ResultsTable
        results={liveResults}
        eventId={eventId}
        competitionId={competitionId}
        competitors={competitors}
        isAdmin={isAdmin}
        showEmpty={showEmpty}
      />
    </VStack>
  );
}
