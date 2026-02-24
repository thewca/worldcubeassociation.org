"use client";
import { components } from "@/types/openapi";
import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import { Format } from "@/lib/wca/data/formats";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { useLiveResults } from "@/providers/LiveResultProvider";
import events from "@/lib/wca/data/events";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import _ from "lodash";

export default function AddResults({
  format,
  roundId,
  competitionId,
  competitors,
}: {
  format: Format;
  roundId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
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
          eventId={eventId}
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
