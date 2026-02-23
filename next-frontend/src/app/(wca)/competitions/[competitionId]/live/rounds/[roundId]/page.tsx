"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function ResultPage({
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

  const { competitors, format } = data;

  return (
    <Container bg="bg">
      <VStack align="left">
        <LiveResultProvider initialRound={data} competitionId={competitionId}>
          <LiveUpdatingResultsTable
            formatId={format}
            eventId={parseActivityCode(roundId).eventId}
            competitors={competitors}
            competitionId={competitionId}
            title="Live Results"
          />
        </LiveResultProvider>
      </VStack>
    </Container>
  );
}
