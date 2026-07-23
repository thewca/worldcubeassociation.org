"use server";

import { Container, VStack } from "@chakra-ui/react";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import {
  LiveResultProvider,
  MultiRoundResultProvider,
} from "@/providers/LiveResultProvider";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import getPermissions from "@/lib/wca/permissions";
import RoundOpenCheck from "@/components/live/RoundOpenCheck";
import { RoundInfoProvider } from "@/providers/RoundInfoProvider";
import RoundResults from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/rounds/[roundId]/RoundResults";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import events from "@/lib/wca/data/events";

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

  const { id, linked_round_ids } = data;

  const permissions = await getPermissions();

  const canManage =
    !!permissions && permissions.canScoretakeCompetition(competitionId);

  if (linked_round_ids) {
    const eventName = events.byId[parseActivityCode(id).eventId].name;

    const linkedRounds = await Promise.all(
      linked_round_ids
        .filter((wcif_id) => wcif_id !== id)
        .map((wcif_id) => getResultByRound(competitionId, wcif_id)),
    );

    const erroredResponse = linkedRounds.find((data) => data.error);

    if (erroredResponse) {
      return <OpenapiError response={erroredResponse.response} t={t} />;
    }

    return (
      <Container bg="bg">
        <VStack align="left">
          <RoundInfoProvider roundId={id}>
            <RoundOpenCheck>
              <MultiRoundResultProvider
                initialRounds={[data, ...linkedRounds.map((d) => d.data!)]}
                competitionId={competitionId}
              >
                <LiveUpdatingResultsTable
                  competitionId={competitionId}
                  title={`${eventName} - ${t("competitions.live.combined_title")}`}
                  isLinkedRound
                  canManage={canManage}
                />
              </MultiRoundResultProvider>
            </RoundOpenCheck>
          </RoundInfoProvider>
        </VStack>
      </Container>
    );
  }

  return (
    <Container bg="bg">
      <VStack align="left">
        <RoundInfoProvider roundId={id}>
          <RoundOpenCheck>
            <LiveResultProvider
              initialRound={data}
              competitionId={competitionId}
            >
              <RoundResults
                competitionId={competitionId}
                canManage={canManage}
              />
            </LiveResultProvider>
          </RoundOpenCheck>
        </RoundInfoProvider>
      </VStack>
    </Container>
  );
}
