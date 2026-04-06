import { Container, VStack } from "@chakra-ui/react";
import PermissionCheck from "@/components/PermissionCheck";
import AddResults from "./AddResults";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import OpenapiError from "@/components/ui/openapiError";
import React from "react";
import { getT } from "@/lib/i18n/get18n";
import formats from "@/lib/wca/data/formats";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import { getRoundName } from "@/lib/wca/live/getRoundName";
import { getRounds } from "@/lib/wca/live/getRounds";
import RoundOpenCheck from "@/components/live/RoundOpenCheck";

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

  if (error) return <OpenapiError response={response} t={t} />;

  const { competitors, format, id } = data;

  const {
    data: roundsData,
    error: roundsError,
    response: roundsResponse,
  } = await getRounds(competitionId);

  if (roundsError) return <OpenapiError response={roundsResponse} t={t} />;

  const roundName = getRoundName(id, t, roundsData.rounds, true);

  const round = roundsData.rounds.find((r) => r.id === id)!;

  return (
    <Container bg="bg">
      <RoundOpenCheck state={round.state} t={t}>
        <PermissionCheck
          requiredPermission="canAdministerCompetition"
          item={competitionId}
        >
          <VStack align="left">
            <LiveResultProvider
              initialRound={data}
              competitionId={competitionId}
            >
              <AddResults
                format={formats.byId[format]}
                roundId={roundId}
                competitionId={competitionId}
                competitors={competitors!}
                roundName={roundName}
              />
            </LiveResultProvider>
          </VStack>
        </PermissionCheck>
      </RoundOpenCheck>
    </Container>
  );
}
