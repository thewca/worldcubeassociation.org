"use client";

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
import { LiveCompetitor, PendingLiveResult } from "@/types/live";
import React, { useState } from "react";
import LiveResultsMobileModal from "@/components/live/LiveResultsMobileModal";
import ResultMenu from "@/components/live/Admin/ResultMenu";
import { useT } from "@/lib/i18n/useI18n";

export default function LiveResultsTable({
  resultsByRegistrationId,
  formatId,
  roundWcifId,
  competitionId,
  competitors,
  pendingQuitCompetitors = new Set(),
  pendingLiveResults = [],
  isAdmin = false,
  showEmpty = true,
  showLinkedRoundsView = false,
  isLinkedRound = false,
}: {
  resultsByRegistrationId: LiveResultsByRegistrationId;
  formatId: string;
  roundWcifId: string;
  competitionId: string;
  competitors: Map<number, LiveCompetitor>;
  pendingQuitCompetitors?: Set<number>;
  pendingLiveResults?: PendingLiveResult[];
  isAdmin?: boolean;
  showEmpty?: boolean;
  showLinkedRoundsView?: boolean;
  isLinkedRound?: boolean;
}) {
  const { t } = useT();

  const [selectedRow, setSelectedRow] = useState<CompetitorWithResults | null>(
    null,
  );

  const { eventId } = parseActivityCode(roundWcifId);

  const format = formats.byId[formatId];

  const pendingRegistrationIds = new Set(
    pendingLiveResults.map((r) => r.registration_id),
  );

  const competitorsWithOrderedResults = mergeAndOrderResults(
    resultsByRegistrationId,
    competitors,
    format,
  ).filter((c) => !pendingRegistrationIds.has(c.id));

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
          t={t}
          isAdmin={isAdmin}
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
                return undefined;
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
                      showAdvancing={!isLinkedRound || showLinkedRoundsView}
                    />
                  )}
                  {isAdmin && (
                    <Table.Cell>
                      <ResultMenu
                        result={result}
                        competitor={competitorAndTheirResults}
                        competitionId={competitionId}
                        roundId={roundWcifId}
                      />
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
                  {showText && showFull && (
                    <CountryCell
                      countryIso2={competitorAndTheirResults.country_iso2}
                      rowSpan={rowSpan}
                    />
                  )}
                  {showLinkedRoundsView && (
                    <Table.Cell>
                      {parseActivityCode(result.round_wcif_id).roundNumber}
                    </Table.Cell>
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
          t={t}
        />
      )}
    </>
  );
}
