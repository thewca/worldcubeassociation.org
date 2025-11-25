"use client";

import { components } from "@/types/openapi";
import { useCallback, useEffectEvent, useState } from "react";
import useResultsSubscription from "@/lib/hooks/useResultsSubscription";
import ResultsTable from "@/components/live/LiveResultsTable";
import { VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";

export default function LiveUpdatingResultsTable({
  roundId,
  results,
  eventId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
}: {
  roundId: number;
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const [liveResults, updateLiveResults] =
    useState<components["schemas"]["LiveResult"][]>(results);

  const onReceived = useCallback(
    (result: components["schemas"]["LiveResult"]) => {
      updateLiveResults((results) => [...results, result]);
    },
    [updateLiveResults],
  );

  const connectionState = useResultsSubscription(roundId, onReceived);

  return (
    <VStack>
      <ConnectionPulse connectionState={connectionState} />
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
