import TabCompetitors from "@/components/competitions/TabCompetitors";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { hasPassed } from "@/lib/wca/dates";

export default async function Competitors({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error || !competitionInfo) return { title: "Competition Not Found" };

  return (
    <TabCompetitors
      id={competitionId}
      isLive={hasPassed(competitionInfo.start_date)}
    />
  );
}
