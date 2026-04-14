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
import _ from "lodash";
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
import { useT } from "@/lib/i18n/useI18n";

const padSkipped = (attempts: number[], expectedNumberOfAttempts: number) => {
  return [
    ...attempts,
    ...Array(expectedNumberOfAttempts - attempts.length).fill(0),
  ];
};

const fadeStyle = ({
  isVisible,
  transition,
  style,
}: {
  isVisible: boolean;
  transition?: {
    enter?: { duration?: number };
    exit?: { duration?: number };
  };
  style?: React.CSSProperties;
}): React.CSSProperties => ({
  opacity: isVisible ? 0 : 1,
  animation: isVisible
    ? `fadeIn ${transition?.enter?.duration ?? 1}s ease-in-out`
    : `fadeOut ${transition?.exit?.duration ?? 1}s ease-in-out`,
  animationFillMode: "forwards",
  ...style,
});

type StatusType = symbol;

const STATUS: Record<string, StatusType> = {
  SHOWING: Symbol("showing"),
  SHOWN: Symbol("shown"),
  HIDING: Symbol("hiding"),
  PAUSED: Symbol("paused"),
} as const;

const DURATION = {
  SHOWN: 10 * 1000,
  FORECAST_SHOWN: 20 * 1000,
  SHOWING: 3000,
  HIDING: 1000,
} as const;

interface ResultsProjectorProps {
  results: LiveResultsByRegistrationId;
  competitors: Map<number, LiveCompetitor>;
  formatId: string;
  eventId: string;
  title: string;
  disableProjectorView: () => void;
  forecastView?: boolean;
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
  disableProjectorView,
  forecastView,
  competitors,
}: ResultsProjectorProps) {
  const [status, setStatus] = useState<StatusType>(STATUS.SHOWING);
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
    if (status === STATUS.PAUSED) {
      return;
    }
    if (status === STATUS.SHOWN) {
      if (nonemptyResults.length > getNumberOfRows()) {
        const timeout = setTimeout(
          () => {
            setStatus(STATUS.HIDING);
          },
          forecastView ? DURATION.FORECAST_SHOWN : DURATION.SHOWN,
        );
        return () => clearTimeout(timeout);
      } else {
        return;
      }
    }
    if (status === STATUS.SHOWING) {
      const timeout = setTimeout(() => {
        setStatus(STATUS.SHOWN);
      }, DURATION.SHOWING);
      return () => clearTimeout(timeout);
    }
    if (status === STATUS.HIDING) {
      const timeout = setTimeout(() => {
        setStatus(STATUS.SHOWING);
        setTopResultIndex((topResultIndex) => {
          const newIndex = topResultIndex + getNumberOfRows();
          return newIndex > nonemptyResults.length ||
            (forecastView &&
              !nonemptyResults[topResultIndex].advancing &&
              !nonemptyResults[newIndex].advancing)
            ? 0
            : newIndex;
        });
      }, DURATION.HIDING);
      return () => clearTimeout(timeout);
    }
    throw new Error(`Unrecognized status: ${String(status)}`);
  }, [status, forecastView]);

  return (
    <Dialog.Root open={true} size="full">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxH="100vh"
            overflow="hidden"
            m={0}
            borderRadius={0}
            w="100%"
            h="100%"
          >
            <Dialog.Header
              bg="blue.600"
              color="white"
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
                {status === STATUS.PAUSED ? (
                  <IconButton
                    colorPalette="whiteAlpha"
                    variant="ghost"
                    onClick={() => setStatus(STATUS.HIDING)}
                    aria-label="Play"
                    size="lg"
                    mr={2}
                  >
                    <FaPlay />
                  </IconButton>
                ) : (
                  <IconButton
                    colorPalette="whiteAlpha"
                    variant="ghost"
                    onClick={() => setStatus(STATUS.PAUSED)}
                    aria-label="Pause"
                    size="lg"
                    mr={2}
                  >
                    <FaPause />
                  </IconButton>
                )}
                <IconButton
                  colorPalette="whiteAlpha"
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
              <Table.Root size="lg" css={{ tableLayout: "fixed" }}>
                <LiveTableHeader format={format} t={t} isProjector />
                <Table.Body>
                  {nonemptyResults
                    .slice(topResultIndex, topResultIndex + getNumberOfRows())
                    .map((competitor, index) => {
                      const isVisible = [
                        STATUS.SHOWING,
                        STATUS.SHOWN,
                        STATUS.PAUSED,
                      ].includes(status);

                      return competitor.results.map((result) => (
                        <Table.Row
                          whiteSpace="nowrap"
                          css={{
                            "&:last-child td": { border: 0 },
                          }}
                          key={`${result.registration_id}-${result.round_wcif_id}`}
                          style={fadeStyle({
                            isVisible,
                            transition: {
                              enter: { duration: DURATION.SHOWING / 1000 },
                              exit: { duration: DURATION.HIDING / 1000 },
                            },
                            style:
                              status === STATUS.SHOWING
                                ? { animationDelay: `${index * 100}ms` }
                                : {},
                          })}
                        >
                          <Table.Cell
                            fontSize="1.5rem"
                            pr={2}
                            textAlign="right"
                            bg={
                              result.advancing
                                ? "green"
                                : result.advancing_questionable
                                  ? "yellow"
                                  : undefined
                            }
                          >
                            {competitor.global_pos}
                          </Table.Cell>
                          <Table.Cell overflow="hidden" textOverflow="ellipsis">
                            {competitor.name}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <Flag code={competitor.country_iso2} />
                          </Table.Cell>
                          {padSkipped(
                            result.attempts.map((a) => a.value),
                            format.expected_solve_count,
                          ).map((attemptResult, attemptIndex) => (
                            <Table.Cell key={attemptIndex} textAlign="right">
                              {formatAttemptResult(attemptResult, eventId)}
                            </Table.Cell>
                          ))}
                          {stats.map(
                            ({ name, field, recordTagField }, statIndex) => (
                              <Table.Cell
                                key={name}
                                textAlign="right"
                                fontWeight={statIndex === 0 ? 600 : 400}
                              >
                                {formatAttemptResult(result[field], eventId)}{" "}
                                {recordTagBadge(result[recordTagField])}
                              </Table.Cell>
                            ),
                          )}
                        </Table.Row>
                      ));
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
