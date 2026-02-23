import _ from "lodash";
import { Table } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import formats from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { orderResults } from "@/lib/live/orderResults";
import {
  LiveCompetitorCell,
  LiveTableHeader,
  LivePositionCell,
  LiveAttemptsCells,
  LiveStatCells,
} from "@/components/live/Cells";
import { CountryCell } from "@/components/results/ResultTableCells";

export default function LiveResultsTable({
  results,
  eventId,
  formatId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
}: {
  results: components["schemas"]["LiveResult"][];
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];

  const sortedResults = orderResults(results, format);

  const stats = statColumnsForFormat(format);

  return (
    <Table.Root>
      <LiveTableHeader format={format} />

      <Table.Body>
        {sortedResults.map((result) => {
          const competitor =
            competitorsByRegistrationId[result.registration_id];
          const hasResult = result.attempts.length > 0;

          if (!showEmpty && !hasResult) {
            return null;
          }

          return (
            <Table.Row key={competitor.id}>
              <LivePositionCell
                position={hasResult ? result.global_pos : ""}
                advancingParams={result}
              />
              {isAdmin && <Table.Cell>{competitor.registrant_id}</Table.Cell>}
              <LiveCompetitorCell
                competitionId={competitionId}
                competitor={competitor}
                isAdmin={isAdmin}
              />
              <CountryCell countryIso2={competitor.country_iso2} />
              <LiveAttemptsCells
                format={format}
                attempts={result.attempts}
                eventId={eventId}
                competitorId={competitor.id}
              />
              <LiveStatCells
                stats={stats}
                competitorId={competitor.id}
                eventId={eventId}
                result={result}
              />
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
