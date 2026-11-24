import { Button, HStack, Link, Span, Table, Text } from "@chakra-ui/react";
import { route } from "nextjs-routes";
import { LuArrowDown } from "react-icons/lu";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import { components } from "@/types/openapi";
import { TFunction } from "i18next";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import events from "@/lib/wca/data/events";
import type { PsychSheetRankingPeriod } from "./PsychSheet";

type PsychSheetSortBy = components["schemas"]["PsychSheet"]["sort_by"];

// Positions, name, country, single world rank, and single result.
const BASE_COLUMN_COUNT = 6;
const AVERAGE_COLUMN_COUNT = 2;

export default function PsychsheetTable({
  allTimePsychSheet,
  recentPsychSheet,
  eventId,
  sortBy,
  t,
  setSortBy,
  rankingPeriod,
  setRankingPeriod,
}: {
  allTimePsychSheet: components["schemas"]["PsychSheet"];
  recentPsychSheet?: components["schemas"]["PsychSheet"];
  eventId: string;
  sortBy: PsychSheetSortBy;
  t: TFunction;
  setSortBy: (sortBy: PsychSheetSortBy) => void;
  rankingPeriod: PsychSheetRankingPeriod;
  setRankingPeriod: (period: PsychSheetRankingPeriod) => void;
}) {
  // Multi-blind has no average ranking, so single is the only way to sort it.
  const showAverage = !events.byId[eventId]?.is_multiple_blindfolded;
  const sortsByAllTime = rankingPeriod === "all_time" || !recentPsychSheet;
  const columnCount =
    BASE_COLUMN_COUNT + (showAverage ? AVERAGE_COLUMN_COUNT : 0);
  // A registration can change between requests, so a missing counterpart has no position.
  const recentRankingsByUserId = new Map(
    recentPsychSheet?.sorted_rankings.map((row) => [row.user_id, row]),
  );
  const recentOrderByUserId = new Map(
    recentPsychSheet?.sorted_rankings.map((row, index) => [row.user_id, index]),
  );
  const registrations = sortsByAllTime
    ? allTimePsychSheet.sorted_rankings
    : allTimePsychSheet.sorted_rankings.toSorted(
        (a, b) =>
          (recentOrderByUserId.get(a.user_id) ?? Infinity) -
          (recentOrderByUserId.get(b.user_id) ?? Infinity),
      );
  const rows = registrations.map((registration) => {
    const recentRanking = recentRankingsByUserId.get(registration.user_id);
    const recentPosition = recentPsychSheet ? (recentRanking?.pos ?? "—") : "";
    const allTimePositionColor =
      sortsByAllTime && registration.tied_previous ? "fg.muted" : undefined;
    const recentPositionColor =
      !sortsByAllTime && recentRanking?.tied_previous ? "fg.muted" : undefined;
    return {
      registration,
      recentPosition,
      allTimePositionColor,
      recentPositionColor,
    };
  });

  return (
    <Table.ScrollArea>
      <Table.Root width="100%">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader
              aria-sort={sortsByAllTime ? "ascending" : "none"}
            >
              <Button
                variant="plain"
                size="sm"
                onClick={() => setRankingPeriod("all_time")}
              >
                {t("competitions.registration_v2.list.psychsheets.position")}
                {/* Reserve the arrow's space so sorting never shifts the columns. */}
                <Span
                  aria-hidden="true"
                  visibility={sortsByAllTime ? "visible" : "hidden"}
                >
                  <LuArrowDown />
                </Span>
              </Button>
            </Table.ColumnHeader>
            <Table.ColumnHeader
              aria-sort={sortsByAllTime ? "none" : "ascending"}
            >
              <Button
                variant="plain"
                size="sm"
                onClick={() => setRankingPeriod("last_12_months")}
                disabled={!recentPsychSheet}
              >
                {t(
                  "competitions.registration_v2.list.psychsheets.position_last_12_months",
                )}
                <Span
                  aria-hidden="true"
                  visibility={sortsByAllTime ? "hidden" : "visible"}
                >
                  <LuArrowDown />
                </Span>
              </Button>
            </Table.ColumnHeader>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Representing</Table.ColumnHeader>
            <Table.ColumnHeader>WR</Table.ColumnHeader>
            <Table.ColumnHeader
              cursor="pointer"
              aria-sort={sortBy === "single" ? "ascending" : "none"}
              onClick={() => setSortBy("single")}
            >
              Single
            </Table.ColumnHeader>
            {showAverage && (
              <>
                <Table.ColumnHeader
                  cursor="pointer"
                  aria-sort={sortBy === "average" ? "ascending" : "none"}
                  onClick={() => setSortBy("average")}
                >
                  Average
                </Table.ColumnHeader>
                <Table.ColumnHeader>WR</Table.ColumnHeader>
              </>
            )}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {registrations.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={columnCount} textAlign="center">
                {t("competitions.registration_v2.list.empty")}
              </Table.Cell>
            </Table.Row>
          )}
          {rows.map(
            ({
              registration,
              recentPosition,
              allTimePositionColor,
              recentPositionColor,
            }) => (
              <Table.Row key={registration.user_id}>
                <Table.Cell color={allTimePositionColor}>
                  {registration.pos}
                </Table.Cell>
                <Table.Cell color={recentPositionColor}>
                  {recentPosition}
                </Table.Cell>
                <Table.Cell>
                  {registration.wca_id ? (
                    <Link
                      href={route({
                        pathname: "/persons/[wcaId]",
                        query: { wcaId: registration.wca_id },
                      })}
                    >
                      <Text fontWeight="medium">{registration.name}</Text>
                    </Link>
                  ) : (
                    <Text fontWeight="medium">{registration.name}</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <HStack>
                    <WcaFlag code={registration.country_iso2} size="sm" />
                    <CountryMap
                      code={registration.country_iso2}
                      t={t}
                      fontWeight="bold"
                    />
                  </HStack>
                </Table.Cell>
                <Table.Cell>{registration.single_rank}</Table.Cell>
                <Table.Cell>
                  {formatAttemptResult(registration.single_best, eventId)}
                </Table.Cell>
                {showAverage && (
                  <>
                    <Table.Cell>
                      {formatAttemptResult(registration.average_best, eventId)}
                    </Table.Cell>
                    <Table.Cell>{registration.average_rank}</Table.Cell>
                  </>
                )}
              </Table.Row>
            ),
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
