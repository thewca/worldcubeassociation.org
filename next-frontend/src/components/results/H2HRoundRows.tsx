import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  chakra,
  Link,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import { TFunction } from "i18next";
import _ from "lodash";
import { components } from "@/types/openapi";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { resultAttempts } from "@/lib/wca/results/attempts";
import {
  PositionCell,
  RoundNameCell,
  WithRecordTag,
} from "@/components/results/TableCells";

type V1Result = components["schemas"]["V1Result"];

export const isHeadToHead = (result: V1Result) =>
  result.ranking_mode === "head_to_head";

// True for the first result of an uninterrupted run of head-to-head results.
export function startsHeadToHeadRun(results: V1Result[], index: number) {
  return (
    isHeadToHead(results[index]) &&
    (index === 0 || !isHeadToHead(results[index - 1]))
  );
}

// The head-to-head results from `start` up to the first classic one.
export function headToHeadRunAt(results: V1Result[], start: number) {
  const run: V1Result[] = [];
  for (let i = start; i < results.length && isHeadToHead(results[i]); i++) {
    run.push(results[i]);
  }
  return run;
}

// The one piece of data this component cannot get from `V1Result` today: the
// opponent's time for each solve of the match, in the same units as `attempts`.
// Return `undefined` while the API does not expose it; the solve cells then show
// plain times with no win/loss colouring. Once it does, only this function changes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function opponentAttemptsOf(_result: V1Result): number[] | undefined {
  return undefined;
}

type Outcome = "win" | "loss" | "tie";

const isSolved = (value: number) => value > 0;

function outcomeOf(own: number, opponent: number): Outcome {
  if (!isSolved(own) && !isSolved(opponent)) return "tie";
  if (!isSolved(own)) return "loss";
  if (!isSolved(opponent)) return "win";
  if (own === opponent) return "tie";
  return own < opponent ? "win" : "loss";
}

const OUTCOME_STYLE = {
  win: { bg: "bg.success", color: "fg.success" },
  loss: { bg: "bg.error", color: "fg.error" },
  tie: { bg: "bg.emphasized", color: "fg.muted" },
} as const;

function SolveCell({
  own,
  opponent,
  eventId,
}: {
  own?: number;
  opponent?: number;
  eventId: string;
}) {
  if (own === undefined) return <Table.Cell />;

  if (opponent === undefined) {
    return <Table.Cell>{formatAttemptResult(own, eventId)}</Table.Cell>;
  }

  const outcome = outcomeOf(own, opponent);

  return (
    <Table.Cell px="1">
      <Box
        rounded="md"
        px="2"
        py="0.5"
        textAlign="center"
        lineHeight="short"
        {...OUTCOME_STYLE[outcome]}
      >
        <Text fontWeight={outcome === "loss" ? "normal" : "bold"}>
          {formatAttemptResult(own, eventId)}
        </Text>
        <Text fontSize="xs" opacity={0.8}>
          {formatAttemptResult(opponent, eventId)}
        </Text>
      </Box>
    </Table.Cell>
  );
}

// A collapsible group for one competition's head-to-head results. It renders a
// summary row and, when open, one row per head-to-head result, using the same
// columns as ByCompetitionTable so everything stays aligned.
export function HeadToHeadRoundRows({
  results,
  showCompetition,
  attemptCount,
  anyAverages,
  t,
  defaultOpen = false,
}: {
  results: V1Result[];
  showCompetition: boolean;
  attemptCount: number;
  anyAverages: boolean;
  t: TFunction;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Results arrive latest round first, so the first one is the deepest stage reached.
  const deepest = results[0];
  const eventId = deepest.event_id;
  const bestSingle = _.min(results.map((r) => r.best).filter(isSolved));

  return (
    <>
      <Table.Row>
        <Table.Cell>
          {showCompetition && (
            <Link asChild>
              <NextLink
                href={route({
                  pathname: "/competitions/[competitionId]",
                  query: { competitionId: deepest.competition_id },
                })}
              >
                {deepest.competition_short_name}
              </NextLink>
            </Link>
          )}
        </Table.Cell>
        <Table.Cell>
          <Button
            variant="plain"
            size="sm"
            px="0"
            minW="0"
            fontWeight="inherit"
            unstyled
            aria-expanded={open}
            onClick={() => setOpen((isOpen) => !isOpen)}
          >
            <Stack direction="row" alignItems="center">
              <chakra.span
                aria-hidden
                display="inline-block"
                transition="transform 0.15s"
                transform={open ? "rotate(90deg)" : undefined}
              >
                ▸
              </chakra.span>
              <Stack direction="row" alignItems="center">
                {t(`rounds.${deepest.round_type_id}.name`)}
                <Badge colorPalette="green">H2H</Badge>
              </Stack>
            </Stack>
          </Button>
        </Table.Cell>
        <PositionCell result={deepest} rankingMode={deepest.ranking_mode} />
        <Table.Cell fontWeight="extrabold">
          {bestSingle !== undefined && formatAttemptResult(bestSingle, eventId)}
        </Table.Cell>
        {anyAverages && <Table.Cell />}
        <Table.Cell colSpan={attemptCount} color="fg.muted">
          {results.length} {results.length === 1 ? "round" : "rounds"} played
        </Table.Cell>
      </Table.Row>

      {open &&
        results.map((result) => {
          const { definedAttempts } = resultAttempts(result);
          const opponentAttempts = opponentAttemptsOf(result);

          return (
            <Table.Row key={result.id} bg="bg.muted">
              <Table.Cell />
              <RoundNameCell
                roundTypeId={result.round_type_id}
                rankingMode={result.ranking_mode}
                t={t}
              />
              <PositionCell result={result} rankingMode={result.ranking_mode} />
              <Table.Cell>
                <WithRecordTag recordTag={result.regional_single_record}>
                  {formatAttemptResult(result.best, eventId)}
                </WithRecordTag>
              </Table.Cell>
              {anyAverages && <Table.Cell />}
              {_.range(attemptCount).map((i) => (
                <SolveCell
                  key={i}
                  own={definedAttempts[i]}
                  opponent={opponentAttempts?.[i]}
                  eventId={eventId}
                />
              ))}
            </Table.Row>
          );
        })}
    </>
  );
}
