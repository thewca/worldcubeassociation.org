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
import { components } from "@/types/openapi";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import _ from "lodash";
import Flag from "react-world-flags";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordTagBadge } from "@/components/results/TableCells";
import formats from "@/lib/wca/data/formats";
import { orderResults } from "@/lib/live/orderResults";

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
  opacity: isVisible ? 1 : 0,
  transition: `opacity ${
    isVisible
      ? (transition?.enter?.duration ?? 1)
      : (transition?.exit?.duration ?? 1)
  }s ease-in-out`,
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
  SHOWING: 1000,
  HIDING: 1000,
} as const;

interface ResultsProjectorProps {
  results: components["schemas"]["LiveResult"][];
  competitors: components["schemas"]["LiveCompetitor"][];
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

  const format = formats.byId[formatId];
  const stats = statColumnsForFormat(format);
  const nonemptyResults = orderResults(
    results.filter((result) => result.attempts.length > 0),
    format,
  );

  const nonemptyResultsRef =
    useRef<components["schemas"]["LiveResult"][]>(nonemptyResults);
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
        const timeout: NodeJS.Timeout = setTimeout(
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
      const timeout: NodeJS.Timeout = setTimeout(() => {
        setStatus(STATUS.SHOWN);
      }, DURATION.SHOWING);
      return () => clearTimeout(timeout);
    }
    if (status === STATUS.HIDING) {
      const timeout: NodeJS.Timeout = setTimeout(() => {
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

  const competitorsByRegistrationId = _.keyBy(competitors, "id");

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
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader textAlign="right" w="75px">
                      #
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      w="22%"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      Name
                    </Table.ColumnHeader>
                    <Table.ColumnHeader w="50px"></Table.ColumnHeader>
                    {_.times(format.expected_solve_count, (index) => (
                      <Table.ColumnHeader textAlign="right">
                        {index + 1}
                      </Table.ColumnHeader>
                    ))}
                    {stats.map(({ name }) => (
                      <Table.ColumnHeader key={name} textAlign="right">
                        {name}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {nonemptyResults
                    .slice(topResultIndex, topResultIndex + getNumberOfRows())
                    .map((result, index) => {
                      const competitor =
                        competitorsByRegistrationId[result.registration_id];

                      const isVisible = [
                        STATUS.SHOWING,
                        STATUS.SHOWN,
                        STATUS.PAUSED,
                      ].includes(status);

                      return (
                        <Table.Row
                          whiteSpace="nowrap"
                          css={{
                            "&:last-child td": { border: 0 },
                          }}
                          key={result.registration_id}
                          style={fadeStyle({
                            isVisible,
                            transition: {
                              enter: { duration: DURATION.SHOWING / 1000 },
                              exit: { duration: DURATION.HIDING / 1000 },
                            },
                            style:
                              status === STATUS.SHOWING
                                ? { transitionDelay: `${index * 150}ms` }
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
                            {result.global_pos}
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
                      );
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
