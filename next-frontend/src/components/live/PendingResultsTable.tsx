import _ from "lodash";
import { Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import formats from "@/lib/wca/data/formats";
import { padSkipped } from "@/lib/live/padSkipped";
import { useLiveResults } from "@/providers/LiveResultProvider";

export const rankingCellColorPalette = (
  result: components["schemas"]["LiveResult"],
) => {
  if (result?.advancing) {
    return "green";
  }

  if (result?.advancing_questionable) {
    return "yellow";
  }

  return "";
};

export default function PendingResultsTable({
  formatId,
  eventId,
  competitors,
}: {
  formatId: string;
  eventId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
}) {
  const { pendingLiveResults } = useLiveResults();

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
