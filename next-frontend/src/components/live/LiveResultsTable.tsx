"use client";

import _ from "lodash";
import {
  Button,
  CloseButton,
  DataList,
  Dialog,
  HStack,
  Link,
  Table,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
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
import countries from "@/lib/wca/data/countries";
import { recordTagBadge } from "@/components/results/TableCells";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { route } from "nextjs-routes";

export default function LiveResultsTable({
  resultsByRegistrationId,
  formatId,
  roundWcifId,
  competitionId,
  competitors,
  isAdmin = false,
  showEmpty = true,
  showLinkedRoundsView = false,
}: {
  resultsByRegistrationId: LiveResultsByRegistrationId;
  formatId: string;
  roundWcifId: string;
  competitionId: string;
  competitors: LiveCompetitor[];
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

  return (
    <>
      <Table.Root size="sm">
        <LiveTableHeader
          format={format}
          isLinked={showLinkedRoundsView}
          showFull={!isMobile}
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
                  onClick={
                    isMobile
                      ? () => setSelectedRow(competitorAndTheirResults)
                      : undefined
                  }
                  cursor={isMobile ? "pointer" : undefined}
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
                      link={!isMobile}
                    />
                  )}
                  {showLinkedRoundsView && (
                    <Table.Cell>
                      {parseActivityCode(result.round_wcif_id).roundNumber}
                    </Table.Cell>
                  )}
                  {showText && !isMobile && (
                    <CountryCell
                      countryIso2={competitorAndTheirResults.country_iso2}
                      rowSpan={rowSpan}
                    />
                  )}
                  {!isMobile && (
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
        <Dialog.Root
          open={!!selectedRow}
          onOpenChange={({ open }) => {
            if (!open) setSelectedRow(null);
          }}
          placement="center"
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.CloseTrigger />
              <Dialog.Header>
                <Dialog.Title>{selectedRow?.name}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {selectedRow && (
                  <DataList.Root orientation="vertical">
                    <DataList.Item>
                      <DataList.ItemLabel>Name</DataList.ItemLabel>
                      <DataList.ItemValue>
                        <VStack>
                          {selectedRow.name}
                          <Link
                            href={route({
                              pathname:
                                "/competitions/[competitionId]/live/competitors/[registrationId]",
                              query: {
                                competitionId,
                                registrationId: selectedRow.id.toString(),
                              },
                            })}
                          >
                            All Results
                          </Link>
                        </VStack>
                      </DataList.ItemValue>
                    </DataList.Item>
                    <DataList.Item>
                      <DataList.ItemLabel>Country</DataList.ItemLabel>
                      <DataList.ItemValue>
                        <HStack>
                          {countries.byIso2[selectedRow.country_iso2].name}
                        </HStack>
                      </DataList.ItemValue>
                    </DataList.Item>
                    {selectedRow.results.map((r) => (
                      <React.Fragment key={r.round_wcif_id}>
                        <DataList.Item>
                          <DataList.ItemLabel>Attempts</DataList.ItemLabel>
                          <DataList.ItemValue>
                            {r.attempts
                              .map((a) => formatAttemptResult(a.value, eventId))
                              .join(", ")}
                          </DataList.ItemValue>
                        </DataList.Item>
                        {stats.map((stat) => (
                          <DataList.Item key={stat.name}>
                            <DataList.ItemLabel>{stat.name}</DataList.ItemLabel>
                            <DataList.ItemValue>
                              {formatAttemptResult(r[stat.field], eventId)}{" "}
                              {recordTagBadge(r[stat.recordTagField])}
                            </DataList.ItemValue>
                          </DataList.Item>
                        ))}
                      </React.Fragment>
                    ))}
                  </DataList.Root>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Close</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}
    </>
  );
}
