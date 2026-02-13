"use client";

import { components } from "@/types/openapi";
import { useCallback, useState } from "react";
import useResultsSubscription, {
  DiffedLiveResult,
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import { Heading, HStack, Spacer, Switch, VStack } from "@chakra-ui/react";
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
}: {
  roundId: string;
  resultsByRegistrationId: Record<string, DualLiveResult[]>;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
}) {
  const [liveResults, updateLiveResults] = useState<
    Record<string, DualLiveResult[]>
  >(resultsByRegistrationId);

  const [showDualRoundsView, setShowDualRoundsView] = useState(true);

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
        <Spacer flex={1} />
        <Switch.Root
          checked={showDualRoundsView}
          onCheckedChange={(e) => setShowDualRoundsView(e.checked)}
          colorPalette="green"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Show combined Results</Switch.Label>
        </Switch.Root>
      </HStack>
      <DualRoundsTable
        wcifId={roundId}
        resultsByRegistrationId={liveResults}
        eventId={eventId}
        formatId={formatId}
        competitionId={competitionId}
        competitors={competitors}
        showDualRoundsView={showDualRoundsView}
      />
    </VStack>
  );
}
