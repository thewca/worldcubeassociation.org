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
import { useT } from "@/lib/i18n/useI18n";
import { ByCompetitionResultsRow } from "@/lib/wca/results/competitionResults";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import {
  PositionCell,
  WithRecordTag,
  personalBestColor,
} from "@/components/results/TableCells";
import {
  AnalysedMatch,
  AnalysedRace,
  Outcome,
  analyseMatches,
} from "@/lib/wca/competitions/h2hMatches";

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

function stageLabel({ stage, matchNumber }: AnalysedMatch, t: TFunction) {
  switch (stage?.type) {
    case undefined:
      return t("competitions.h2h.match_number", { number: matchNumber });
    case "final":
      return t("competitions.h2h.final_stage");
    case "third_place":
      return t("competitions.h2h.third_place");
    case "semifinal":
      return t("competitions.h2h.semifinal_stage");
    case "quarterfinal":
      return t("competitions.h2h.quarterfinal_stage");
    case "stage_of":
      return t("competitions.h2h.stage_of", { number: stage.places });
  }
}

function SolveCell({
  race,
  eventId,
  recordTag,
  open,
}: {
  race?: AnalysedRace;
  eventId: string;
  recordTag: string | null;
  open: boolean;
}) {
  if (race?.own === undefined) return <RevealCell open={open} />;

  const { own, opponent, outcome } = race;

  const ownTime = (
    <WithRecordTag recordTag={recordTag}>
      {formatAttemptResult(own, eventId)}
    </WithRecordTag>
  );

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
        <Text as="div" fontWeight={outcome === "loss" ? "normal" : "bold"}>
          {ownTime}
        </Text>
        {opponent !== undefined && (
          <Text fontSize="xs" opacity={0.8}>
            {formatAttemptResult(opponent, eventId)}
          </Text>
        )}
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
  const { t } = useT();

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
          {t("competitions.h2h.set_number", { number: set.setNumber })}
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
          const race = set.races.find(
            ({ attemptNumber }) => attemptNumber === i + 1,
          );

          return (
            <SolveCell
              key={i}
              race={race}
              eventId={eventId}
              recordTag={race?.own === bestSingle.value ? bestSingle.tag : null}
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
  isSinglePersonalBest = false,
  defaultOpen = false,
}: {
  result: ByCompetitionResultsRow;
  showCompetition: boolean;
  attemptCount: number;
  anyAverages: boolean;
  isSinglePersonalBest?: boolean;
  defaultOpen?: boolean;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(defaultOpen);

  const eventId = result.event_id;
  const matches = analyseMatches(result);
  const matchesWon = matches.filter((match) => match.outcome === "win").length;
  const matchesLost = matches.filter(
    (match) => match.outcome === "loss",
  ).length;
  const matchCountLabel =
    matches.length === 1
      ? t("persons.show.results_table.match")
      : t("persons.show.results_table.matches");
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
            `${matches.length} ${matchCountLabel} · ${matchesWon}W ${matchesLost}L`}
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
