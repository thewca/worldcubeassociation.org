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
  useRecipe,
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

const OUTCOME_PALETTE = {
  win: "green",
  loss: "red",
  tie: "gray",
} as const;

// The result's best single, which is what a record or personal-best tag refers to.
type BestSingle = {
  value: number;
  tag: string | null;
  color: string | undefined;
};

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
      transitionProperty="padding, border-width"
      transitionDuration="moderate"
      _motionReduce={{ transition: "none" }}
      width="fit-content"
    >
      <Box
        display="grid"
        gridTemplateRows={open ? "1fr" : "0fr"}
        transitionProperty="grid-template-rows"
        transitionDuration="moderate"
        _motionReduce={{ transition: "none" }}
      >
        <Box
          minH="0"
          visibility={open ? "visible" : "hidden"}
          transitionProperty="visibility"
          transitionDuration="moderate"
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
  bestSingle,
  open,
}: {
  race?: AnalysedRace;
  eventId: string;
  bestSingle: BestSingle;
  open: boolean;
}) {
  const recipe = useRecipe({ key: "h2hSolve" });

  if (race?.own === undefined) return <RevealCell open={open} />;

  const { own, opponent, outcome } = race;
  const isBestSingle = own === bestSingle.value;

  const ownTime = (
    <WithRecordTag recordTag={isBestSingle ? bestSingle.tag : null}>
      {formatAttemptResult(own, eventId)}
    </WithRecordTag>
  );

  return (
    <RevealCell open={open} px="1">
      <Box css={recipe({ outcome })}>
        <Box>{ownTime}</Box>
        {opponent !== undefined && (
          <Text textStyle="annotation">
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
  const { t } = useT();

  return (
    <Badge colorPalette={OUTCOME_PALETTE[outcome]}>
      {/* i18n-tasks-use t("competitions.h2h.score.win") */}
      {/* i18n-tasks-use t("competitions.h2h.score.loss") */}
      {/* i18n-tasks-use t("competitions.h2h.score.tie") */}
      {t(`competitions.h2h.score.${outcome}`, { own, opponent })}
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

  const attemptNumbers = _.range(1, attemptCount + 1);

  return match.sets.map((set, setIndex) => {
    const raceByAttemptNumber = _.keyBy(set.races, "attemptNumber");
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
              <Text textStyle="annotation" color="fg.muted">
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
        {attemptNumbers.map((attemptNumber) => (
          <SolveCell
            key={attemptNumber}
            race={raceByAttemptNumber[attemptNumber]}
            eventId={eventId}
            bestSingle={bestSingle}
            open={open}
          />
        ))}
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
  isFirstOfCompetition,
  attemptCount,
  anyAverages,
  isSinglePersonalBest = false,
  defaultOpen = false,
}: {
  result: ByCompetitionResultsRow;
  isFirstOfCompetition: boolean;
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
          {isFirstOfCompetition && (
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
                  transitionProperty="transform"
                  transitionDuration="fast"
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
              {t("formats.short.h")}
            </Badge>
          </HStack>
        </Table.Cell>
        <PositionCell result={result} rankingMode={result.ranking_mode} />
        <Table.Cell color={bestSingle.color} textStyle="bestResult">
          <WithRecordTag recordTag={bestSingle.tag}>
            {formatAttemptResult(result.best, eventId)}
          </WithRecordTag>
        </Table.Cell>
        {anyAverages && <Table.Cell />}
        <Table.Cell colSpan={attemptCount} color="fg.muted">
          {matches.length > 0 &&
            t("persons.show.h2h_summary", {
              count: matches.length,
              wins: matchesWon,
              losses: matchesLost,
            })}
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
