import { Container, VStack } from "@chakra-ui/react";
import PermissionCheck from "@/components/PermissionCheck";
import AddResults from "./AddResults";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import OpenapiError from "@/components/ui/openapiError";
import React from "react";
import { getT } from "@/lib/i18n/get18n";
import { LiveResultProvider } from "@/providers/LiveResultProvider";
import RoundOpenCheck from "@/components/live/RoundOpenCheck";
import { LiveResultAdminProvider } from "@/providers/LiveResultAdminProvider";
import { RoundInfoProvider } from "@/providers/RoundInfoProvider";

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

  return (
    <Container bg="bg">
      <RoundInfoProvider roundId={roundId}>
        <RoundOpenCheck>
          <PermissionCheck
            requiredPermission="canAdministerCompetition"
            item={competitionId}
          >
            <VStack align="left">
              <LiveResultProvider
                initialRound={data}
                competitionId={competitionId}
              >
                <LiveResultAdminProvider competitionId={competitionId}>
                  <AddResults competitionId={competitionId} />
                </LiveResultAdminProvider>
              </LiveResultProvider>
            </VStack>
          </PermissionCheck>
        </RoundOpenCheck>
      </RoundInfoProvider>
    </Container>
  );
}
