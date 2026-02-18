"use client";

import { components } from "@/types/openapi";
import { useCallback } from "react";
import useResultsSubscription, {
  DiffProtocolResponse,
} from "@/lib/hooks/useResultsSubscription";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, Spacer, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { applyDiffToLiveResults } from "@/lib/live/applyDiffToLiveResults";
import AdminButtons from "@/components/live/AdminButtons";
import PublicButtons from "@/components/live/PublicButtons";

export default function LiveUpdatingResultsTable({
  roundId,
  liveResults,
  updateLiveResults,
  eventId,
  formatId,
  competitionId,
  competitors,
  title,
  isAdmin = false,
  showEmpty = true,
}: {
  roundId: string;
  liveResults: components["schemas"]["LiveResult"][];
  updateLiveResults: React.Dispatch<
    React.SetStateAction<components["schemas"]["LiveResult"][]>
  >;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  // Move to onEffectEvent when we are on React 19
  const onReceived = useCallback(
    (result: DiffProtocolResponse) => {
      const { updated = [], created = [], deleted = [] } = result;

      updateLiveResults((results) =>
        applyDiffToLiveResults(results, updated, created, deleted),
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
        {isAdmin ? (
          <AdminButtons competitionId={competitionId} roundId={roundId} />
        ) : (
          <PublicButtons
            competitionId={competitionId}
            roundId={roundId}
            formatId={formatId}
            results={liveResults}
            competitors={competitors}
          />
        )}
      </HStack>
      <LiveResultsTable
        results={liveResults}
        eventId={eventId}
        formatId={formatId}
        competitionId={competitionId}
        competitors={competitors}
        isAdmin={isAdmin}
        showEmpty={showEmpty}
      />
    </VStack>
  );
}
