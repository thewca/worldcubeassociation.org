import PermissionCheck from "@/components/PermissionCheck";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import DoubleCheck from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/double-check/DoubleCheck";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

export default async function DoubleCheckPage({
  params,
}: {
  params: Promise<{ roundId: string; competitionId: string }>;
}) {
  const { roundId, competitionId } = await params;

  const resultsRequest = await getResultByRound(competitionId, roundId);

  if (!resultsRequest.data) {
    return <p>Error loading Results</p>;
  }

  const { results, id, competitors, format } = resultsRequest.data;

  return (
    <PermissionCheck
      requiredPermission="canAdministerCompetition"
      item={competitionId}
    >
      <DoubleCheck
        competitionId={competitionId}
        competitors={competitors}
        results={results}
        formatId={format}
        roundId={roundId}
        eventId={parseActivityCode(id).eventId}
      />
    </PermissionCheck>
  );
}
