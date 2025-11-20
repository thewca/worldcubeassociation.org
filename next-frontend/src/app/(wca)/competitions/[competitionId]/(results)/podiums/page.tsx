import { Card, Heading, Text, VStack } from "@chakra-ui/react";
import { ResultsTable } from "@/components/results/ResultsTable";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { getPodiums } from "@/lib/wca/competitions/getPodiums";
import { Fragment } from "react";
import _ from "lodash";
import { getT } from "@/lib/i18n/get18n";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { t } = await getT();

  const { error: podiumError, data: podiumResults } =
    await getPodiums(competitionId);

  if (podiumError) {
    return <Text>Error fetching Podiums</Text>;
  }

  const resultsByEvent = _.groupBy(podiumResults, "event_id");

  return (
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title>
          <Text
            fontSize="md"
            textTransform="uppercase"
            fontWeight="medium"
            letterSpacing="wider"
          >
            Podiums
          </Text>
        </Card.Title>
        <VStack align="left" gap={4}>
          {WCA_EVENT_IDS.map((eventId) => {
            const results = resultsByEvent[eventId];
            if (!results) {
              return null;
            }
            return (
              <Fragment key={eventId}>
                <Heading size="2xl">{events.byId[eventId].name}</Heading>
                <ResultsTable
                  results={results.toSorted((a, b) => a.pos - b.pos)}
                  t={t}
                  eventId={eventId}
                  isAdmin={false}
                />
              </Fragment>
            );
          })}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
