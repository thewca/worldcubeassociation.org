import _ from "lodash";
import { Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import { recordTagBadge } from "@/components/results/TableCells";
import countries from "@/lib/wca/data/countries";
import formats from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";

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
  const resultsByRegistrationId = _.keyBy(results, "registration_id");

  const sortedCompetitors = _.orderBy(
    competitors,
    [
      (competitor) => customOrderBy(competitor, resultsByRegistrationId),
      (competitor) => customOrderBy(competitor, resultsByRegistrationId),
    ],
    ["asc", "asc"],
  );

  const format = formats.byId[formatId];
  const solveCount = format.expected_solve_count;

  const stats = statColumnsForFormat(format);
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
          {stats.map((stat) => (
            <Table.ColumnHeader textAlign="right" key={stat.field}>
              {stat.name}
            </Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedCompetitors.map((competitor, index) => {
          const competitorResult = resultsByRegistrationId[competitor.id];
          const hasResult = competitorResult.attempts.length > 0;

          if (!showEmpty && !hasResult) {
            return null;
          }

          return (
            <Table.Row key={competitor.id}>
              <Table.Cell
                width={1}
                layerStyle="fill.deep"
                textAlign="right"
                colorPalette={rankingCellColorPalette(competitorResult)}
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
                  {competitor.name}
                </Link>
              </Table.Cell>
              <Table.Cell>
                {countries.byIso2[competitor.country_iso2].name}
              </Table.Cell>
              {hasResult &&
                competitorResult.attempts.map((attempt) => (
                  <Table.Cell
                    textAlign="right"
                    key={`${competitor.id}-${attempt.attempt_number}`}
                  >
                    {formatAttemptResult(attempt.value, eventId)}
                  </Table.Cell>
                ))}
              {hasResult &&
                stats.map((stat) => (
                  <Table.Cell
                    key={`${competitorResult.registration_id}-${stat.name}`}
                    textAlign="right"
                    style={{ position: "relative" }}
                  >
                    {formatAttemptResult(competitorResult[stat.field], eventId)}{" "}
                    {!isAdmin &&
                      recordTagBadge(competitorResult[stat.recordTagField])}
                  </Table.Cell>
                ))}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
