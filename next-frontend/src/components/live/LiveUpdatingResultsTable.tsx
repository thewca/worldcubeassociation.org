"use client";

import { components } from "@/types/openapi";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Heading, HStack, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import _ from "lodash";

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
  const { connectionState, liveResultsByRegistrationId } = useLiveResults();

  const liveResults = _.flatMap(liveResultsByRegistrationId);

  return (
    <VStack align="left">
      <HStack>
        <Heading textStyle="h1">{title}</Heading>
        <ConnectionPulse connectionState={connectionState} />
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
