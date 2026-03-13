"use client";
import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import { Format } from "@/lib/wca/data/formats";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import events from "@/lib/wca/data/events";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import { LiveCompetitor } from "@/types/live";

export default function AddResults({
  format,
  roundId,
  competitionId,
  competitors,
}: {
  format: Format;
  roundId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
}) {
  const { eventId, roundNumber } = parseActivityCode(roundId);

  return (
    <SimpleGrid columns={16} gap={6}>
      <GridItem colSpan={4}>
        <LiveResultAdminProvider
          format={format}
          roundId={roundId}
          competitionId={competitionId}
        >
          <AttemptsForm
            header="Add Result"
            eventId={eventId}
            competitors={competitors}
            solveCount={format.expected_solve_count}
          />
        </LiveResultAdminProvider>
      </GridItem>

      <GridItem colSpan={12}>
        <LiveUpdatingResultsTable
          roundWcifId={roundId}
          formatId={format.id}
          competitionId={competitionId}
          competitors={competitors}
          isAdmin
          title={`${events.byId[eventId].name} - ${roundNumber}`}
        />
      </GridItem>
    </SimpleGrid>
  );
}
