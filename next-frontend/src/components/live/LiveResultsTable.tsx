import _ from "lodash";
import events from "@/lib/wca/data/events";
import { Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import { recordTagBadge } from "@/components/results/TableCells";

const customOrderBy = (
  competitor: components["schemas"]["LiveCompetitor"],
  resultsByRegistrationId: Record<string, components["schemas"]["LiveResult"]>,
) => {
  const competitorResult = resultsByRegistrationId[competitor.id];

  if (!competitorResult) {
    return competitor.id;
  }

  return competitorResult.global_pos;
};

export const rankingCellColour = (
  result: components["schemas"]["LiveResult"],
) => {
  if (result?.advancing) {
    return "advancing";
  }

  if (result?.advancing_questionable) {
    return "advancingQuestionable";
  }

  return "";
};

export default function LiveResultsTable({
  results,
  eventId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
}: {
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const resultsByRegistrationId = _.keyBy(results, "registration_id");
  const event = events.byId[eventId];

  const sortedCompetitors = _.orderBy(
    competitors,
    [
      (competitor) => customOrderBy(competitor, resultsByRegistrationId),
      (competitor) => customOrderBy(competitor, resultsByRegistrationId),
    ],
    ["asc", "asc"],
  );

  const solveCount = event.recommendedFormat.expected_solve_count;
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader textAlign="right">#</Table.ColumnHeader>
          {isAdmin && <Table.ColumnHeader>Id</Table.ColumnHeader>}
          <Table.ColumnHeader>Competitor</Table.ColumnHeader>
          {attemptIndexes.map((num) => (
            <Table.ColumnHeader key={num} textAlign="right">
              {num + 1}
            </Table.ColumnHeader>
          ))}
          <Table.ColumnHeader textAlign="right">Average</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="right">Best</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedCompetitors.map((competitor, index) => {
          const competitorResult = resultsByRegistrationId[competitor.id];
          const hasResult = Boolean(competitorResult);

          if (!showEmpty && !hasResult) {
            return null;
          }

          return (
            <Table.Row key={competitor.id}>
              <Table.Cell
                width={1}
                layerStyle="fill.deep"
                textAlign="right"
                backgroundColor={rankingCellColour(competitorResult)}
              >
                {index + 1}
              </Table.Cell>
              {isAdmin && <Table.Cell>{competitor.registrant_id}</Table.Cell>}
              <Table.Cell>
                <Link
                  href={
                    isAdmin
                      ? `/registrations/${competitor.id}/edit`
                      : `/competitions/${competitionId}/live/competitors/${competitor.id}`
                  }
                >
                  {competitor.user.name}
                </Link>
              </Table.Cell>
              {hasResult &&
                competitorResult.attempts.map((attempt) => (
                  <Table.Cell
                    textAlign="right"
                    key={`${competitor.id}-${attempt.attempt_number}`}
                  >
                    {formatAttemptResult(attempt.result, eventId)}
                  </Table.Cell>
                ))}
              {hasResult && (
                <>
                  <Table.Cell
                    textAlign="right"
                    style={{ position: "relative" }}
                  >
                    {formatAttemptResult(competitorResult.average, eventId)}{" "}
                    {!isAdmin &&
                      recordTagBadge(competitorResult.average_record_tag)}
                  </Table.Cell>
                  <Table.Cell
                    textAlign="right"
                    style={{ position: "relative" }}
                  >
                    {formatAttemptResult(competitorResult.best, eventId)}
                    {!isAdmin &&
                      recordTagBadge(competitorResult.single_record_tag)}
                  </Table.Cell>
                </>
              )}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
