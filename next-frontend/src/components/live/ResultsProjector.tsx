import { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  IconButton,
  Table,
  Dialog,
  Portal,
  Text,
} from "@chakra-ui/react";
import { FaPause, FaPlay, FaTimes } from "react-icons/fa";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import Flag from "react-world-flags";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordTagBadge } from "@/components/results/TableCells";
import formats from "@/lib/wca/data/formats";
import { LiveCompetitor } from "@/types/live";
import { LiveResultsByRegistrationId } from "@/providers/LiveResultProvider";
import {
  CompetitorWithResults,
  mergeAndOrderResults,
} from "@/lib/live/mergeAndOrderResults";
import { LiveTableHeader } from "@/components/live/Cells";
import { rankingCellColorPalette } from "@/lib/live/rankingCellColorPalette";
import { padSkipped } from "@/lib/live/padSkipped";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useT } from "@/lib/i18n/useI18n";

type Status = "showing" | "shown" | "hiding" | "paused";

const DURATION: Record<Status, number> = {
  showing: 3000,
  shown: 10 * 1000,
  hiding: 1000,
  paused: 0, // never read — paused has no timeout
};

interface ResultsProjectorProps {
  results: LiveResultsByRegistrationId;
  competitors: Map<number, LiveCompetitor>;
  formatId: string;
  eventId: string;
  title: string;
  isLinkedRound?: boolean;
  disableProjectorView: () => void;
}

/* (window height - app bar - table header) / row height */
function getNumberOfRows(): number {
  return Math.floor((window.innerHeight - 64 - 56) / 49);
}

function ResultsProjector({
  results,
  formatId,
  eventId,
  title,
  isLinkedRound = false,
  disableProjectorView,
  competitors,
}: ResultsProjectorProps) {
  const [status, setStatus] = useState<Status>("showing");
  const [topResultIndex, setTopResultIndex] = useState<number>(0);

  const { t } = useT();

  const format = formats.byId[formatId];
  const stats = statColumnsForFormat(format);
  const nonemptyResults = mergeAndOrderResults(
    results,
    competitors,
    format,
  ).filter((a) => a.results.some((r) => r.best !== 0));

  const nonemptyResultsRef = useRef<CompetitorWithResults[]>(nonemptyResults);
  useEffect(() => {
    nonemptyResultsRef.current = nonemptyResults;
  });

  useEffect(() => {
    const nonemptyResults = nonemptyResultsRef.current;

    const schedule = (action: () => void) => {
      const timeout = setTimeout(action, DURATION[status]);
      return () => clearTimeout(timeout);
    };

    switch (status) {
      case "paused":
        return;
      case "showing":
        return schedule(() => setStatus("shown"));
      case "shown":
        if (nonemptyResults.length <= getNumberOfRows()) {
          return;
        }
        return schedule(() => setStatus("hiding"));
      case "hiding":
        return schedule(() => {
          setStatus("showing");
          setTopResultIndex((topResultIndex) => {
            const newIndex = topResultIndex + getNumberOfRows();
            return newIndex >= nonemptyResults.length ? 0 : newIndex;
          });
        });
    }
  }, [status]);

  return (
    <Dialog.Root open={true} size="full">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            overflow="hidden"
            m={0}
            borderRadius={0}
            w="full"
            h="full"
          >
            <Dialog.Header
              color="fg"
              py={4}
              position="sticky"
              top={0}
              zIndex={1}
            >
              <Flex align="center">
                <Text fontSize="2xl" fontWeight="bold">
                  {title}
                </Text>
                <Box flex={1} />
                {status === "paused" ? (
                  <IconButton
                    variant="ghost"
                    onClick={() => setStatus("hiding")}
                    aria-label="Play"
                    size="lg"
                    mr={2}
                  >
                    <FaPlay />
                  </IconButton>
                ) : (
                  <IconButton
                    variant="ghost"
                    onClick={() => setStatus("paused")}
                    aria-label="Pause"
                    size="lg"
                    mr={2}
                  >
                    <FaPause />
                  </IconButton>
                )}
                <IconButton
                  variant="ghost"
                  aria-label="Close"
                  size="lg"
                  onClick={disableProjectorView}
                >
                  <FaTimes />
                </IconButton>
              </Flex>
            </Dialog.Header>

            <Dialog.Body p={0}>
              <Table.Root size="lg">
                <LiveTableHeader
                  format={format}
                  t={t}
                  isProjector
                  isLinked={isLinkedRound}
                />
                <Table.Body>
                  {nonemptyResults
                    .slice(topResultIndex, topResultIndex + getNumberOfRows())
                    .map((competitor, index) => {
                      const isVisible = (
                        ["showing", "shown", "paused"] as Status[]
                      ).includes(status);

                      const animationProps = {
                        opacity: isVisible ? 0 : 1,
                        animationName: isVisible ? "fade-in" : "fade-out",
                        animationDuration: `${(isVisible ? DURATION.showing : DURATION.hiding) / 1000}s`,
                        animationTimingFunction: "ease-in-out",
                        animationFillMode: "forwards" as const,
                        animationDelay:
                          status === "showing" ? `${index * 100}ms` : "0ms",
                      };

                      // For dual/linked rounds a competitor has one result per
                      // linked round, each shown on its own row with the
                      // combined ranking/name spanning them. Otherwise a single
                      // row for their best result.
                      const rows = isLinkedRound
                        ? competitor.results
                        : [competitor.results[0]];

                      return rows.map((result, resultIndex) => {
                        const showText = !isLinkedRound || resultIndex === 0;
                        const rowSpan = isLinkedRound
                          ? competitor.results.length
                          : 1;

                        return (
                          <Table.Row
                            whiteSpace="nowrap"
                            key={`${result.registration_id}-${result.round_wcif_id}`}
                            {...animationProps}
                          >
                            {showText && (
                              <Table.Cell
                                fontSize="1.5rem"
                                pr={2}
                                textAlign="right"
                                rowSpan={rowSpan}
                                layerStyle="fill.deep"
                                colorPalette={rankingCellColorPalette(
                                  competitor,
                                )}
                              >
                                {competitor.global_pos}
                              </Table.Cell>
                            )}
                            {showText && (
                              <Table.Cell
                                overflow="hidden"
                                textOverflow="ellipsis"
                                rowSpan={rowSpan}
                              >
                                {competitor.name}
                              </Table.Cell>
                            )}
                            {showText && (
                              <Table.Cell textAlign="center" rowSpan={rowSpan}>
                                <Flag code={competitor.country_iso2} />
                              </Table.Cell>
                            )}
                            {isLinkedRound && (
                              <Table.Cell textAlign="center">
                                {
                                  parseActivityCode(result.round_wcif_id)
                                    .roundNumber
                                }
                              </Table.Cell>
                            )}
                            {padSkipped(
                              result.attempts,
                              format.expected_solve_count,
                            ).map((attempt) => (
                              <Table.Cell
                                key={attempt.attempt_number}
                                textAlign="right"
                              >
                                {formatAttemptResult(attempt.value, eventId)}
                              </Table.Cell>
                            ))}
                            {stats.map(
                              (
                                { i18nKey, field, recordTagField },
                                statIndex,
                              ) => (
                                <Table.Cell
                                  key={i18nKey}
                                  textAlign="right"
                                  fontWeight={statIndex === 0 ? 600 : 400}
                                >
                                  {formatAttemptResult(result[field], eventId)}{" "}
                                  {recordTagBadge(result[recordTagField])}
                                </Table.Cell>
                              ),
                            )}
                          </Table.Row>
                        );
                      });
                    })}
                </Table.Body>
              </Table.Root>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default ResultsProjector;
