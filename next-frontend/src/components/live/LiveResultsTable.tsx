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
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

export default function LiveResultsTable({
  resultsByRegistrationId,
  formatId,
  roundWcifId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
  showDualRoundsView = false,
}: {
  resultsByRegistrationId: LiveResultsByRegistrationId;
  formatId: string;
  roundWcifId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  isAdmin?: boolean;
  showEmpty?: boolean;
  showDualRoundsView?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const { eventId } = parseActivityCode(roundWcifId);

  const format = formats.byId[formatId];

  const competitorsWithOrderedResults = mergeAndOrderResults(
    resultsByRegistrationId,
    competitorsByRegistrationId,
    format,
  );

  const stats = statColumnsForFormat(format);

  return (
    <Table.Root>
      <LiveTableHeader format={format} isDual={showDualRoundsView} />
      <Table.Body>
        {competitorsWithOrderedResults.map((competitorAndTheirResults) => {
          return competitorAndTheirResults.results.map((result, index) => {
            const hasResult = result.attempts.length > 0;
            const showText = !showDualRoundsView || index === 0;
            const rowSpan = showDualRoundsView
              ? competitorAndTheirResults.results.length
              : 1;
            const ranking = hasResult
              ? competitorAndTheirResults.global_pos
              : "";

            if (!showDualRoundsView && result.round_wcif_id != roundWcifId)
              return undefined;

            if (!showEmpty && !hasResult) {
              return null;
            }

            return (
              <Table.Row
                key={`${competitorAndTheirResults.id}-${result.round_wcif_id}`}
              >
                {showText && (
                  <LivePositionCell
                    position={hasResult ? ranking : ""}
                    advancingParams={
                      showDualRoundsView ? competitorAndTheirResults : result
                    }
                    rowSpan={rowSpan}
                  />
                )}
                {isAdmin && (
                  <Table.Cell>
                    {competitorAndTheirResults.registrant_id}
                  </Table.Cell>
                )}
                {showText && (
                  <LiveCompetitorCell
                    competitionId={competitionId}
                    competitor={competitorAndTheirResults}
                    rowSpan={rowSpan}
                    isAdmin={isAdmin}
                  />
                )}
                {showDualRoundsView && (
                  <Table.Cell>
                    {parseActivityCode(result.round_wcif_id).roundNumber}
                  </Table.Cell>
                )}
                {showText && (
                  <CountryCell
                    countryIso2={competitorAndTheirResults.country_iso2}
                    rowSpan={rowSpan}
                  />
                )}
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
                  highlight={showText}
                />
              </Table.Row>
            );
          });
        })}
      </Table.Body>
    </Table.Root>
  );
}
