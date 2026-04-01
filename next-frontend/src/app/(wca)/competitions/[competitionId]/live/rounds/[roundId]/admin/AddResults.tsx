"use client";
import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import { Format } from "@/lib/wca/data/formats";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import { LiveCompetitor } from "@/types/live";

export default function AddResults({
  format,
  roundId,
  competitionId,
  roundName,
}: {
  format: Format;
  roundId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
  roundName: string;
}) {
  const { eventId } = parseActivityCode(roundId);

  return (
    <LiveResultAdminProvider
      format={format}
      roundId={roundId}
      competitionId={competitionId}
    >
      <SimpleGrid columns={16} gap={6}>
        <GridItem colSpan={4}>
          <AttemptsForm
            header="Add Result"
            eventId={eventId}
            solveCount={format.expected_solve_count}
          />
        </GridItem>

        <GridItem colSpan={12}>
          <LiveUpdatingResultsTable
            roundWcifId={roundId}
            formatId={format.id}
            competitionId={competitionId}
            isAdmin
            title={roundName}
          />
        </GridItem>
      </SimpleGrid>
    </LiveResultAdminProvider>
  );
}
