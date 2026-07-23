import { SimpleGrid, GridItem } from "@chakra-ui/react";
import AttemptsForm from "@/components/live/AttemptsForm";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import RoundNameHeader from "./RoundNameHeader";
import RoundLockedAlert from "./RoundLockedAlert";
import RoundLimits from "./RoundLimits";
import Round9mAlert from "./Round9mAlert";

export default async function AddResults({
  competitionId,
}: {
  competitionId: string;
}) {
  return (
    <>
      <RoundLockedAlert />
      <Round9mAlert />
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
