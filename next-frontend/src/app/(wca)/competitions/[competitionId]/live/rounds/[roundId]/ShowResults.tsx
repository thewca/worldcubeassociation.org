"use client";

import { components } from "@/types/openapi";
import { useState } from "react";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";

export default function ShowResults({
  roundId,
  results,
  eventId,
  formatId,
  competitionId,
  competitors,
}: {
  roundId: string;
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
}) {
  const [liveResults, updateLiveResults] =
    useState<components["schemas"]["LiveResult"][]>(results);

  return (
    <LiveUpdatingResultsTable
      roundId={roundId}
      liveResults={liveResults}
      updateLiveResults={updateLiveResults}
      formatId={formatId}
      eventId={eventId}
      competitors={competitors}
      competitionId={competitionId}
      title="Live Results"
    />
  );
}
