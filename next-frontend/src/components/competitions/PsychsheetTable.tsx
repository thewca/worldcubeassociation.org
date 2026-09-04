import { HStack, Icon, Link, Table, Text } from "@chakra-ui/react";
import { route } from "nextjs-routes";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import { components } from "@/types/openapi";
import { TFunction } from "i18next";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import events from "@/lib/wca/data/events";

type PsychSheetSortBy = components["schemas"]["PsychSheet"]["sort_by"];

export default function PsychsheetTable({
  psychSheet,
  eventId,
  sortBy,
  t,
  setSortBy,
}: {
  psychSheet: components["schemas"]["PsychSheet"];
  eventId: string;
  sortBy: PsychSheetSortBy;
  t: TFunction;
  setSortBy: (sortBy: PsychSheetSortBy) => void;
}) {
  // Multi-blind has no average ranking, so single is the only way to sort it.
  const showAverage = !events.byId[eventId]?.is_multiple_blindfolded;
  const columnCount = showAverage ? 7 : 5;

  return (
    <Table.Root width="100%">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Pos</Table.ColumnHeader>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Representing</Table.ColumnHeader>
          <Table.ColumnHeader>WR</Table.ColumnHeader>
          <Table.ColumnHeader
            cursor={showAverage ? "pointer" : undefined}
            aria-sort={sortBy === "single" ? "ascending" : "none"}
            onClick={showAverage ? () => setSortBy("single") : undefined}
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
        {psychSheet.sorted_rankings.length === 0 && (
          <Table.Row>
            <Table.Cell colSpan={columnCount} textAlign="center">
              {t("competitions.registration_v2.list.empty")}
            </Table.Cell>
          </Table.Row>
        )}
        {psychSheet.sorted_rankings.map((registration) => (
          <Table.Row key={registration.user_id}>
            {/* Tied competitors repeat the position of the one above them,
                so we mute it to show it isn't a position of its own. */}
            <Table.Cell
              color={registration.tied_previous ? "fg.muted" : undefined}
            >
              {registration.pos}
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
                <Icon asChild size="sm">
                  <WcaFlag code={registration.country_iso2} />
                </Icon>
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
        ))}
      </Table.Body>
    </Table.Root>
  );
}
