"use client";

import { components } from "@/types/openapi";
import { useState } from "react";
import { Heading, HStack, Spacer, Switch, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import DualRoundsTable from "@/components/live/DualRoundsTable";
import { useDualRoundLiveResults } from "@/providers/DualRoundLiveResultProvider";

export default function LiveUpdatingDualRoundsTable({
  roundId,
  eventId,
  formatId,
  competitionId,
  competitors,
  title,
}: {
  roundId: string;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
}) {
  const [showDualRoundsView, setShowDualRoundsView] = useState(true);

  const { connectionState, liveResultsByRegistrationId } =
    useDualRoundLiveResults();

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
        resultsByRegistrationId={liveResultsByRegistrationId}
        eventId={eventId}
        formatId={formatId}
        competitionId={competitionId}
        competitors={competitors}
        showDualRoundsView={showDualRoundsView}
      />
    </VStack>
  );
}
