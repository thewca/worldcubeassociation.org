"use client";

import { components } from "@/types/openapi";
import { useCallback, useState } from "react";
import useResultsSubscription, {
  DiffedLiveResult,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";

function applyDiff(
  previousResults: components["schemas"]["LiveResult"][],
  updated: DiffedLiveResult[],
  created: components["schemas"]["LiveResult"][],
  deleted: number[],
): components["schemas"]["LiveResult"][] {
  const deletedSet = new Set(deleted);
  const updatesMap = new Map(updated.map((u) => [u.registration_id, u]));

  const diffedResults = previousResults
    .filter((res) => !deletedSet.has(res.registration_id))
    .map((res) => {
      const update = updatesMap.get(res.registration_id);
      return update ? { ...res, ...update } : res;
    });

  return diffedResults.concat(created);
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
    (result: DiffProtocolResponse) => {
      const { updated, created, deleted } = result;

      updateLiveResults((results) =>
        applyDiff(results, updated, created, deleted),
      );
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
      <LiveResultsTable
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
