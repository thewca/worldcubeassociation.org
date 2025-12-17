import { Container, Heading, Text } from "@chakra-ui/react";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { Fragment } from "react";
import { getLivePodiums } from "@/lib/wca/live/getLivePodiums";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import LiveResultsTable from "@/components/live/LiveResultsTable";
import _ from "lodash";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { error: podiumError, data: rounds } =
    await getLivePodiums(competitionId);

  if (podiumError) {
    return <Text>Error fetching Podiums</Text>;
  }

  const roundsByEventId = _.groupBy(
    rounds,
    (r) => parseActivityCode(r.id).eventId,
  );

  return (
    <Container>
      <Heading textStyle="h1">Podiums</Heading>
      {WCA_EVENT_IDS.map((e) => {
        const rounds = roundsByEventId[e];
        if (!rounds) return;
        const finalRound = rounds[0];
        const eventId = parseActivityCode(finalRound.id).eventId;
        return (
          <Fragment key={finalRound.id}>
            <Heading textStyle="h3" p="2">
              {events.byId[eventId].name}
            </Heading>
            {finalRound.results.length > 0 ? (
              <LiveResultsTable
                results={finalRound.results}
                competitionId={competitionId}
                competitors={finalRound.competitors}
                eventId={eventId}
                showEmpty={false}
              />
            ) : (
              "Podiums to be determined"
            )}
          </Fragment>
        );
      })}
    </Container>
  );
}
