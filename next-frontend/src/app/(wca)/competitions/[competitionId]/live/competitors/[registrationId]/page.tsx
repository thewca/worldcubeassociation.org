import { Container, Heading } from "@chakra-ui/react";
import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { Fragment } from "react";
import ByPersonByRoundTable from "@/app/(wca)/competitions/[competitionId]/live/competitors/[registrationId]/ByPersonByRoundTable";
export default async function PersonResults({
  params,
}: {
  params: Promise<{ registrationId: string; competitionId: string }>;
}) {
  const { competitionId, registrationId } = await params;

  const personResultRequest = await getResultByPerson(
    competitionId,
    registrationId,
  );

  if (!personResultRequest.data) {
    return <p>Something went wrong while trying to fetch results</p>;
  }

  const { name, results } = personResultRequest.data;

  const resultsByEvent = _.groupBy(results, "event_id");

  return (
    <Container>
      <Heading textStyle="h1">{name}</Heading>
      {_.map(resultsByEvent, (eventResults, key) => (
        <Fragment key={key}>
          <Heading textStyle="h2">{events.byId[key].name}</Heading>
          <ByPersonByRoundTable
            format={events.byId[key].recommendedFormat}
            eventResults={eventResults}
            competitionId={competitionId}
          />
        </Fragment>
      ))}
    </Container>
  );
}
