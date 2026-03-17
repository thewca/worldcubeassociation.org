import _ from "lodash";
import { Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import formats from "@/lib/wca/data/formats";
import { padSkipped } from "@/lib/live/padSkipped";
import { LiveCompetitor, LiveResult } from "@/types/live";

export default function PendingResultsTable({
  pendingLiveResults,
  formatId,
  eventId,
  competitors,
}: {
  pendingLiveResults: LiveResult[];
  formatId: string;
  eventId: string;
  competitors: LiveCompetitor[];
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];
  const solveCount = format.expected_solve_count;

  const attemptIndexes = [...Array(solveCount).keys()];

  if (pendingLiveResults.length > 0) {
    return (
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
            const competitor =
              competitorsByRegistrationId[pendingResult.registration_id];

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
    );
  }
}
