import { Card, Text, VStack } from "@chakra-ui/react";
import _ from "lodash";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import LinkedRoundResults from "@/components/results/LinkedRoundResults";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function LinkedRoundsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { t } = await getT();

  const {
    data: competitionResults,
    error,
    response,
  } = await getCompetitionResults(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  const linkedRounds = competitionResults.filter(
    (round) => round.ranking_mode === "linked_round",
  );

  const linkedRoundGroups = _.map(
    _.groupBy(linkedRounds, (round) => round.linked_round_wcif_ids?.join()),
    (rounds, linkedRoundId) => ({
      linkedRoundId,
      eventId: rounds[0].event_id,
      rounds,
    }),
  );

  return (
    <Card.Root>
      <Card.Body>
        {linkedRoundGroups.length > 0 ? (
          <VStack align="left" gap={4}>
            {linkedRoundGroups.map((group) => (
              <LinkedRoundResults
                key={group.linkedRoundId}
                rounds={group.rounds}
                eventId={group.eventId}
              />
            ))}
          </VStack>
        ) : (
          <Text>{t("competitions.messages.no_results")}</Text>
        )}
      </Card.Body>
    </Card.Root>
  );
}
