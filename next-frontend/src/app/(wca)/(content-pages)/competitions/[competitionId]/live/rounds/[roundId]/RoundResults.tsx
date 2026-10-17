"use client";

import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { useRoundName } from "@/lib/wca/live/getRoundName";

export default function RoundResults({
  competitionId,
  canManage,
}: {
  competitionId: string;
  canManage: boolean;
}) {
  const roundName = useRoundName();

  return (
    <LiveUpdatingResultsTable
      competitionId={competitionId}
      title={roundName}
      canManage={canManage}
    />
  );
}
