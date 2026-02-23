"use client";

import { components } from "@/types/openapi";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, Spacer, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import AdminButtons from "@/components/live/AdminButtons";
import PublicButtons from "@/components/live/PublicButtons";
import { useParams } from "next/navigation";

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
  competitors: components["schemas"]["LiveCompetitor"][];
  title: string;
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const { connectionState, liveResults } = useLiveResults();

  const { roundId } =
    useParams<"/competitions/[competitionId]/live/rounds/[roundId]">();

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
