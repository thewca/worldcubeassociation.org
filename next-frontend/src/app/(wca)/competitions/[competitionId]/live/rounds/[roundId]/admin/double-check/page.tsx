import PermissionCheck from "@/components/PermissionCheck";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import DoubleCheck from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/double-check/DoubleCheck";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import formats from "@/lib/wca/data/formats";
import { Container } from "@chakra-ui/react";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import { DateTime } from "luxon";
import ConfirmProvider from "@/providers/ConfirmProvider";

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

  const { results, id, format } = data;

  const sortedResults = results.toSorted(
    (a, b) =>
      DateTime.fromISO(b.last_attempt_entered_at).toMillis() -
      DateTime.fromISO(a.last_attempt_entered_at).toMillis(),
  );

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
            initialRegistrationId={sortedResults[0].registration_id}
          >
            <ConfirmProvider>
              <DoubleCheck
                competitionId={competitionId}
                results={sortedResults}
                formatId={format}
                roundWcifId={id}
              />
            </ConfirmProvider>
          </LiveResultAdminProvider>
        </LiveResultProvider>
      </PermissionCheck>
    </Container>
  );
}
