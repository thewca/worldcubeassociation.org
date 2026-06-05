import { Format } from "@/lib/wca/data/formats";
import { Box, Link, Table } from "@chakra-ui/react";
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
  byPerson = false,
  isAdmin = false,
  t,
}: {
  isLinked?: boolean;
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
        <Table.ColumnHeader textAlign="right">#</Table.ColumnHeader>
        {isAdmin && (
          <Table.ColumnHeader textAlign="center">ID</Table.ColumnHeader>
        )}
        {!byPerson && (
          <Table.ColumnHeader>
            {t("competitions.live.results.competitor")}
          </Table.ColumnHeader>
        )}
        {!byPerson && (
          <Table.ColumnHeader hideBelow="md">
            {t("results.table_elements.region")}
          </Table.ColumnHeader>
        )}
        {isLinked && (
          <Table.ColumnHeader>
            <Box as="span" hideBelow="md">
              {t("competitions.results_table.round")}
            </Box>
          </Table.ColumnHeader>
        )}
        {attemptIndexes.map((num) => (
          <Table.ColumnHeader key={num} textAlign="right" hideBelow="md">
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
      layerStyle={showAdvancing ? "fill.deep" : undefined}
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
  link = true,
  rowSpan,
  competitionId,
  competitor,
}: {
  link?: boolean;
  rowSpan?: number;
  competitionId: string;
  competitor: Pick<LiveCompetitor, "id" | "name">;
}) {
  return (
    <Table.Cell rowSpan={rowSpan}>
      {link && (
        <Link
          href={`/competitions/${competitionId}/live/competitors/${competitor.id}`}
          hideBelow="md"
        >
          {competitor.name}
        </Link>
      )}
      <Box as="span" hideFrom={link ? "md" : undefined}>
        {competitor.name}
      </Box>
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
      hideBelow="md"
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
