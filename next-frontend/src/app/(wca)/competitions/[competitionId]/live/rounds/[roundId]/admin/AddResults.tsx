"use client";
import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import { Format } from "@/lib/wca/data/formats";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import {
  parseActivityCode,
  WcifCutoff,
  WcifTimeLimit,
} from "@/lib/wca/wcif/rounds";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import { LiveCompetitor } from "@/types/live";
import ConfirmProvider from "@/providers/ConfirmProvider";

export default function AddResults({
  format,
  roundId,
  competitionId,
  roundName,
  cutoff,
  timeLimit,
}: {
  format: Format;
  roundId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
  roundName: string;
  cutoff?: WcifCutoff;
  timeLimit?: WcifTimeLimit;
}) {
  const { eventId } = parseActivityCode(roundId);

  return (
    <LiveResultAdminProvider
      format={format}
      roundId={roundId}
      competitionId={competitionId}
      cutoff={cutoff}
      timeLimit={timeLimit}
    >
      <SimpleGrid columns={16} gap={6}>
        <GridItem colSpan={4}>
          <ConfirmProvider>
            <AttemptsForm
              header="Add Result"
              eventId={eventId}
              solveCount={format.expected_solve_count}
            />
          </ConfirmProvider>
        </GridItem>

        <GridItem colSpan={12}>
          <LiveUpdatingResultsTable
            roundWcifId={roundId}
            formatId={format.id}
            competitionId={competitionId}
            isAdminView
            canManage
            title={roundName}
          />
        </GridItem>
      </SimpleGrid>
    </LiveResultAdminProvider>
  );
}
