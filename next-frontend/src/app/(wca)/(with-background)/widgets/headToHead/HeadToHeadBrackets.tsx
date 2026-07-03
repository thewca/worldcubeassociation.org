"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { route } from "nextjs-routes";
import NextLink from "next/link";
import _ from "lodash";
import { TFunction } from "i18next";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";
import { Tooltip } from "@/components/ui/tooltip";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import {
  computeMatchScores,
  groupMatchesIntoStages,
  raceWinnerUserId,
  H2hMatch,
  H2hRound,
  H2hSet,
} from "@/lib/wca/results/headToHead";

export default function HeadToHeadBrackets({
  h2hRounds,
}: {
  h2hRounds: components["schemas"]["H2hRound"][];
}) {
  const eventIds = _.uniq(h2hRounds.map((round) => round.event_id));
  const [activeEventId, setActiveEventId] = useState<string>(eventIds[0]);

  const { t } = useT();

  const activeRounds = h2hRounds.filter(
    (round) => round.event_id === activeEventId,
  );

  return (
    <VStack align="left" gap={4}>
      {eventIds.length > 1 && (
        <SingleEventSelector
          title=""
          selectedEvent={activeEventId}
          onEventClick={setActiveEventId}
          eventList={eventIds}
        />
      )}
      {activeRounds.map((round) => (
        <Fragment key={round.id}>
          <Heading textStyle="h3">
            {events.byId[round.event_id].name}{" "}
            {t(`rounds.${round.round_type_id}.name`)}
          </Heading>
          <Bracket round={round} t={t} />
        </Fragment>
      ))}
    </VStack>
  );
}

function Bracket({ round, t }: { round: H2hRound; t: TFunction }) {
  const stages = useMemo(
    () => groupMatchesIntoStages(round.matches),
    [round.matches],
  );

  const places = _.uniqBy(
    round.matches.flatMap((match) => match.competitors),
    "user_id",
  ).length;

  return (
    <Box overflowX="auto">
      <HStack align="stretch" gap={8} minW="fit-content">
        {stages.map((stageMatches, stageIndex) => {
          const isLastStage = stageIndex === stages.length - 1;
          // The final goes on top of the third place match
          const orderedMatches = isLastStage
            ? _.sortBy(stageMatches, bestFinalPos)
            : stageMatches;

          return (
            <VStack key={stageIndex} align="stretch" minW="18rem" gap={4}>
              <Heading textStyle="h5">
                {stageLabel(stageIndex, stages.length, places, t)}
              </Heading>
              <VStack
                flex="1"
                align="stretch"
                justify={isLastStage ? "center" : "space-around"}
                gap={6}
              >
                {orderedMatches.map((match) => (
                  <MatchCard
                    key={match.match_number}
                    match={match}
                    eventId={round.event_id}
                    label={isLastStage ? thirdPlaceLabel(match, t) : undefined}
                  />
                ))}
              </VStack>
            </VStack>
          );
        })}
      </HStack>
    </Box>
  );
}

// Stage names as defined by regulation I2a, counted from the final backwards.
// Anything before the quarterfinals is a "Stage of N" where N is the number
// of places in the round (e.g. Stage of 12, Stage of 16).
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

function bestFinalPos(match: H2hMatch) {
  const positions = match.competitors
    .map((competitor) => competitor.final_pos)
    .filter((pos) => pos != null);

  return positions.length > 0 ? Math.min(...positions) : Infinity;
}

function thirdPlaceLabel(match: H2hMatch, t: TFunction) {
  const positions = match.competitors.map((competitor) => competitor.final_pos);
  if (positions.includes(1)) return undefined;
  if (positions.includes(3)) return t("competitions.h2h.third_place");
  return undefined;
}

function MatchCard({
  match,
  eventId,
  label,
}: {
  match: H2hMatch;
  eventId: string;
  label?: string;
}) {
  const { scores, winnerUserId } = computeMatchScores(match);
  const sets = _.sortBy(match.sets, "set_number");

  const competitorCells = (competitorIndex: number) => {
    const competitor = match.competitors[competitorIndex];
    const score = scores[competitorIndex];
    const fontWeight = competitor.user_id === winnerUserId ? "bold" : "normal";

    return (
      <Fragment key={competitor.user_id}>
        {competitor.wca_id ? (
          <Link asChild fontWeight={fontWeight}>
            <NextLink
              href={route({
                pathname: "/persons/[wcaId]",
                query: { wcaId: competitor.wca_id },
              })}
            >
              {competitor.name}
            </NextLink>
          </Link>
        ) : (
          <Text fontWeight={fontWeight}>{competitor.name}</Text>
        )}
        {score.raceWinsPerSet.map((raceWins, setIndex) => (
          <Text key={setIndex} color="fg.muted" textAlign="center">
            {raceWins}
          </Text>
        ))}
        <Text fontWeight="bold" textAlign="center">
          {score.setWins}
        </Text>
      </Fragment>
    );
  };

  return (
    <Box borderWidth="1px" rounded="md" px={3} py={2}>
      {label && (
        <Text textStyle="xs" color="fg.muted" textTransform="uppercase" mb={1}>
          {label}
        </Text>
      )}
      <Grid
        templateColumns={`minmax(0, 1fr) repeat(${sets.length}, auto) auto`}
        columnGap={3}
        alignItems="center"
      >
        {competitorCells(0)}
        {/* Liquipedia-style row of per-set info icons between the competitors */}
        <Box />
        {sets.map((set) => (
          <Flex key={set.set_number} justify="center">
            <SetAttemptsInfo set={set} match={match} eventId={eventId} />
          </Flex>
        ))}
        <Box />
        {_.range(1, match.competitors.length).map(competitorCells)}
      </Grid>
    </Box>
  );
}

function SetAttemptsInfo({
  set,
  match,
  eventId,
}: {
  set: H2hSet;
  match: H2hMatch;
  eventId: string;
}) {
  const { t } = useT();
  const setName = t("competitions.h2h.set_number", { number: set.set_number });

  return (
    <Tooltip
      showArrow
      content={
        <Box p={1}>
          {match.sets.length > 1 && (
            <Text fontWeight="bold" mb={1}>
              {setName}
            </Text>
          )}
          <SetAttemptsTable set={set} match={match} eventId={eventId} />
        </Box>
      }
    >
      <IconButton
        variant="ghost"
        size="2xs"
        colorPalette="gray"
        aria-label={setName}
      >
        <HiOutlineInformationCircle />
      </IconButton>
    </Tooltip>
  );
}

function SetAttemptsTable({
  set,
  match,
  eventId,
}: {
  set: H2hSet;
  match: H2hMatch;
  eventId: string;
}) {
  const attemptsByUserId = _.groupBy(set.attempts, "user_id");
  const winnerByRace = _.mapValues(
    _.groupBy(set.attempts, "set_attempt_number"),
    raceWinnerUserId,
  );
  const raceNumbers = _.range(
    1,
    Math.max(0, ...set.attempts.map((a) => a.set_attempt_number)) + 1,
  );

  return (
    <Grid
      templateColumns={`auto repeat(${raceNumbers.length}, auto)`}
      columnGap={3}
      rowGap={1}
    >
      {match.competitors.map((competitor) => {
        const attempts = attemptsByUserId[competitor.user_id] ?? [];

        return (
          <Fragment key={competitor.user_id}>
            <Text>{competitor.name}</Text>
            {raceNumbers.map((raceNumber) => {
              const attempt = attempts.find(
                (a) => a.set_attempt_number === raceNumber,
              );
              const isRaceWin = winnerByRace[raceNumber] === competitor.user_id;

              return (
                <Text
                  key={raceNumber}
                  textAlign="right"
                  fontWeight={isRaceWin ? "bold" : "normal"}
                >
                  {attempt?.value != null
                    ? formatAttemptResult(attempt.value, eventId)
                    : "–"}
                </Text>
              );
            })}
          </Fragment>
        );
      })}
    </Grid>
  );
}
