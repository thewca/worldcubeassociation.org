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
import _ from "lodash";
import { decompressDiff } from "@/lib/live/decompressDiff";

function applyDiff(
  previousResults: Record<string, DualLiveResult[]>,
  updated: DiffedLiveResult[],
  created: DualLiveResult[],
  deleted: number[],
  wcif_id: string,
): Record<string, DualLiveResult[]> {
  const deletedSet = new Set(deleted);
  const updatesMap = new Map(updated.map((u) => [u.registration_id, u]));

  const resultsWithoutRemoved = _.filter(
    previousResults,
    (_r, registration_id) => !deletedSet.has(Number(registration_id)),
  );

  const updatedResults = _.mapValues(resultsWithoutRemoved, (results) => {
    return results.map((result) => {
      const update = updatesMap.get(result.registration_id);
      return update && wcif_id === result.wcifId
        ? { ...result, ...update }
        : result;
    });
  });

  const newResults = _.groupBy(created, "registration_id");

  return _.merge(updatedResults, newResults);
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
      const { updated = [], created = [], deleted = [], wcif_id } = result;

      updateLiveResults((results) =>
        applyDiff(
          results,
          updated,
          created.map((r) => ({ ...decompressDiff(r), wcifId: wcif_id })),
          deleted,
          wcif_id,
        ),
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
