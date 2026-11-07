import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import TabEvents from "@/components/competitions/TabEvents";

export default async function Events({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const competitionInfo = await getCompetitionInfo(competitionId)!;

  return (
    <TabEvents
      competitionId={competitionInfo.data!.id}
      forceQualifications={competitionInfo.data!["uses_qualification?"]}
    />
  );
}
