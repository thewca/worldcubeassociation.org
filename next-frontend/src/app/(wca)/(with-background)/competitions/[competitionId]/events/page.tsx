import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import TabEvents from "@/components/competitions/TabEvents";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
