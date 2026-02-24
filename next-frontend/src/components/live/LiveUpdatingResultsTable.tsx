"use client";

import { components } from "@/types/openapi";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import { Button, Heading, HStack, Spacer, VStack } from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import { LuGalleryVertical } from "react-icons/lu";
import ResultsProjector from "@/components/live/ResultsProjector";
import { useState } from "react";

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

  const [inProjectorMode, setInProjectorMode] = useState(false);
  const enableProjectorView = () => setInProjectorMode(true);
  const disableProjectorView = () => setInProjectorMode(false);

  if (inProjectorMode) {
    return (
      <ResultsProjector
        competitors={competitors}
        results={liveResults}
        disableProjectorView={disableProjectorView}
        formatId={formatId}
        eventId={eventId}
        forecastView={false}
        title={title}
      />
    );
  }

  return (
    <VStack align="left">
      <HStack>
        <Heading textStyle="h1">{title}</Heading>
        <ConnectionPulse connectionState={connectionState} />
        <Spacer flex={1} />
        <Button onClick={enableProjectorView}>
          <LuGalleryVertical />
        </Button>
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
