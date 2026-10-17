import { Card, Heading, Text, VStack } from "@chakra-ui/react";
import { ResultsTable } from "@/components/results/ResultsTable";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { getPodiums } from "@/lib/wca/competitions/getPodiums";
import { Fragment } from "react";
import _ from "lodash";
import { getT } from "@/lib/i18n/get18n";
import EventIcon from "@/components/EventIcon";

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
    <Card.Root>
      <Card.Body>
        <Card.Title asChild>
          <Text textStyle="s3">Podiums</Text>
        </Card.Title>
        <VStack align="left" gap={4}>
          {WCA_EVENT_IDS.map((eventId) => {
            const results = resultsByEvent[eventId];
            if (!results) {
              return null;
            }
            return (
              <Fragment key={eventId}>
                <Heading
                  size="2xl"
                  display="inline-flex"
                  alignItems="center"
                  gap="2"
                >
                  <EventIcon eventId={eventId} />
                  {events.byId[eventId].name}
                </Heading>
                <ResultsTable
                  results={results.toSorted((a, b) => a.pos - b.pos)}
                  t={t}
                  eventId={eventId}
                  formatId={
                    results[0]
                      .format_id /* anti-pattern because of current API data restrictions */
                  }
                  isAdmin={false}
                  solveTextAlign="center"
                />
              </Fragment>
            );
          })}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
