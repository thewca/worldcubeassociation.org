import { Format } from "@/lib/wca/data/formats";
import { Box, Link, Table } from "@chakra-ui/react";
import { Stat, statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { rankingCellColorPalette } from "@/lib/live/rankingCellColorPalette";
import { padSkipped } from "@/lib/live/padSkipped";
import { formatAttemptResult, SKIPPED_VALUE } from "@/lib/wca/wcif/attempts";
import { WithRecordTag } from "@/components/results/TableCells";
import { Tooltip } from "@/components/ui/tooltip";
import { LiveAttempt, LiveCompetitor, LiveResult } from "@/types/live";
import { TFunction } from "i18next";

export function LiveTableHeader({
  isLinked = false,
  format,
  byPerson = false,
  isAdmin = false,
  isProjector = false,
  forecastView = false,
  t,
}: {
  isLinked?: boolean;
  byPerson?: boolean;
  isAdmin?: boolean;
  isProjector?: boolean;
  forecastView?: boolean;
  format: Format;
  t: TFunction;
}) {
  const solveCount = format.expected_solve_count;

  const stats = statColumnsForFormat(format);
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <>
      {isProjector && (
        <Table.ColumnGroup>
          <Table.Column htmlWidth="75px" />
          <Table.Column htmlWidth="22%" />
          <Table.Column htmlWidth="50px" />
        </Table.ColumnGroup>
      )}
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
            <Table.ColumnHeader overflow="hidden" textOverflow="ellipsis">
              {t("competitions.live.results.competitor")}
            </Table.ColumnHeader>
          )}
          {!byPerson && (
            <Table.ColumnHeader hideBelow="md">
              {!isProjector && t("results.table_elements.region")}
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
          {forecastView &&
            format.expected_solve_count === 5 &&
            ["BPA", "WPA"].map((label) => (
              <Table.ColumnHeader key={label} textAlign="right" hideBelow="sm">
                {label}
              </Table.ColumnHeader>
            ))}
        </Table.Row>
      </Table.Header>
    </>
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
  forecastView = false,
  format,
}: {
  stats: Stat[];
  competitorId: number;
  eventId: string;
  result: LiveResult;
  isAdmin?: boolean;
  highlight?: boolean;
  forecastView?: boolean;
  format?: Format;
}) {
  const shouldHighlight = (statIndex: number) => {
    if (highlight !== undefined) {
      return highlight;
    }
    return statIndex === 0;
  };

  // Only present (and non-null) on incomplete round results.
  const forecast =
    "forecast_statistics" in result ? result.forecast_statistics : undefined;

  return (
    <>
      {stats.map((stat, statIndex) => {
        const showProjected =
          forecastView &&
          stat.field === "average" &&
          result.average === SKIPPED_VALUE &&
          forecast?.projected_average != null;

        return (
          <Table.Cell
            key={`${competitorId}-${stat.i18nKey}`}
            textAlign="right"
            fontWeight={shouldHighlight(statIndex) ? "bold" : "normal"}
          >
            {showProjected ? (
              <Tooltip content="Projected average" showArrow openDelay={200}>
                <Box as="span" color="fg.muted">
                  {formatAttemptResult(forecast!.projected_average!, eventId)}
                </Box>
              </Tooltip>
            ) : (
              <WithRecordTag
                recordTag={isAdmin ? null : result[stat.recordTagField]}
              >
                {formatAttemptResult(result[stat.field], eventId)}
              </WithRecordTag>
            )}
          </Table.Cell>
        );
      })}
      {forecastView &&
        format?.expected_solve_count === 5 &&
        (
          [
            ["BPA", forecast?.best_possible_average],
            ["WPA", forecast?.worst_possible_average],
          ] as const
        ).map(([label, value]) => (
          <Table.Cell
            key={`${competitorId}-${label}`}
            textAlign="right"
            color="fg.muted"
            hideBelow="sm"
          >
            {/* Like wca-live, only meaningful once a single solve is left */}
            {result.attempts.length === format.expected_solve_count - 1 &&
            value != null
              ? formatAttemptResult(value, eventId)
              : ""}
          </Table.Cell>
        ))}
    </>
  );
}
