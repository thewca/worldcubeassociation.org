import _ from "lodash";
import { Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import { recordTagBadge } from "@/components/results/TableCells";
import countries from "@/lib/wca/data/countries";
import formats from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { orderResults } from "@/lib/live/orderResults";
import { padSkipped } from "@/lib/live/padSkipped";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";
import { mergeAndOrderResults } from "@/lib/live/mergeAndOrderResults";

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
  resultsByRegistrationId,
  eventId,
  formatId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
}: {
  resultsByRegistrationId: LiveResultsByRegistrationId;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];

  const competitorsWithOrderedResults = mergeAndOrderResults(
    resultsByRegistrationId,
    competitorsByRegistrationId,
    format,
  );
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
        {competitorsWithOrderedResults.map((competitorAndTheirResults) => {
          return competitorAndTheirResults.results.map((result) => {
            const hasResult = result.attempts.length > 0;
            const isPending = hasResult && result.best == 0;
            const ranking = hasResult ? result.global_pos : "";

            if (!showEmpty && !hasResult) {
              return null;
            }

            return (
              <Table.Row
                key={`${competitorAndTheirResults.id}-${result.round_wcif_id}`}
              >
                <Table.Cell
                  width={1}
                  layerStyle="fill.deep"
                  textAlign="right"
                  colorPalette={rankingCellColorPalette(result)}
                >
                  {isPending ? "pending" : ranking}
                </Table.Cell>
                {isAdmin && (
                  <Table.Cell>
                    {competitorAndTheirResults.registrant_id}
                  </Table.Cell>
                )}
                <Table.Cell>
                  <Link
                    href={
                      isAdmin
                        ? `/registrations/${competitorAndTheirResults.id}/edit`
                        : `/competitions/${competitionId}/live/competitors/${competitorAndTheirResults.id}`
                    }
                  >
                    {competitorAndTheirResults.name}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  {
                    countries.byIso2[competitorAndTheirResults.country_iso2]
                      .name
                  }
                </Table.Cell>
                {hasResult &&
                  padSkipped(result.attempts, format.expected_solve_count).map(
                    (attempt) => (
                      <Table.Cell
                        textAlign="right"
                        key={`${competitorAndTheirResults.id}-${attempt.attempt_number}`}
                      >
                        {formatAttemptResult(attempt.value, eventId)}
                      </Table.Cell>
                    ),
                  )}
                {hasResult &&
                  stats.map((stat) => (
                    <Table.Cell
                      key={`${result.registration_id}-${stat.name}`}
                      textAlign="right"
                      style={{ position: "relative" }}
                    >
                      {isPending
                        ? "pending"
                        : formatAttemptResult(result[stat.field], eventId)}{" "}
                      {!isAdmin && recordTagBadge(result[stat.recordTagField])}
                    </Table.Cell>
                  ))}
              </Table.Row>
            );
          });
        })}
      </Table.Body>
    </Table.Root>
  );
}
