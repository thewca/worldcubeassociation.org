import { Container, Heading } from "@chakra-ui/react";
import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { Fragment } from "react";
import ByPersonByRoundTable from "@/app/(wca)/competitions/[competitionId]/live/competitors/[registrationId]/ByPersonByRoundTable";
import { getRounds } from "@/lib/wca/live/getRounds";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
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

  // This will always be cached because we need to create the live layout
  const roundRequest = await getRounds(competitionId);

  if (!personResultRequest.data || !roundRequest.data) {
    return <p>Something went wrong while trying to fetch results</p>;
  }

  const { name, results } = personResultRequest.data;

  const { rounds } = roundRequest.data;

  const resultsByEvent = _.groupBy(results, "event_id");

  return (
    <Container>
      <Heading textStyle="h1">{name}</Heading>
      {_.map(resultsByEvent, (eventResults, key) => (
        <Fragment key={key}>
          <Heading textStyle="h2">{events.byId[key].name}</Heading>
          <ByPersonByRoundTable
            eventResults={eventResults}
            competitionId={competitionId}
            rounds={rounds.filter((r) => parseActivityCode(r.id).eventId)}
          />
        </Fragment>
      ))}
    </Container>
  );
}
