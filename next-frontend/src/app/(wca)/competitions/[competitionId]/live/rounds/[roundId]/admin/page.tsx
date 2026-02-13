import { Container, Heading, VStack } from "@chakra-ui/react";
import PermissionCheck from "@/components/PermissionCheck";
import AddResults from "./AddResults";
import { getResultByRound } from "@/lib/wca/live/getResultsByRound";
import OpenapiError from "@/components/ui/openapiError";
import React from "react";
import { getT } from "@/lib/i18n/get18n";
import formats from "@/lib/wca/data/formats";

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

  const { results, competitors, format } = data;

  return (
    <Container bg="bg">
      <PermissionCheck
        requiredPermission="canAdministerCompetition"
        item={competitionId}
      >
        <VStack align="left">
          <Heading textStyle="h1">Live Results</Heading>
          <AddResults
            results={results}
            format={formats.byId[format]}
            roundId={roundId}
            competitionId={competitionId}
            competitors={competitors!}
          />
        </VStack>
      </PermissionCheck>
    </Container>
  );
}
