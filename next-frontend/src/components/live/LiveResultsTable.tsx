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
import ResultMenu, { ClickPosition } from "@/components/live/Admin/ResultMenu";
import { useResultsAdminOptional } from "@/providers/LiveResultAdminProvider";
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
  forecastView = false,
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
  forecastView?: boolean;
}) {
  const { t } = useT();

  const [selectedRow, setSelectedRow] = useState<CompetitorWithResults>();
  const [menuClickPosition, setMenuClickPosition] = useState<ClickPosition>();

  const { eventId } = parseActivityCode(roundWcifId);

  const format = formats.byId[formatId];

  const pendingRegistrationIds = new Set(
    pendingLiveResults.map((r) => r.registration_id),
  );

  // Staged (not-yet-submitted) batch attempts — previewed in the competitor's
  // row (muted) so scoretakers see who's already entered in the current batch.
  const batchAttemptsByRegistrationId =
    useResultsAdminOptional()?.batchAttemptsByRegistrationId;

  const competitorsWithOrderedResults = mergeAndOrderResults(
    resultsByRegistrationId,
    competitors,
    format,
    forecastView,
  ).filter((c) => !pendingRegistrationIds.has(c.id));

  const stats = statColumnsForFormat(format);

  const isMobile = useBreakpointValue(
    { base: true, md: false },
    { fallback: "md" },
  );

  return (
    <>
      <Table.Root size="sm" interactive={isAdmin}>
        <LiveTableHeader
          format={format}
          isLinked={showLinkedRoundsView}
          t={t}
          isAdmin={isAdmin}
          forecastView={forecastView}
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

              const rowKey = `${competitorAndTheirResults.id}-${result.round_wcif_id}`;
              const batchAttempts = batchAttemptsByRegistrationId?.get(
                competitorAndTheirResults.id,
              );
              const inBatch = batchAttempts !== undefined;

              return (
                <Table.Row
                  key={rowKey}
                  onClick={(e) => {
                    if (isAdmin) {
                      setSelectedRow(competitorAndTheirResults);
                      setMenuClickPosition({ x: e.clientX, y: e.clientY });
                    } else if (isMobile) {
                      setSelectedRow(competitorAndTheirResults);
                    }
                  }}
                  cursor={isMobile || isAdmin ? "pointer" : undefined}
                  color={inBatch ? "fg.muted" : undefined}
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
                        open={selectedRow?.id === competitorAndTheirResults.id}
                        onOpenChange={(open) => {
                          setMenuClickPosition(
                            open ? menuClickPosition : undefined,
                          );
                          setSelectedRow(undefined);
                        }}
                        clickPos={
                          selectedRow?.id === competitorAndTheirResults.id
                            ? menuClickPosition
                            : undefined
                        }
                      />
                    </Table.Cell>
                  )}
                  {showText && (
                    <LiveCompetitorCell
                      competitionId={competitionId}
                      competitor={competitorAndTheirResults}
                      rowSpan={rowSpan}
                      link={!isAdmin}
                    />
                  )}
                  {showText && (
                    <CountryCell
                      countryIso2={competitorAndTheirResults.country_iso2}
                      rowSpan={rowSpan}
                      hideBelow="md"
                    />
                  )}
                  {showLinkedRoundsView && (
                    <Table.Cell>
                      {parseActivityCode(result.round_wcif_id).roundNumber}
                    </Table.Cell>
                  )}
                  <LiveAttemptsCells
                    format={format}
                    attempts={batchAttempts ?? result.attempts}
                    eventId={eventId}
                    competitorId={competitorAndTheirResults.id}
                  />
                  <LiveStatCells
                    stats={stats}
                    competitorId={competitorAndTheirResults.id}
                    eventId={eventId}
                    result={result}
                    highlight={showText}
                    forecastView={forecastView}
                    format={format}
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
