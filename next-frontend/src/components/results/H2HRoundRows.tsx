"use client";

import { ComponentProps, useState } from "react";
import {
  Badge,
  Box,
  Button,
  chakra,
  HStack,
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
import {
  PositionCell,
  WithRecordTag,
  personalBestColor,
} from "@/components/results/TableCells";
import {
  AnalysedMatch,
  Outcome,
  analyseMatches,
  solveOutcome,
} from "@/lib/wca/competitions/h2hMatches";

type V1PersonResult = components["schemas"]["V1PersonResult"];

const OUTCOME_UI = {
  win: {
    palette: "green",
    letter: "W",
    cell: { bg: "bg.success", color: "fg.success" },
  },
  loss: {
    palette: "red",
    letter: "L",
    cell: { bg: "bg.error", color: "fg.error" },
  },
  tie: {
    palette: "gray",
    letter: "=",
    cell: { bg: "bg.emphasized", color: "fg.muted" },
  },
} as const;

// The result's best single, which is what a record or personal-best tag refers to.
type BestSingle = {
  value: number;
  tag: string | null;
  color: string | undefined;
};

const REVEAL = "0.2s ease";

type CellProps = ComponentProps<typeof Table.Cell>;

// A cell that opens from, and closes to, nothing, so a whole row can animate.
//
// The content stays mounted while closed. That is deliberate: the table sizes its
// columns from every row it contains, so the widths are already settled when a
// row opens and nothing shifts. `visibility: hidden` keeps the closed content out
// of the tab order and away from screen readers, and is held back until the
// closing animation has finished.
function RevealCell({
  open,
  children,
  ...cellProps
}: CellProps & { open: boolean }) {
  return (
    <Table.Cell
      {...cellProps}
      py={open ? undefined : "0"}
      borderBottomWidth={open ? undefined : "0"}
      transition={`padding ${REVEAL}, border-width ${REVEAL}`}
      _motionReduce={{ transition: "none" }}
      width="fit-content"
    >
      <Box
        display="grid"
        gridTemplateRows={open ? "1fr" : "0fr"}
        transition={`grid-template-rows ${REVEAL}`}
        _motionReduce={{ transition: "none" }}
      >
        <Box
          minH="0"
          visibility={open ? "visible" : "hidden"}
          transition={`visibility 0s linear ${open ? "0s" : "0.2s"}`}
        >
          {children}
        </Box>
      </Box>
    </Table.Cell>
  );
}

function stageLabel({ stagePlaces, matchNumber }: AnalysedMatch, t: TFunction) {
  switch (stagePlaces) {
    case null:
      return `Match ${matchNumber}`;
    case 2:
      return t("competitions.h2h.final_stage");
    case 4:
      return t("competitions.h2h.semifinal_stage");
    case 8:
      return t("competitions.h2h.quarterfinal_stage");
    default:
      return t("competitions.h2h.stage_of", { number: stagePlaces });
  }
}

function SolveCell({
  own,
  opponent,
  eventId,
  recordTag,
  open,
}: {
  own?: number;
  opponent?: number;
  eventId: string;
  recordTag: string | null;
  open: boolean;
}) {
  if (own === undefined) return <RevealCell open={open} />;

  const ownTime = (
    <WithRecordTag recordTag={recordTag}>
      {formatAttemptResult(own, eventId)}
    </WithRecordTag>
  );

  if (opponent === undefined) {
    return <RevealCell open={open}>{ownTime}</RevealCell>;
  }

  const outcome = solveOutcome(own, opponent);

  return (
    <RevealCell open={open} px="1">
      <Box
        rounded="md"
        px="2"
        py="0.5"
        textAlign="center"
        lineHeight="short"
        {...OUTCOME_UI[outcome].cell}
      >
        <Text fontWeight={outcome === "loss" ? "normal" : "bold"}>
          {ownTime}
        </Text>
        <Text fontSize="xs" opacity={0.8}>
          {formatAttemptResult(opponent, eventId)}
        </Text>
      </Box>
    </RevealCell>
  );
}

function ScoreBadge({
  outcome,
  own,
  opponent,
}: {
  outcome: Outcome;
  own: number;
  opponent: number;
}) {
  const { palette, letter } = OUTCOME_UI[outcome];

  return (
    <Badge colorPalette={palette}>
      {letter} {own}–{opponent}
    </Badge>
  );
}

function OpponentLink({ opponent }: { opponent: AnalysedMatch["opponent"] }) {
  if (!opponent.wca_id) return <>{opponent.name}</>;

  return (
    <Link asChild>
      <NextLink
        href={route({
          pathname: "/persons/[wcaId]",
          query: { wcaId: opponent.wca_id },
        })}
      >
        {opponent.name}
      </NextLink>
    </Link>
  );
}

// One row per set. The first one carries the match (stage, opponent, score) in a
// cell that spans all the sets of the match.
//   Competition column -> stage, opponent, match score
//   Round column       -> set number
//   Place column       -> set score (points won in the set)
//   Single column      -> person's best solve of the set
//   Solves             -> person's time large, the opponent's small, coloured per solve
function MatchRows({
  match,
  stage,
  eventId,
  attemptCount,
  anyAverages,
  bestSingle,
  open,
}: {
  match: AnalysedMatch;
  stage: string;
  eventId: string;
  attemptCount: number;
  anyAverages: boolean;
  bestSingle: BestSingle;
  open: boolean;
}) {
  return match.sets.map((set, setIndex) => {
    const setHoldsBestSingle = set.best === bestSingle.value;

    return (
      <Table.Row
        key={set.setNumber}
        bg="bg.muted"
        borderBottomWidth={open ? undefined : "0"}
      >
        {setIndex === 0 && (
          <RevealCell
            open={open}
            rowSpan={match.sets.length}
            verticalAlign="top"
          >
            <Stack gap="1" align="start">
              <Text fontSize="xs" color="fg.muted">
                {stage}
              </Text>
              <OpponentLink opponent={match.opponent} />
              <ScoreBadge
                outcome={match.outcome}
                own={match.ownSets}
                opponent={match.opponentSets}
              />
            </Stack>
          </RevealCell>
        )}
        <RevealCell open={open} color="fg.muted">
          Set {set.setNumber}
        </RevealCell>
        <RevealCell open={open}>
          <ScoreBadge
            outcome={set.outcome}
            own={set.ownPoints}
            opponent={set.opponentPoints}
          />
        </RevealCell>
        <RevealCell
          open={open}
          color={setHoldsBestSingle ? bestSingle.color : undefined}
        >
          {set.best !== undefined && (
            <WithRecordTag
              recordTag={setHoldsBestSingle ? bestSingle.tag : null}
            >
              {formatAttemptResult(set.best, eventId)}
            </WithRecordTag>
          )}
        </RevealCell>
        {anyAverages && <RevealCell open={open} />}
        {_.range(attemptCount).map((i) => {
          const own = set.pairs[i]?.own;

          return (
            <SolveCell
              key={i}
              own={own}
              opponent={set.pairs[i]?.opponent}
              eventId={eventId}
              recordTag={own === bestSingle.value ? bestSingle.tag : null}
              open={open}
            />
          );
        })}
      </Table.Row>
    );
  });
}

// One head-to-head result of ByCompetitionTable: a summary row, named after the
// round and acting as the toggle, and the rows of every match, which open and
// close under it. It uses the same columns as the table, so the solves stay
// aligned with the classic rows.
export function HeadToHeadRoundRows({
  result,
  showCompetition,
  attemptCount,
  anyAverages,
  t,
  isSinglePersonalBest = false,
  defaultOpen = false,
}: {
  result: V1PersonResult;
  showCompetition: boolean;
  attemptCount: number;
  anyAverages: boolean;
  t: TFunction;
  isSinglePersonalBest?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const eventId = result.event_id;
  const matches = analyseMatches(result);
  const matchesWon = matches.filter((match) => match.outcome === "win").length;
  const roundName = t(`rounds.${result.round_type_id}.name`);

  const bestSingle: BestSingle = {
    value: result.best,
    tag: isSinglePersonalBest ? "PR" : result.regional_single_record,
    color: isSinglePersonalBest
      ? personalBestColor(result.regional_single_record)
      : undefined,
  };

  return (
    <>
      <Table.Row>
        <Table.Cell>
          {showCompetition && (
            <Link asChild>
              <NextLink
                href={route({
                  pathname: "/competitions/[competitionId]",
                  query: { competitionId: result.competition_id },
                })}
              >
                {result.competition_short_name}
              </NextLink>
            </Link>
          )}
        </Table.Cell>
        <Table.Cell>
          <HStack gap="2">
            {matches.length > 0 ? (
              <Button
                variant="plain"
                size="sm"
                px="0"
                h="auto"
                minW="0"
                fontWeight="inherit"
                aria-expanded={open}
                onClick={() => setOpen((isOpen) => !isOpen)}
              >
                <chakra.span
                  aria-hidden
                  display="inline-block"
                  transition="transform 0.15s"
                  transform={open ? "rotate(90deg)" : undefined}
                >
                  ▸
                </chakra.span>
                {roundName}
              </Button>
            ) : (
              roundName
            )}
            <Badge size="xs" variant="outline">
              H2H
            </Badge>
          </HStack>
        </Table.Cell>
        <PositionCell result={result} rankingMode={result.ranking_mode} />
        <Table.Cell color={bestSingle.color} fontWeight="extrabold">
          <WithRecordTag recordTag={bestSingle.tag}>
            {formatAttemptResult(result.best, eventId)}
          </WithRecordTag>
        </Table.Cell>
        {anyAverages && <Table.Cell />}
        <Table.Cell colSpan={attemptCount} color="fg.muted">
          {matches.length > 0 &&
            `${matches.length} ${t(matches.length === 1 ? "persons.show.results_table.match" : "persons.show.results_table.matches")} · ${matchesWon}W ${matches.length - matchesWon}L`}
        </Table.Cell>
      </Table.Row>

      {matches.map((match) => (
        <MatchRows
          key={match.matchNumber}
          match={match}
          stage={stageLabel(match, t)}
          eventId={eventId}
          attemptCount={attemptCount}
          anyAverages={anyAverages}
          bestSingle={bestSingle}
          open={open}
        />
      ))}
    </>
  );
}
