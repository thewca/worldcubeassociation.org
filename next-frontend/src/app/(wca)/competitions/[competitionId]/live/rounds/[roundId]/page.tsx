"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import events from "@/lib/wca/data/events";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ roundId: string; competitionId: string }>;
}) {
  const { roundId, competitionId } = await params;
  const { t } = await getT();

  const { data, response, error } = await getResultByRound(
    competitionId,
    roundId,
  );

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  const { results, competitors, format } = data;

  const { eventId, roundNumber } = parseActivityCode(roundId);

  return (
    <Container bg="bg">
      <VStack align="left">
        <LiveUpdatingResultsTable
          roundId={roundId}
          results={results}
          eventId={eventId}
          formatId={format}
          competitors={competitors}
          competitionId={competitionId}
          title={`${events.byId[eventId].name} Round ${roundNumber}`}
        />
      </VStack>
    </Container>
  );
}
