import { Format } from "@/lib/wca/data/formats";
import { Link, Table } from "@chakra-ui/react";
import { Stat, statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { rankingCellColorPalette } from "@/lib/live/rankingCellColorPalette";
import { padSkipped } from "@/lib/live/padSkipped";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordTagBadge } from "@/components/results/TableCells";
import { LiveAttempt, LiveCompetitor, LiveResult } from "@/types/live";

export function LiveTableHeader({
  isLinked = false,
  format,
}: {
  isLinked?: boolean;
  format: Format;
}) {
  const solveCount = format.expected_solve_count;

  const stats = statColumnsForFormat(format);
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Table.Header>
      <Table.Row>
        <Table.ColumnHeader textAlign="right">#</Table.ColumnHeader>
        <Table.ColumnHeader>Competitor</Table.ColumnHeader>
        {isLinked && <Table.ColumnHeader>Round</Table.ColumnHeader>}
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
  );
}

export function LivePositionCell({
  position,
  rowSpan,
  advancingParams,
}: {
  position: number | string;
  rowSpan?: number;
  advancingParams: Pick<LiveResult, "advancing_questionable" | "advancing">;
}) {
  return (
    <Table.Cell
      width={1}
      layerStyle="fill.deep"
      textAlign="right"
      rowSpan={rowSpan}
      colorPalette={rankingCellColorPalette(advancingParams)}
    >
      {position}
    </Table.Cell>
  );
}

export function LiveCompetitorCell({
  isAdmin = false,
  rowSpan,
  competitionId,
  competitor,
}: {
  isAdmin?: boolean;
  rowSpan?: number;
  competitionId: string;
  competitor: Pick<LiveCompetitor, "id" | "name">;
}) {
  return (
    <Table.Cell rowSpan={rowSpan}>
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
  );
}

export function LiveAttemptsCells({
  format,
  attempts,
  eventId,
  competitorId,
}: {
  format: Format;
  attempts: LiveAttempt[];
  eventId: string;
  competitorId: number;
}) {
  return padSkipped(attempts, format.expected_solve_count).map((attempt) => (
    <Table.Cell
      textAlign="right"
      key={`${competitorId}-${attempt.attempt_number}`}
    >
      {formatAttemptResult(attempt.value, eventId)}
    </Table.Cell>
  ));
}

export function LiveStatCells({
  stats,
  competitorId,
  eventId,
  result,
  isAdmin = false,
  highlight,
}: {
  stats: Stat[];
  competitorId: number;
  eventId: string;
  result: LiveResult;
  isAdmin?: boolean;
  highlight?: boolean;
}) {
  const shouldHighlight = (statIndex: number) => {
    if (highlight !== undefined) {
      return highlight;
    }
    return statIndex === 0;
  };

  return stats.map((stat, statIndex) => (
    <Table.Cell
      key={`${competitorId}-${stat.name}`}
      textAlign="right"
      position="relative"
      fontWeight={shouldHighlight(statIndex) ? "bold" : "normal"}
    >
      {formatAttemptResult(result[stat.field], eventId)}{" "}
      {!isAdmin && recordTagBadge(result[stat.recordTagField])}
    </Table.Cell>
  ));
}
