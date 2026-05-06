import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import { getT } from "@/lib/i18n/get18n";
import RoundNameHeader from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/RoundNameHeader";
import RoundLockedAlert from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/RoundLockedAlert";

export default async function AddResults({
  competitionId,
}: {
  competitionId: string;
}) {
  const { t } = await getT();

  return (
    <>
      <RoundLockedAlert t={t} />
      <RoundNameHeader />
      <SimpleGrid columns={16} gap={6}>
        <GridItem colSpan={4} position="sticky" top={4} alignSelf="start">
          <AttemptsForm header="Add Result" />
        </GridItem>

        <GridItem colSpan={12}>
          <LiveUpdatingResultsTable
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
