import _ from "lodash";
import { Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import { recordTagBadge } from "@/components/results/TableCells";
import countries from "@/lib/wca/data/countries";
import formats from "@/lib/wca/data/formats";
import { orderResults } from "@/lib/live/orderResults";

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

export default function LiveResultsTable({
  results,
  eventId,
  formatId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
}: {
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];

  const sortedResults = orderResults(results, format);

  const solveCount = format.expected_solve_count;
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader textAlign="right">#</Table.ColumnHeader>
          {isAdmin && <Table.ColumnHeader>Id</Table.ColumnHeader>}
          <Table.ColumnHeader>Competitor</Table.ColumnHeader>
          <Table.ColumnHeader>Country</Table.ColumnHeader>
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
        {sortedResults.map((result) => {
          const competitor =
            competitorsByRegistrationId[result.registration_id];
          const hasResult = Boolean(result.attempts.length > 0);

          if (!showEmpty && !hasResult) {
            return null;
          }

          return (
            <Table.Row key={competitor.id}>
              <Table.Cell
                width={1}
                layerStyle="fill.deep"
                textAlign="right"
                colorPalette={rankingCellColorPalette(result)}
              >
                {result.global_pos}
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
                  {competitor.name}
                </Link>
              </Table.Cell>
              <Table.Cell>
                {countries.byIso2[competitor.country_iso2].name}
              </Table.Cell>
              {hasResult &&
                result.attempts.map((attempt) => (
                  <Table.Cell
                    textAlign="right"
                    key={`${competitor.id}-${attempt.attempt_number}`}
                  >
                    {formatAttemptResult(attempt.value, eventId)}
                  </Table.Cell>
                ))}
              {hasResult && (
                <>
                  <Table.Cell
                    textAlign="right"
                    style={{ position: "relative" }}
                  >
                    {formatAttemptResult(result.average, eventId)}{" "}
                    {!isAdmin && recordTagBadge(result.average_record_tag)}
                  </Table.Cell>
                  <Table.Cell
                    textAlign="right"
                    style={{ position: "relative" }}
                  >
                    {formatAttemptResult(result.best, eventId)}
                    {!isAdmin && recordTagBadge(result.single_record_tag)}
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
