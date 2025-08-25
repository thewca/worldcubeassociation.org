import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { Tabs } from "@chakra-ui/react";
import TabEvents from "@/components/competitions/TabEvents";

export default async function Events({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const competitionInfo = await getCompetitionInfo(competitionId)!;

  return (
    <Tabs.Content value="events">
      <TabEvents
        competitionId={competitionInfo.data!.id}
        forceQualifications={competitionInfo.data!["uses_qualification?"]}
      />
    </Tabs.Content>
  );
}
