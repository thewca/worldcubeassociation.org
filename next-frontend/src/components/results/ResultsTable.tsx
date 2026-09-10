import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { CssProperties, HStack, Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { route } from "nextjs-routes";
import NextLink from "next/link";
import { AttemptsCells, WithRecordTag } from "@/components/results/TableCells";
import { resultAttempts } from "@/lib/wca/results/attempts";
import WcaFlag from "@/components/WcaFlag";
import { TFunction } from "i18next";
import CountryMap from "@/components/CountryMap";
import _ from "lodash";
import roundTypes from "@/lib/wca/data/roundTypes";
import formats from "@/lib/wca/data/formats";

export function ResultsTable({
  results,
  eventId,
  formatId,
  t,
  isAdmin = false,
  solveTextAlign = "left",
}: {
  results: components["schemas"]["Result"][];
  eventId: string;
  formatId: string;
  t: TFunction;
  isAdmin?: boolean;
  solveTextAlign?: CssProperties["textAlign"];
}) {
  const format = formats.byId[formatId];

  const solveCount = format.expected_solve_count;
  const anyAverages = results.some((r) => r.average !== 0);

  return (
    <Table.ScrollArea rounded="md">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>#</Table.ColumnHeader>
            {isAdmin && <Table.ColumnHeader>Edit</Table.ColumnHeader>}
            <Table.ColumnHeader>Competitor</Table.ColumnHeader>
            <Table.ColumnHeader>Best</Table.ColumnHeader>
            {anyAverages && <Table.ColumnHeader>Average</Table.ColumnHeader>}
            <Table.ColumnHeader>Representing</Table.ColumnHeader>
            <Table.ColumnHeader colSpan={solveCount} textAlign={solveTextAlign}>
              Solves
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {results.map((competitorResult) => {
            const { definedAttempts, bestResultIndex, worstResultIndex } =
              resultAttempts(competitorResult);

            const attemptCount =
              formats.byId[competitorResult.format_id].expected_solve_count;

            return (
              <Table.Row key={competitorResult.id}>
                {isAdmin && <Table.Cell>EDIT</Table.Cell>}
                <Table.Cell>{competitorResult.pos}</Table.Cell>
                <Table.Cell>
                  <Link
                    href={route({
                      pathname: "/persons/[wcaId]",
                      query: { wcaId: competitorResult.wca_id },
                    })}
                  >
                    {competitorResult.name}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <WithRecordTag
                    recordTag={competitorResult.regional_single_record}
                  >
                    {formatAttemptResult(competitorResult.best, eventId)}
                  </WithRecordTag>
                </Table.Cell>
                {anyAverages && (
                  <Table.Cell>
                    <WithRecordTag
                      recordTag={competitorResult.regional_average_record}
                    >
                      {formatAttemptResult(competitorResult.average, eventId)}
                    </WithRecordTag>
                  </Table.Cell>
                )}
                <Table.Cell>
                  <HStack>
                    <WcaFlag code={competitorResult.country_iso2} size="sm" />
                    <CountryMap code={competitorResult.country_iso2} t={t} />
                  </HStack>
                </Table.Cell>
                <AttemptsCells
                  attempts={definedAttempts}
                  bestResultIndex={bestResultIndex}
                  worstResultIndex={worstResultIndex}
                  eventId={eventId}
                  recordTag={competitorResult.regional_single_record}
                  attemptCount={attemptCount}
                />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export function ByPersonTable({
  results,
  t,
  isAdmin = false,
  solveTextAlign = "left",
  showNationalityColumn = false,
}: {
  results: components["schemas"]["Result"][];
  t: TFunction;
  isAdmin?: boolean;
  solveTextAlign?: CssProperties["textAlign"];
  showNationalityColumn?: boolean;
}) {
  // The backend always pads with zeros at the end, which we need to manually kick out again
  const validAttemptCounts = results.map(
    (res) => _.dropRightWhile(res.attempts, (att) => att === 0).length,
  );

  const maxAttemptCount = _.max(validAttemptCounts) || 0;

  const orderedResults = _.sortBy(results, [
    (res) => events.byId[res.event_id].rank,
    (res) => roundTypes.byId[res.round_type_id].rank,
  ]);

  return (
    <Table.ScrollArea rounded="md">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            {isAdmin && <Table.ColumnHeader>Edit</Table.ColumnHeader>}
            <Table.ColumnHeader>Event</Table.ColumnHeader>
            <Table.ColumnHeader>Round</Table.ColumnHeader>
            <Table.ColumnHeader>#</Table.ColumnHeader>
            <Table.ColumnHeader>Best</Table.ColumnHeader>
            <Table.ColumnHeader>Average</Table.ColumnHeader>
            {showNationalityColumn && (
              <Table.ColumnHeader>Representing</Table.ColumnHeader>
            )}
            <Table.ColumnHeader
              colSpan={maxAttemptCount}
              textAlign={solveTextAlign}
            >
              Solves
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {orderedResults.map((competitorResult) => {
            const eventId = competitorResult.event_id;
            const { definedAttempts, bestResultIndex, worstResultIndex } =
              resultAttempts(competitorResult);
            return (
              <Table.Row key={competitorResult.id}>
                {isAdmin && <Table.Cell>EDIT</Table.Cell>}
                <Table.Cell>{events.byId[eventId].name}</Table.Cell>
                <Table.Cell>
                  {t(`rounds.${competitorResult.round_type_id}.name`)}
                </Table.Cell>
                <Table.Cell>{competitorResult.pos}</Table.Cell>
                <Table.Cell>
                  <WithRecordTag
                    recordTag={competitorResult.regional_single_record}
                  >
                    {formatAttemptResult(competitorResult.best, eventId)}
                  </WithRecordTag>
                </Table.Cell>
                <Table.Cell>
                  <WithRecordTag
                    recordTag={competitorResult.regional_average_record}
                  >
                    {formatAttemptResult(competitorResult.average, eventId)}
                  </WithRecordTag>
                </Table.Cell>
                {showNationalityColumn && (
                  <Table.Cell>
                    <HStack>
                      <WcaFlag code={competitorResult.country_iso2} size="sm" />
                      <CountryMap code={competitorResult.country_iso2} t={t} />
                    </HStack>
                  </Table.Cell>
                )}
                <AttemptsCells
                  attempts={definedAttempts}
                  bestResultIndex={bestResultIndex}
                  worstResultIndex={worstResultIndex}
                  eventId={eventId}
                  recordTag={competitorResult.regional_single_record}
                  attemptCount={maxAttemptCount}
                />
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export function ByCompetitionTable({
  results,
  t,
}: {
  results: components["schemas"]["V1Result"][];
  t: TFunction;
}) {
  // Newest competition first. Ordering explicitly rather than reversing the payload keeps this
  // independent of whatever order the API happens to return rows in.
  const resultsByCompetition = _.groupBy(
    _.orderBy(results, ["competition_start_date", "id"], ["desc", "asc"]),
    "competition_id",
  );

  return (
    <Table.ScrollArea rounded="md">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              {t("persons.show.competition")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>Round</Table.ColumnHeader>
            <Table.ColumnHeader>{t("persons.show.place")}</Table.ColumnHeader>
            <Table.ColumnHeader>Single</Table.ColumnHeader>
            <Table.ColumnHeader>Average</Table.ColumnHeader>
            <Table.ColumnHeader colSpan={5} textAlign="left">
              Solves
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {_.flatMap(resultsByCompetition, (competitionResults) => {
            return competitionResults.map((competitorResult, index) => {
              const eventId = competitorResult.event_id;
              const resultFormat = formats.byId[competitorResult.format_id];

              const { definedAttempts, bestResultIndex, worstResultIndex } =
                resultAttempts(competitorResult);

              return (
                <Table.Row key={competitorResult.id}>
                  <Table.Cell>
                    {index === 0 && (
                      <Link asChild>
                        <NextLink
                          href={route({
                            pathname: "/competitions/[competitionId]",
                            query: {
                              competitionId: competitorResult.competition_id,
                            },
                          })}
                        >
                          {competitorResult.competition_short_name}
                        </NextLink>
                      </Link>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {t(`rounds.${competitorResult.round_type_id}.name`)}
                  </Table.Cell>
                  <Table.Cell>{competitorResult.pos}</Table.Cell>
                  <Table.Cell>
                    <WithRecordTag
                      recordTag={competitorResult.regional_single_record}
                    >
                      {formatAttemptResult(competitorResult.best, eventId)}
                    </WithRecordTag>
                  </Table.Cell>
                  <Table.Cell>
                    <WithRecordTag
                      recordTag={competitorResult.regional_average_record}
                    >
                      {formatAttemptResult(competitorResult.average, eventId)}
                    </WithRecordTag>
                  </Table.Cell>
                  <AttemptsCells
                    attempts={definedAttempts}
                    bestResultIndex={bestResultIndex}
                    worstResultIndex={worstResultIndex}
                    eventId={eventId}
                    recordTag={competitorResult.regional_single_record}
                    attemptCount={resultFormat.expected_solve_count}
                  />
                </Table.Row>
              );
            });
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
