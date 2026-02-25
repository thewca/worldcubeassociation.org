import PermissionCheck from "@/components/PermissionCheck";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import DoubleCheck from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/double-check/DoubleCheck";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import formats from "@/lib/wca/data/formats";
import { Container } from "@chakra-ui/react";

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
    <Container>
      <PermissionCheck
        requiredPermission="canAdministerCompetition"
        item={competitionId}
      >
        <LiveResultProvider
          initialRound={resultsRequest.data}
          competitionId={competitionId}
        >
          <LiveResultAdminProvider
            format={formats.byId[format]}
            roundId={id}
            competitionId={competitionId}
            initialRegistrationId={competitors[0].id}
          >
            <DoubleCheck
              competitionId={competitionId}
              competitors={competitors}
              results={results}
              formatId={format}
              roundWcifId={id}
            />
          </LiveResultAdminProvider>
        </LiveResultProvider>
      </PermissionCheck>
    </Container>
  );
}
