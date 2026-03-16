"use client";

import _ from "lodash";
import { Table, useBreakpointValue } from "@chakra-ui/react";
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
import {
  CompetitorWithResults,
  mergeAndOrderResults,
} from "@/lib/live/mergeAndOrderResults";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { LiveCompetitor } from "@/types/live";
import React, { useState } from "react";
import LiveResultsMobileModal from "@/components/live/LiveResultsMobileModal";
import ResultMenu from "@/components/live/Admin/ResultMenu";

export default function LiveResultsTable({
  resultsByRegistrationId,
  formatId,
  roundWcifId,
  competitionId,
  competitors,
  pendingQuitCompetitors = new Set(),
  isAdmin = false,
  showEmpty = true,
  showLinkedRoundsView = false,
}: {
  resultsByRegistrationId: LiveResultsByRegistrationId;
  formatId: string;
  roundWcifId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
  pendingQuitCompetitors?: Set<number>;
  isAdmin?: boolean;
  showEmpty?: boolean;
  showLinkedRoundsView?: boolean;
}) {
  const [selectedRow, setSelectedRow] = useState<CompetitorWithResults | null>(
    null,
  );

  const competitorsByRegistrationId = _.keyBy(competitors, "id");

  const { eventId } = parseActivityCode(roundWcifId);

  const format = formats.byId[formatId];

  const competitorsWithOrderedResults = mergeAndOrderResults(
    resultsByRegistrationId,
    competitorsByRegistrationId,
    format,
  );

  const stats = statColumnsForFormat(format);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const showFull = !isMobile;

  return (
    <>
      <Table.Root size="sm">
        <LiveTableHeader
          format={format}
          isLinked={showLinkedRoundsView}
          showFull={showFull}
        />
        <Table.Body>
          {competitorsWithOrderedResults.map((competitorAndTheirResults) => {
            return competitorAndTheirResults.results.map((result, index) => {
              const hasResult = result.attempts.length > 0;
              const showText = !showLinkedRoundsView || index === 0;
              const rowSpan = showLinkedRoundsView
                ? competitorAndTheirResults.results.length
                : 1;
              const ranking = hasResult
                ? competitorAndTheirResults.global_pos
                : "";

              if (!showLinkedRoundsView && result.round_wcif_id != roundWcifId)
                return undefined;

              if (!showEmpty && !hasResult) {
                return null;
              }

              return (
                <Table.Row
                  key={`${competitorAndTheirResults.id}-${result.round_wcif_id}`}
                  onClick={() => setSelectedRow(competitorAndTheirResults)}
                  cursor={isMobile ? "pointer" : undefined}
                  colorPalette={
                    pendingQuitCompetitors.has(competitorAndTheirResults.id)
                      ? "red"
                      : undefined
                  }
                >
                  {showText && (
                    <LivePositionCell
                      position={hasResult ? ranking : ""}
                      advancingParams={
                        showLinkedRoundsView
                          ? competitorAndTheirResults
                          : result
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
                      link={showFull}
                    />
                  )}
                  {showLinkedRoundsView && (
                    <Table.Cell>
                      {parseActivityCode(result.round_wcif_id).roundNumber}
                    </Table.Cell>
                  )}
                  {showText && showFull && (
                    <CountryCell
                      countryIso2={competitorAndTheirResults.country_iso2}
                      rowSpan={rowSpan}
                    />
                  )}
                  {showFull && (
                    <LiveAttemptsCells
                      format={format}
                      attempts={result.attempts}
                      eventId={eventId}
                      competitorId={competitorAndTheirResults.id}
                    />
                  )}
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
      {isMobile && (
        <LiveResultsMobileModal
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          competitionId={competitionId}
          eventId={eventId}
          stats={stats}
        />
      )}
    </>
  );
}
