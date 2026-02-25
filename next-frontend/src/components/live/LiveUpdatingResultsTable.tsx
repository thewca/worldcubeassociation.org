"use client";

import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import PendingResultsTable from "@/components/live/PendingResultsTable";
import { LiveCompetitor } from "@/types/live";

export default function LiveUpdatingResultsTable({
  eventId,
  formatId,
  competitionId,
  competitors,
  title,
  isAdmin = false,
  showEmpty = true,
}: {
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
  title: string;
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const { connectionState, liveResultsByRegistrationId, pendingLiveResults } =
    useLiveResults();

  return (
    <VStack align="left">
      <HStack>
        <Heading textStyle="h1">{title}</Heading>
        <ConnectionPulse connectionState={connectionState} />
      </HStack>
      <PendingResultsTable
        pendingLiveResults={pendingLiveResults}
        formatId={formatId}
        eventId={eventId}
        competitors={competitors}
      />
      <LiveResultsTable
        resultsByRegistrationId={liveResultsByRegistrationId}
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
