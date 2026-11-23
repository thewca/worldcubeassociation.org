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
import { PositionCell, WithRecordTag } from "@/components/results/TableCells";

type V1Result = components["schemas"]["V1Result"];

// ---------------------------------------------------------------------------
// Temporary local types, mirroring the dummy payload (h2h-result.dummy.json).
// Replace them with the generated OpenAPI types once the API officially
// exposes `matches` on a result.
// ---------------------------------------------------------------------------
type H2HCompetitor = {
  user_id: number;
  name: string;
  wca_id: string | null;
  country_iso2: string;
  final_pos: number;
};

type H2HSetAttempt = {
  set_attempt_number: number;
  user_id: number;
  value: number;
};

type H2HSet = {
  set_number: number;
  attempts: H2HSetAttempt[];
};

type H2HMatch = {
  match_number: number;
  competitors: H2HCompetitor[];
  sets: H2HSet[];
};

export type H2HResult = V1Result & { matches?: H2HMatch[] };

// ---------------------------------------------------------------------------
// Pure logic: turns the raw payload into what the rows need.
// ---------------------------------------------------------------------------
type Outcome = "win" | "loss" | "tie";

// WCA attempt values: > 0 is a time in centiseconds, -1 is DNF, -2 is DNS.
const isSolved = (value: number) => value > 0;

// A solve is a point for whoever is faster; a DNF only loses to a time.
function solveOutcome(own: number, opponent: number): Outcome {
  if (!isSolved(own) && !isSolved(opponent)) return "tie";
  if (!isSolved(own)) return "loss";
  if (!isSolved(opponent)) return "win";
  if (own === opponent) return "tie";
  return own < opponent ? "win" : "loss";
}

const outcomeFromCounts = (own: number, opponent: number): Outcome =>
  own > opponent ? "win" : own < opponent ? "loss" : "tie";

type AttemptPair = { own?: number; opponent?: number };

type AnalysedSet = {
  setNumber: number;
  pairs: AttemptPair[];
  ownPoints: number;
  opponentPoints: number;
  outcome: Outcome;
  best?: number;
};

type AnalysedMatch = {
  matchNumber: number;
  opponent: H2HCompetitor;
  sets: AnalysedSet[];
  ownSets: number;
  opponentSets: number;
  outcome: Outcome;
};

function analyseSet(
  set: H2HSet,
  ownId: number,
  opponentId: number,
): AnalysedSet {
  const valuesOf = (userId: number) =>
    Object.fromEntries(
      set.attempts
        .filter((a) => a.user_id === userId)
        .map((a) => [a.set_attempt_number, a.value]),
    ) as Record<number, number | undefined>;

  const ownValues = valuesOf(ownId);
  const opponentValues = valuesOf(opponentId);
  const length = _.max(set.attempts.map((a) => a.set_attempt_number)) ?? 0;

  const pairs: AttemptPair[] = _.range(1, length + 1).map((n) => ({
    own: ownValues[n],
    opponent: opponentValues[n],
  }));

  let ownPoints = 0;
  let opponentPoints = 0;
  pairs.forEach(({ own, opponent }) => {
    if (own === undefined || opponent === undefined) return;
    const outcome = solveOutcome(own, opponent);
    if (outcome === "win") ownPoints += 1;
    if (outcome === "loss") opponentPoints += 1;
  });

  const ownSolved = pairs
    .map((p) => p.own)
    .filter((v): v is number => v !== undefined && isSolved(v));

  return {
    setNumber: set.set_number,
    pairs,
    ownPoints,
    opponentPoints,
    outcome: outcomeFromCounts(ownPoints, opponentPoints),
    best: _.min(ownSolved),
  };
}

// `result` is the row of the person whose page this is. They are one of the two
// competitors of every match, matched by WCA ID (names are the fallback for
// competitors that have no WCA ID yet).
function analyseMatch(result: V1Result, match: H2HMatch): AnalysedMatch | null {
  const own =
    match.competitors.find((c) => c.wca_id && c.wca_id === result.wca_id) ??
    match.competitors.find((c) => c.name === result.name);
  const opponent = match.competitors.find((c) => c !== own);
  if (!own || !opponent) return null;

  const sets = _.sortBy(match.sets, "set_number").map((set) =>
    analyseSet(set, own.user_id, opponent.user_id),
  );
  const ownSets = sets.filter((s) => s.outcome === "win").length;
  const opponentSets = sets.filter((s) => s.outcome === "loss").length;

  return {
    matchNumber: match.match_number,
    opponent,
    sets,
    ownSets,
    opponentSets,
    outcome: outcomeFromCounts(ownSets, opponentSets),
  };
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------
// Copy of the stage helper used elsewhere; import the shared one instead if it is
// exported from somewhere.
function stageLabel(
  stageIndex: number,
  stageCount: number,
  places: number,
  t: TFunction,
) {
  const stagesFromFinal = stageCount - 1 - stageIndex;

  if (stagesFromFinal === 0) return t("competitions.h2h.final_stage");
  if (stagesFromFinal === 1) return t("competitions.h2h.semifinal_stage");
  if (stagesFromFinal === 2) return t("competitions.h2h.quarterfinal_stage");
  return t("competitions.h2h.stage_of", { number: places });
}

// Locates a match in a single-elimination bracket whose matches are numbered
// consecutively from 1, stage by stage. With 16 competitors: matches 1-8 are the
// stage of 16, 9-12 the quarterfinals, 13-14 the semifinals and 15 the final.
function stageOfMatch(matchNumber: number, bracketSize: number) {
  const stageCount = Math.log2(bracketSize);
  if (!Number.isInteger(stageCount) || matchNumber < 1) return null;

  let firstMatchOfStage = 1;
  for (let stageIndex = 0; stageIndex < stageCount; stageIndex++) {
    const matchesInStage = bracketSize / 2 ** (stageIndex + 1);
    if (matchNumber < firstMatchOfStage + matchesInStage) {
      return { stageIndex, stageCount, places: bracketSize / 2 ** stageIndex };
    }
    firstMatchOfStage += matchesInStage;
  }
  return null;
}

// Every solve column gets the same minimum width, so columns no longer shrink or
// grow with whatever happens to be in them.
const SOLVE_CELL_MIN_WIDTH = "4.5rem";

const OUTCOME_STYLE = {
  win: { bg: "bg.success", color: "fg.success" },
  loss: { bg: "bg.error", color: "fg.error" },
  tie: { bg: "bg.emphasized", color: "fg.muted" },
} as const;

const OUTCOME_PALETTE = { win: "green", loss: "red", tie: "gray" } as const;
const OUTCOME_LETTER = { win: "W", loss: "L", tie: "=" } as const;

function SolveCell({
  own,
  opponent,
  eventId,
}: {
  own?: number;
  opponent?: number;
  eventId: string;
}) {
  if (own === undefined) return <Table.Cell minW={SOLVE_CELL_MIN_WIDTH} />;

  if (opponent === undefined) {
    return (
      <Table.Cell minW={SOLVE_CELL_MIN_WIDTH}>
        {formatAttemptResult(own, eventId)}
      </Table.Cell>
    );
  }

  const outcome = solveOutcome(own, opponent);

  return (
    <Table.Cell px="1" minW={SOLVE_CELL_MIN_WIDTH}>
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

function ScoreBadge({
  outcome,
  own,
  opponent,
}: {
  outcome: Outcome;
  own: number;
  opponent: number;
}) {
  return (
    <Badge colorPalette={OUTCOME_PALETTE[outcome]}>
      {OUTCOME_LETTER[outcome]} {own}–{opponent}
    </Badge>
  );
}

function OpponentName({ opponent }: { opponent: H2HCompetitor }) {
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

// One head-to-head result of ByCompetitionTable: a summary row (named after the
// round, acting as the toggle) and, when open, one row per set of every match.
// It uses the same columns as the table so the solves stay aligned with the
// classic rows.
//
// Match row layout:
//   Competition column -> match number, opponent, match score (spans the sets)
//   Round column       -> set number
//   Place column       -> set score (points won in the set)
//   Single column      -> your best solve of the set
//   Solves             -> your time large, the opponent's small, coloured per solve
export function HeadToHeadRoundRows({
  result,
  showCompetition,
  attemptCount,
  anyAverages,
  t,
  bracketSize = 16,
  defaultOpen = false,
}: {
  result: H2HResult;
  showCompetition: boolean;
  attemptCount: number;
  anyAverages: boolean;
  t: TFunction;
  // Number of competitors that start the bracket (a power of two). Needed to turn
  // a match number into a stage name; defaults to the usual 16.
  bracketSize?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const matchLabel = (matchNumber: number) => {
    const stage = stageOfMatch(matchNumber, bracketSize);
    return stage
      ? stageLabel(stage.stageIndex, stage.stageCount, stage.places, t)
      : `Match ${matchNumber}`;
  };

  const eventId = result.event_id;

  // Latest match first, like the rest of the page.
  const matches = _.orderBy(result.matches ?? [], "match_number", "desc")
    .map((match) => analyseMatch(result, match))
    .filter((match): match is AnalysedMatch => match !== null);

  const matchesWon = matches.filter((m) => m.outcome === "win").length;
  const roundName = t(`rounds.${result.round_type_id}.name`);

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
        </Table.Cell>
        <PositionCell result={result} rankingMode={result.ranking_mode} />
        <Table.Cell fontWeight="extrabold">
          <WithRecordTag recordTag={result.regional_single_record}>
            {formatAttemptResult(result.best, eventId)}
          </WithRecordTag>
        </Table.Cell>
        {anyAverages && <Table.Cell />}
        <Table.Cell colSpan={attemptCount} color="fg.muted">
          {matches.length > 0 &&
            `${matches.length} ${matches.length === 1 ? "match" : "matches"} · ${matchesWon}W ${matches.length - matchesWon}L`}
        </Table.Cell>
      </Table.Row>

      {open &&
        matches.flatMap((match) =>
          match.sets.map((set, setIndex) => (
            <Table.Row
              key={`${match.matchNumber}-${set.setNumber}`}
              bg="bg.muted"
            >
              {setIndex === 0 && (
                <Table.Cell rowSpan={match.sets.length} verticalAlign="top">
                  <Stack gap="1" align="start">
                    <Text fontSize="xs" color="fg.muted">
                      {matchLabel(match.matchNumber)}
                    </Text>
                    <OpponentName opponent={match.opponent} />
                    <ScoreBadge
                      outcome={match.outcome}
                      own={match.ownSets}
                      opponent={match.opponentSets}
                    />
                  </Stack>
                </Table.Cell>
              )}
              <Table.Cell color="fg.muted">Set {set.setNumber}</Table.Cell>
              <Table.Cell>
                <ScoreBadge
                  outcome={set.outcome}
                  own={set.ownPoints}
                  opponent={set.opponentPoints}
                />
              </Table.Cell>
              <Table.Cell>
                {set.best !== undefined &&
                  formatAttemptResult(set.best, eventId)}
              </Table.Cell>
              {anyAverages && <Table.Cell />}
              {_.range(attemptCount).map((i) => (
                <SolveCell
                  key={i}
                  own={set.pairs[i]?.own}
                  opponent={set.pairs[i]?.opponent}
                  eventId={eventId}
                />
              ))}
            </Table.Row>
          )),
        )}
    </>
  );
}
