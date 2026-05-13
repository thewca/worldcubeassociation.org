import { SimpleGrid, GridItem, Heading } from "@chakra-ui/react";
import ClosableAlert from "@/components/ui/ClosableAlert";
import AttemptsForm from "@/components/live/AttemptsForm";
import formats from "@/lib/wca/data/formats";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { LiveRoundAdminBase } from "@/types/live";
import { getT } from "@/lib/i18n/get18n";

export default async function AddResults({
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

  const { t } = await getT();

  const isLocked = round.state === "locked";

  return (
    <>
      {isLocked && (
        <ClosableAlert
          status="warning"
          title={t("competitions.live.admin.warnings.round_locked")}
        />
      )}
      <Heading textStyle="h1">{roundName}</Heading>
      <SimpleGrid columns={16} gap={6}>
        <GridItem colSpan={4} position="sticky" top={4} alignSelf="start">
          <AttemptsForm
            header="Add Result"
            eventId={eventId}
            solveCount={format.expected_solve_count}
          />
        </GridItem>

        <GridItem colSpan={12}>
          <LiveUpdatingResultsTable
            roundWcifId={round.id}
            formatId={round.format}
            competitionId={competitionId}
            isAdminView
            canManage
            title=""
          />
        </GridItem>
      </SimpleGrid>
    </>
  );
}
