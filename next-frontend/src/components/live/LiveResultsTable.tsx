import _ from "lodash";
import { Table } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import formats from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import {
  LiveCompetitorCell,
  LiveTableHeader,
  LivePositionCell,
  LiveAttemptsCells,
  LiveStatCells,
} from "@/components/live/Cells";
import { CountryCell } from "@/components/results/ResultTableCells";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";
import { mergeAndOrderResults } from "@/lib/live/mergeAndOrderResults";

export default function LiveResultsTable({
  resultsByRegistrationId,
  eventId,
  formatId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
}: {
  resultsByRegistrationId: LiveResultsByRegistrationId;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];

  const competitorsWithOrderedResults = mergeAndOrderResults(
    resultsByRegistrationId,
    competitorsByRegistrationId,
    format,
  );

  const stats = statColumnsForFormat(format);

  return (
    <Table.Root>
      <LiveTableHeader format={format} />

      <Table.Body>
        {competitorsWithOrderedResults.map((competitorAndTheirResults) => {
          return competitorAndTheirResults.results.map((result) => {
            const hasResult = result.attempts.length > 0;
            const ranking = hasResult
              ? competitorAndTheirResults.global_pos
              : "";

            if (!showEmpty && !hasResult) {
              return null;
            }

            return (
              <Table.Row
                key={`${competitorAndTheirResults.id}-${result.round_wcif_id}`}
              >
                <LivePositionCell position={ranking} advancingParams={result} />
                {isAdmin && (
                  <Table.Cell>
                    {competitorAndTheirResults.registrant_id}
                  </Table.Cell>
                )}
                <LiveCompetitorCell
                  competitionId={competitionId}
                  competitor={competitorAndTheirResults}
                  isAdmin={isAdmin}
                />
                <CountryCell
                  countryIso2={competitorAndTheirResults.country_iso2}
                />
                <LiveAttemptsCells
                  format={format}
                  attempts={result.attempts}
                  eventId={eventId}
                  competitorId={competitorAndTheirResults.id}
                />
                <LiveStatCells
                  stats={stats}
                  competitorId={competitorAndTheirResults.id}
                  eventId={eventId}
                  result={result}
                />
              </Table.Row>
            );
          });
        })}
      </Table.Body>
    </Table.Root>
  );
}
