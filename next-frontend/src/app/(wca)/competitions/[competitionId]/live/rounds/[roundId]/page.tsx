"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import ShowResults from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/ShowResults";

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

  const { eventId } = parseActivityCode(roundId);

  return (
    <Container bg="bg">
      <VStack align="left">
        <ShowResults
          roundId={roundId}
          results={results}
          eventId={eventId}
          formatId={format}
          competitionId={competitionId}
          competitors={competitors}
        />
      </VStack>
    </Container>
  );
}
