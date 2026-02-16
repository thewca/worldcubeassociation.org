import _ from "lodash";
import { Table } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import formats from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import {
  DualLiveResult,
  mergeAndOrderResults,
} from "@/lib/live/mergeAndOrderResults";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import {
  LiveTableHeader,
  LivePositionCell,
  LiveAttemptsCells,
  LiveStatCells,
  LiveCompetitorCell,
} from "@/components/live/Cells";
import { CountryCell } from "@/components/results/ResultTableCells";

export default function DualRoundsTable({
  resultsByRegistrationId,
  eventId,
  formatId,
  wcifId,
  competitionId,
  competitors,
  showDualRoundsView = true,
}: {
  wcifId: string;
  resultsByRegistrationId: Record<string, DualLiveResult[]>;
  eventId: string;
  formatId: string;
  competitionId: string;
  competitors: components["schemas"]["LiveCompetitor"][];
  showDualRoundsView?: boolean;
}) {
  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const format = formats.byId[formatId];

  const sortedResultsByCompetitor = mergeAndOrderResults(
    resultsByRegistrationId,
    competitorsByRegistrationId,
    format,
  );
  const stats = statColumnsForFormat(format);

  return (
    <Table.Root>
      <LiveTableHeader format={format} isDual={showDualRoundsView} />
      <Table.Body>
        {sortedResultsByCompetitor.map((competitorWithResults) => {
          return competitorWithResults.results.map((r, index) => {
            if (!showDualRoundsView && r.wcifId != wcifId) return undefined;

            const showText = !showDualRoundsView || index === 0;
            const rowSpan = showDualRoundsView
              ? competitorWithResults.results.length
              : 1;

            return (
              <Table.Row key={`${competitorWithResults.id}-${r.wcifId}`}>
                {showText && (
                  <LivePositionCell
                    position={
                      showDualRoundsView
                        ? competitorWithResults.global_pos
                        : r.local_pos
                    }
                    advancingParams={
                      showDualRoundsView ? competitorWithResults : r
                    }
                    rowSpan={rowSpan}
                  />
                )}
                {showText && (
                  <LiveCompetitorCell
                    competitionId={competitionId}
                    competitor={competitorWithResults}
                    rowSpan={rowSpan}
                  />
                )}
                {showDualRoundsView && (
                  <Table.Cell>
                    {parseActivityCode(r.wcifId).roundNumber}
                  </Table.Cell>
                )}
                {showText && (
                  <CountryCell
                    countryIso2={competitorWithResults.country_iso2}
                    rowSpan={rowSpan}
                  />
                )}
                <LiveAttemptsCells
                  format={format}
                  attempts={r.attempts}
                  eventId={eventId}
                  competitorId={competitorWithResults.id}
                />
                <LiveStatCells
                  stats={stats}
                  competitorId={competitorWithResults.id}
                  eventId={eventId}
                  result={r}
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
