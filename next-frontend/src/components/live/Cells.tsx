import { Format } from "@/lib/wca/data/formats";
import { Link, Table } from "@chakra-ui/react";
import { Stat, statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { rankingCellColorPalette } from "@/lib/live/rankingCellColorPalette";
import { padSkipped } from "@/lib/live/padSkipped";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordTagBadge } from "@/components/results/TableCells";
import { LiveAttempt, LiveCompetitor, LiveResult } from "@/types/live";
import { TFunction } from "i18next";

export function LiveTableHeader({
  isLinked = false,
  format,
  showFull = true,
  byPerson = false,
  isAdmin = false,
  t,
}: {
  isLinked?: boolean;
  showFull?: boolean;
  byPerson?: boolean;
  isAdmin?: boolean;
  format: Format;
  t: TFunction;
}) {
  const solveCount = format.expected_solve_count;

  const stats = statColumnsForFormat(format);
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Table.Header>
      <Table.Row>
        {byPerson && (
          <Table.ColumnHeader textAlign="left">
            {t("competitions.results_table.round")}
          </Table.ColumnHeader>
        )}
        {isAdmin && <Table.ColumnHeader />}
        <Table.ColumnHeader textAlign="right">#</Table.ColumnHeader>
        {!byPerson && (
          <Table.ColumnHeader>
            {t("competitions.live.results.competitor")}
          </Table.ColumnHeader>
        )}
        {showFull && !byPerson && (
          <Table.ColumnHeader>
            {t("results.table_elements.region")}
          </Table.ColumnHeader>
        )}
        {isLinked && (
          <Table.ColumnHeader>
            {showFull && t("competitions.results_table.round")}
          </Table.ColumnHeader>
        )}
        {showFull &&
          attemptIndexes.map((num) => (
            <Table.ColumnHeader key={num} textAlign="right">
              {num + 1}
            </Table.ColumnHeader>
          ))}
        {stats.map((stat) => (
          <Table.ColumnHeader textAlign="right" key={stat.field}>
            {t(stat.i18nKey)}
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
  showAdvancing = true,
}: {
  position: number | string;
  rowSpan?: number;
  advancingParams: Pick<LiveResult, "advancing_questionable" | "advancing">;
  showAdvancing?: boolean;
}) {
  return (
    <Table.Cell
      width={1}
      layerStyle="fill.deep"
      textAlign="right"
      rowSpan={rowSpan}
      colorPalette={
        showAdvancing ? rankingCellColorPalette(advancingParams) : undefined
      }
    >
      {position}
    </Table.Cell>
  );
}

export function LiveCompetitorCell({
  isAdmin = false,
  link = true,
  rowSpan,
  competitionId,
  competitor,
}: {
  isAdmin?: boolean;
  link?: boolean;
  rowSpan?: number;
  competitionId: string;
  competitor: Pick<LiveCompetitor, "id" | "name">;
}) {
  return (
    <Table.Cell rowSpan={rowSpan}>
      {link ? (
        <Link
          href={
            isAdmin
              ? `/registrations/${competitor.id}/edit`
              : `/competitions/${competitionId}/live/competitors/${competitor.id}`
          }
        >
          {competitor.name}
        </Link>
      ) : (
        competitor.name
      )}
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
      key={`attempts-${competitorId}-${attempt.attempt_number}`}
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
      key={`${competitorId}-${stat.i18nKey}`}
      textAlign="right"
      position="relative"
      fontWeight={shouldHighlight(statIndex) ? "bold" : "normal"}
    >
      {formatAttemptResult(result[stat.field], eventId)}{" "}
      {!isAdmin && recordTagBadge(result[stat.recordTagField])}
    </Table.Cell>
  ));
}
