import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { Link, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { route } from "nextjs-routes";
import { AttemptsCells, recordTagBadge } from "@/components/results/TableCells";
import { resultAttempts } from "@/lib/wca/results/attempts";

export default function ResultsTable({
  results,
  eventId,
  isAdmin = false,
}: {
  results: components["schemas"]["Result"][];
  eventId: string;
  competitionId: string;
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
              <Table.Cell>{competitorResult.country_iso2}</Table.Cell>
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
