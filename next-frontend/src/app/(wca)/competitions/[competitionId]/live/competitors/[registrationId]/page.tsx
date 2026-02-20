import { Container, Heading, Link, Table } from "@chakra-ui/react";
import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { Fragment } from "react";
import { LivePositionCell } from "@/components/live/Cells";

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
          <Table.Root mb="10">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Round</Table.ColumnHeader>
                <Table.ColumnHeader>Rank</Table.ColumnHeader>
                {_.times(
                  events.byId[key].recommendedFormat.expected_solve_count,
                ).map((num) => (
                  <Table.ColumnHeader key={num}>{num + 1}</Table.ColumnHeader>
                ))}
                <Table.ColumnHeader>Average</Table.ColumnHeader>
                <Table.ColumnHeader>Best</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {eventResults.map((result) => {
                const { round_id: roundId, attempts, average, best } = result;

                return (
                  <Table.Row key={`${roundId}-${key}`}>
                    <Table.Cell>
                      <Link
                        href={`/competitions/${competitionId}/live/rounds/${roundId}`}
                      >
                        Round {roundId}
                      </Link>
                    </Table.Cell>
                    <LivePositionCell
                      position={result.global_pos}
                      advancingParams={result}
                    />
                    {attempts.map((a) => (
                      <Table.Cell key={`${roundId}-${key}-${a.attempt_number}`}>
                        {formatAttemptResult(a.value, key)}
                      </Table.Cell>
                    ))}
                    <Table.Cell>{formatAttemptResult(average, key)}</Table.Cell>
                    <Table.Cell>{formatAttemptResult(best, key)}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Fragment>
      ))}
    </Container>
  );
}
