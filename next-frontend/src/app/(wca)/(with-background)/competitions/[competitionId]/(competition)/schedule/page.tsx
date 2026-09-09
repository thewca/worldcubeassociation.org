import TabSchedule from "@/components/competitions/TabSchedule";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const competitionInfo = await getCompetitionInfo(competitionId)!;

  return (
    <TabSchedule
      competitionId={competitionInfo.data!.id}
      competitionName={competitionInfo.data!.name}
    />
  );
}
