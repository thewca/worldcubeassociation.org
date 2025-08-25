import { Tabs } from "@chakra-ui/react";
import TabCompetitors from "@/components/competitions/TabCompetitors";

export default async function Events({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return (
    <Tabs.Content value="competitors">
      <TabCompetitors id={competitionId} />
    </Tabs.Content>
  );
}
