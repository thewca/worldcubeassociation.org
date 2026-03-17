import PermissionCheck from "@/components/PermissionCheck";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import DoubleCheck from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/double-check/DoubleCheck";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import formats from "@/lib/wca/data/formats";
import { Container } from "@chakra-ui/react";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function DoubleCheckPage({
  params,
}: {
  params: Promise<{ roundId: string; competitionId: string }>;
}) {
  const { roundId, competitionId } = await params;

  const { t } = await getT();

  const { data, error, response } = await getResultByRound(
    competitionId,
    roundId,
  );

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  const { results, id, competitors, format } = data;

  return (
    <Container>
      <PermissionCheck
        requiredPermission="canAdministerCompetition"
        item={competitionId}
      >
        <LiveResultProvider initialRound={data} competitionId={competitionId}>
          <LiveResultAdminProvider
            format={formats.byId[format]}
            roundId={id}
            competitionId={competitionId}
            initialRegistrationId={competitors[0].id}
          >
            <DoubleCheck
              competitionId={competitionId}
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
