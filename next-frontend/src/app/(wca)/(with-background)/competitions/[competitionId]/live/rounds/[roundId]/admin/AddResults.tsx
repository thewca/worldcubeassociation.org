import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import RoundNameHeader from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/rounds/[roundId]/admin/RoundNameHeader";
import RoundLockedAlert from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/rounds/[roundId]/admin/RoundLockedAlert";
import RoundLimits from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/rounds/[roundId]/admin/RoundLimits";

export default async function AddResults({
  competitionId,
}: {
  competitionId: string;
}) {
  return (
    <>
      <RoundLockedAlert />
      <RoundNameHeader />
      <RoundLimits />
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