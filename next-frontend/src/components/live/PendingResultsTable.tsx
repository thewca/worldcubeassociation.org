import { Collapsible, Heading, Table, VStack } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import formats from "@/lib/wca/data/formats";
import { padSkipped } from "@/lib/live/padSkipped";
import { LiveCompetitor, PendingLiveResult } from "@/types/live";

export default function PendingResultsTable({
  pendingLiveResults,
  formatId,
  eventId,
  competitors,
}: {
  pendingLiveResults: PendingLiveResult[];
  formatId: string;
  eventId: string;
  competitors: Map<number, LiveCompetitor>;
}) {
  const format = formats.byId[formatId];
  const solveCount = format.expected_solve_count;

  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Collapsible.Root open={pendingLiveResults.length > 0}>
      <Collapsible.Content>
        <VStack align="start">
          <Heading textStyle="h3" textAlign="left">
            Processing
          </Heading>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Competitor</Table.ColumnHeader>
                <Table.ColumnHeader>Country</Table.ColumnHeader>
                {attemptIndexes.map((num) => (
                  <Table.ColumnHeader key={num} textAlign="right">
                    {num + 1}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {pendingLiveResults.map((pendingResult) => {
                const competitor = competitors.get(
                  pendingResult.registration_id,
                )!;

                return (
                  <Table.Row key={`${pendingResult.registration_id}`}>
                    <Table.Cell>{competitor.registrant_id}</Table.Cell>
                    <Table.Cell>{competitor.name}</Table.Cell>
                    {padSkipped(
                      pendingResult.attempts,
                      format.expected_solve_count,
                    ).map((attempt) => (
                      <Table.Cell
                        textAlign="right"
                        key={`${competitor.id}-${attempt.attempt_number}`}
                      >
                        {formatAttemptResult(attempt.value, eventId)}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </VStack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
