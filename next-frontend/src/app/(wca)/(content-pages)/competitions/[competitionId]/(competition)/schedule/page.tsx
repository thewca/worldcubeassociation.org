import TabSchedule from "@/components/competitions/TabSchedule";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const competitionInfo = await getCompetitionInfo(competitionId)!;

  return (
    <TabSchedule
      competitionId={competitionId}
      competitionName={competitionInfo.data!.name}
    />
  );
}
