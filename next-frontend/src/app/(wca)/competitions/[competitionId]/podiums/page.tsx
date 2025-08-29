import { Container, Heading } from "@chakra-ui/react";
import ResultsTable from "@/components/results/ResultsTable";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { getPodiums } from "@/lib/wca/competitions/getPodiums";
import { Fragment } from "react";
import _ from "lodash";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const podiumsRequest = await getPodiums(competitionId);

  const podiumResults = podiumsRequest.data!;

  const resultsByEvent = _.groupBy(podiumResults, "event_id");

  return (
    <Container bg="bg">
      <Heading size="5xl">Podiums</Heading>
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
              competitionId={competitionId}
              eventId={eventId}
              isAdmin={false}
            />
          </Fragment>
        );
      })}
    </Container>
  );
}
