"use client";

import { components } from "@/types/openapi";
import { useCallback, useState } from "react";
import useResultsSubscription, {
  DiffedLiveResult,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { Heading, HStack, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { DualLiveResult } from "@/lib/live/mergeAndOrderResults";
import DualRoundsTable from "@/components/live/DualRoundsTable";

function applyDiff(
  previousResults: DualLiveResult[],
  updated: DiffedLiveResult[],
  created: DualLiveResult[],
  deleted: number[],
): DualLiveResult[] {
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

export default function LiveUpdatingDualRoundsTable({
  roundId,
  resultsByRegistrationId,
  eventId,
  formatId,
  competitionId,
  competitors,
  title,
  isAdmin = false,
  showEmpty = true,
}: {
  roundId: number;
  resultsByRegistrationId: Record<string, DualLiveResult[]>;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const [liveResults, updateLiveResults] = useState<
    Record<string, DualLiveResult[]>
  >(resultsByRegistrationId);

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
      <DualRoundsTable
        resultsByRegistrationId={liveResults}
        eventId={eventId}
        formatId={formatId}
        competitionId={competitionId}
        competitors={competitors}
        showEmpty={showEmpty}
      />
    </VStack>
  );
}
