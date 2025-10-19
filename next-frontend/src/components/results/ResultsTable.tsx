import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { HStack, Icon, Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { route } from "nextjs-routes";
import { AttemptsCells, recordTagBadge } from "@/components/results/TableCells";
import { resultAttempts } from "@/lib/wca/results/attempts";
import WcaFlag from "@/components/WcaFlag";
import { TFunction } from "i18next";
import CountryMap from "@/components/CountryMap";

export function ResultsTable({
  results,
  eventId,
  t,
  isAdmin = false,
}: {
  results: components["schemas"]["Result"][];
  eventId: string;
  t: TFunction;
  isAdmin?: boolean;
}) {
  const event = events.byId[eventId];

  const solveCount = event.recommendedFormat.expected_solve_count;

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>#</Table.ColumnHeader>
          {isAdmin && <Table.ColumnHeader>Edit</Table.ColumnHeader>}
          <Table.ColumnHeader>Competitor</Table.ColumnHeader>
          <Table.ColumnHeader>Best</Table.ColumnHeader>
          <Table.ColumnHeader>Average</Table.ColumnHeader>
          <Table.ColumnHeader>Representing</Table.ColumnHeader>
          <Table.ColumnHeader colSpan={solveCount} textAlign="left">
            Solves
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {results.map((competitorResult) => {
          const { definedAttempts, bestResultIndex, worstResultIndex } =
            resultAttempts(competitorResult);
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
              <Table.Cell style={{ position: "relative" }}>
                {formatAttemptResult(competitorResult.best, eventId)}{" "}
                {recordTagBadge(competitorResult.regional_single_record)}
              </Table.Cell>
              <Table.Cell style={{ position: "relative" }}>
                {formatAttemptResult(competitorResult.average, eventId)}{" "}
                {recordTagBadge(competitorResult.regional_average_record)}
              </Table.Cell>
              <Table.Cell>
                <HStack>
                  <Icon asChild size="sm">
                    <WcaFlag code={competitorResult.country_iso2} />
                  </Icon>
                  <CountryMap code={competitorResult.country_iso2} t={t} />
                </HStack>
              </Table.Cell>
              <AttemptsCells
                attempts={definedAttempts}
                bestResultIndex={bestResultIndex}
                worstResultIndex={worstResultIndex}
                eventId={eventId}
                recordTag={competitorResult.regional_single_record}
              />
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}

export function ByPersonTable({
  results,
  t,
  isAdmin = false,
}: {
  results: components["schemas"]["Result"][];
  t: TFunction;
  isAdmin?: boolean;
}) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          {isAdmin && <Table.ColumnHeader>Edit</Table.ColumnHeader>}
          <Table.ColumnHeader>Event</Table.ColumnHeader>
          <Table.ColumnHeader>Round</Table.ColumnHeader>
          <Table.ColumnHeader>#</Table.ColumnHeader>
          <Table.ColumnHeader>Best</Table.ColumnHeader>
          <Table.ColumnHeader>Average</Table.ColumnHeader>
          <Table.ColumnHeader>Representing</Table.ColumnHeader>
          <Table.ColumnHeader colSpan={5} textAlign="left">
            Solves
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {results.map((competitorResult) => {
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
              <Table.Cell style={{ position: "relative" }}>
                {formatAttemptResult(competitorResult.best, eventId)}{" "}
                {recordTagBadge(competitorResult.regional_single_record)}
              </Table.Cell>
              <Table.Cell style={{ position: "relative" }}>
                {formatAttemptResult(competitorResult.average, eventId)}{" "}
                {recordTagBadge(competitorResult.regional_average_record)}
              </Table.Cell>
              <Table.Cell>
                <HStack>
                  <Icon asChild size="sm">
                    <WcaFlag code={competitorResult.country_iso2} />
                  </Icon>
                  <CountryMap code={competitorResult.country_iso2} t={t} />
                </HStack>
              </Table.Cell>
              <AttemptsCells
                attempts={definedAttempts}
                bestResultIndex={bestResultIndex}
                worstResultIndex={worstResultIndex}
                eventId={eventId}
                recordTag={competitorResult.regional_single_record}
              />
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
