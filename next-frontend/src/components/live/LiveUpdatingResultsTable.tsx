"use client";

import { components } from "@/types/openapi";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, Spacer, Switch, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import PendingResultsTable from "@/components/live/PendingResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useState } from "react";

export default function LiveUpdatingResultsTable({
  roundWcifId,
  formatId,
  competitionId,
  competitors,
  title,
  isAdmin = false,
  showEmpty = true,
  isDualRound = false,
}: {
  roundWcifId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
  isAdmin?: boolean;
  showEmpty?: boolean;
  isDualRound?: boolean;
}) {
  const [showDualRoundsView, setShowDualRoundsView] = useState(isDualRound);

  const { connectionState, liveResultsByRegistrationId, pendingLiveResults } =
    useLiveResults();

  const { eventId } = parseActivityCode(roundWcifId);

  return (
    <VStack align="left">
      <HStack>
        <Heading textStyle="h1">{title}</Heading>
        <ConnectionPulse connectionState={connectionState} />
        <Spacer flex={1} />
        {isDualRound && (
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
        )}
      </HStack>
      <PendingResultsTable
        pendingLiveResults={pendingLiveResults}
        formatId={formatId}
        eventId={eventId}
        competitors={competitors}
      />
      <LiveResultsTable
        resultsByRegistrationId={liveResultsByRegistrationId}
        roundWcifId={roundWcifId}
        formatId={formatId}
        competitionId={competitionId}
        competitors={competitors}
        isAdmin={isAdmin}
        showEmpty={showEmpty}
        showDualRoundsView={showDualRoundsView}
      />
    </VStack>
  );
}
