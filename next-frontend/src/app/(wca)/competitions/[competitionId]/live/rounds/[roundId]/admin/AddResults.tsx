"use client";
import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import formats from "@/lib/wca/data/formats";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import { LiveRoundAdminBase } from "@/types/live";
import ConfirmProvider from "@/providers/ConfirmProvider";

export default function AddResults({
  competitionId,
  roundName,
  round,
}: {
  competitionId: string;
  roundName: string;
  round: LiveRoundAdminBase;
}) {
  const { eventId } = parseActivityCode(round.id);
  const format = formats.byId[round.format];

  return (
    <LiveResultAdminProvider round={round} competitionId={competitionId}>
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
            roundWcifId={round.id}
            formatId={round.format}
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
