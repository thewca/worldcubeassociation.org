import _ from "lodash";
import { Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import { recordTagBadge } from "@/components/results/TableCells";
import countries from "@/lib/wca/data/countries";
import formats from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { padSkipped } from "@/lib/live/padSkipped";
import {
  DualLiveResult,
  mergeAndOrderResults,
} from "@/lib/live/mergeAndOrderResults";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

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

export default function DualRoundsTable({
  resultsByRegistrationId,
  eventId,
  formatId,
  competitionId,
  competitors,
  showEmpty = true,
}: {
  resultsByRegistrationId: Record<string, DualLiveResult[]>;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  showEmpty?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];

  const sortedResultsByCompetitor = mergeAndOrderResults(
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
          <Table.ColumnHeader>Competitor</Table.ColumnHeader>
          <Table.ColumnHeader>Round</Table.ColumnHeader>
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
        {sortedResultsByCompetitor.map((competitorWithResults) => {
          const hasResult = competitorWithResults.results.some(
            (r) => r.attempts.length > 0,
          );

          if (!showEmpty && !hasResult) {
            return null;
          }

          return competitorWithResults.results.map((r, index) => (
            <Table.Row key={`${competitorWithResults.id}-${r.wcifId}`}>
              <Table.Cell
                width={1}
                layerStyle="fill.deep"
                textAlign="right"
                colorPalette={rankingCellColorPalette(r)}
              >
                {r.local_pos}
              </Table.Cell>
              <Table.Cell>
                <Link
                  href={`/competitions/${competitionId}/live/competitors/${competitorWithResults.id}`}
                >
                  {index === 0 && competitorWithResults.name}
                </Link>
              </Table.Cell>
              <Table.Cell>{parseActivityCode(r.wcifId).roundNumber}</Table.Cell>
              <Table.Cell>
                {index === 0 &&
                  countries.byIso2[competitorWithResults.country_iso2].name}
              </Table.Cell>
              {hasResult &&
                padSkipped(r.attempts, format.expected_solve_count).map(
                  (attempt) => (
                    <Table.Cell
                      textAlign="right"
                      key={`${competitorWithResults.id}-${attempt.attempt_number}`}
                    >
                      {formatAttemptResult(attempt.value, eventId)}
                    </Table.Cell>
                  ),
                )}
              {hasResult &&
                stats.map((stat) => (
                  <Table.Cell
                    key={`${r.registration_id}-${stat.name}`}
                    textAlign="right"
                    style={{ position: "relative" }}
                  >
                    {formatAttemptResult(r[stat.field], eventId)}{" "}
                    {recordTagBadge(r[stat.recordTagField])}
                  </Table.Cell>
                ))}
            </Table.Row>
          ));
        })}
      </Table.Body>
    </Table.Root>
  );
}
