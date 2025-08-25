import TabSchedule from "@/components/competitions/TabSchedule";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { Tabs } from "@chakra-ui/react";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const competitionInfo = await getCompetitionInfo(competitionId)!;

  return (
    <Tabs.Content value="schedule">
      <TabSchedule
        competitionId={competitionInfo.data!.id}
        competitionName={competitionInfo.data!.name}
      />
    </Tabs.Content>
  );
}
