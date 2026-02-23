"use server";

import { Container, VStack } from "@chakra-ui/react";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import LiveUpdatingDualRoundsTable from "@/components/live/LiveUpdatingDualRoundsTable";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import _ from "lodash";
import { components } from "@/types/openapi";
import { DualRoundLiveResultProvider } from "@/providers/DualRoundLiveResultProvider";

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

  const { competitors, format, id, linked_round_ids } = data;

  if (linked_round_ids) {
    const linkedRounds = await Promise.all(
      linked_round_ids
        .filter((wcif_id) => wcif_id !== id)
        .map((wcif_id) => getResultByRound(competitionId, wcif_id)),
    );

    return (
      <Container bg="bg">
        <VStack align="left">
          <DualRoundLiveResultProvider
            initialRounds={[...linkedRounds.map((d) => d.data!), data]}
          >
            <LiveUpdatingDualRoundsTable
              roundId={roundId}
              formatId={format}
              eventId={parseActivityCode(id).eventId}
              competitors={competitors}
              competitionId={competitionId}
              title="Live Results"
            />
          </DualRoundLiveResultProvider>
        </VStack>
      </Container>
    );
  }

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
