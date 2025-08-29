import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { Link, Table } from "@chakra-ui/react";
import { centisecondsToClockFormat } from "@/lib/wca/wcif/attempts";
import { route } from "nextjs-routes";

export const recordTagStyle = (tag?: string | null) => {
  const styles = {
    display: "block",
    lineHeight: 1,
    padding: "0.3em 0.4em",
    borderRadius: "4px",
    fontWeight: 600,
    fontSize: "0.6em",
    position: "absolute",
    top: "0px",
    right: "0px",
    transform: "translate(110%, -40%)",
    color: "rgb(255, 255, 255)",
    backgroundColor: "",
  };

  switch (tag) {
    case "WR": {
      styles.backgroundColor = "rgb(244, 67, 54)";
      break;
    }
    case "CR": {
      styles.backgroundColor = "rgb(255, 235, 59)";
      break;
    }
    case "NR": {
      styles.backgroundColor = "rgb(0, 230, 118)";
      break;
    }
    case "PR": {
      styles.backgroundColor = "rgb(66, 66, 66)";
      break;
    }
    default: {
      return {};
    }
  }
  return styles;
};

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
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader textAlign="right">#</Table.ColumnHeader>
          {isAdmin && <Table.ColumnHeader>Edit</Table.ColumnHeader>}
          <Table.ColumnHeader>Competitor</Table.ColumnHeader>
          {attemptIndexes.map((num) => (
            <Table.ColumnHeader key={num} textAlign="right">
              {num + 1}
            </Table.ColumnHeader>
          ))}
          <Table.ColumnHeader textAlign="right">Average</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="right">Best</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {results.map((competitorResult) => {
          return (
            <Table.Row key={competitorResult.id}>
              <Table.Cell textAlign="right">{competitorResult.pos}</Table.Cell>
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
              {competitorResult.attempts.map((attempt, index) => (
                <Table.Cell
                  textAlign="right"
                  key={`${competitorResult.id}-${eventId}-${index}`}
                >
                  {centisecondsToClockFormat(attempt)}
                </Table.Cell>
              ))}
              <>
                <Table.Cell textAlign="right" style={{ position: "relative" }}>
                  {centisecondsToClockFormat(competitorResult.average)}{" "}
                  {!isAdmin && (
                    <span
                      style={recordTagStyle(
                        competitorResult.regional_single_record,
                      )}
                    >
                      {competitorResult.regional_average_record}
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell textAlign="right" style={{ position: "relative" }}>
                  {centisecondsToClockFormat(competitorResult.best)}
                  {!isAdmin && (
                    <span
                      style={recordTagStyle(
                        competitorResult.regional_single_record,
                      )}
                    >
                      {competitorResult.regional_average_record}
                    </span>
                  )}
                </Table.Cell>
              </>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
