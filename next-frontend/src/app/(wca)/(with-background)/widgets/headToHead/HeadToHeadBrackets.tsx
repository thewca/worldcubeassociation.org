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
                {isLastStage && stages.length > 1
                  ? t("competitions.h2h.finals")
                  : t("competitions.h2h.round_number", {
                      number: stageIndex + 1,
                    })}
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

  return (
    <Box borderWidth="1px" rounded="md">
      {label && (
        <Text
          textStyle="xs"
          color="fg.muted"
          px={3}
          pt={2}
          textTransform="uppercase"
        >
          {label}
        </Text>
      )}
      <HStack align="stretch" gap={0}>
        <Box flex="1">
          {match.competitors.map((competitor, index) => {
            const score = scores[index];
            const isWinner = competitor.user_id === winnerUserId;
            const fontWeight = isWinner ? "bold" : "normal";

            return (
              <HStack
                key={competitor.user_id}
                justify="space-between"
                px={3}
                py={2}
                borderTopWidth={index > 0 ? "1px" : undefined}
              >
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
                <HStack gap={3}>
                  <HStack gap={2}>
                    {score.raceWinsPerSet.map((raceWins, setIndex) => (
                      <Text key={setIndex} color="fg.muted">
                        {raceWins}
                      </Text>
                    ))}
                  </HStack>
                  <Text fontWeight="bold">{score.setWins}</Text>
                </HStack>
              </HStack>
            );
          })}
        </Box>
        <Flex align="center" pr={1}>
          <Tooltip
            showArrow
            content={<MatchAttemptsTables match={match} eventId={eventId} />}
          >
            <IconButton
              variant="ghost"
              size="2xs"
              colorPalette="gray"
              aria-label="attempt details"
            >
              <HiOutlineInformationCircle />
            </IconButton>
          </Tooltip>
        </Flex>
      </HStack>
    </Box>
  );
}

function MatchAttemptsTables({
  match,
  eventId,
}: {
  match: H2hMatch;
  eventId: string;
}) {
  const { t } = useT();

  return (
    <VStack align="stretch" gap={3} p={1}>
      {_.sortBy(match.sets, "set_number").map((set) => (
        <Box key={set.set_number}>
          {match.sets.length > 1 && (
            <Text fontWeight="bold" mb={1}>
              {t("competitions.h2h.set_number", { number: set.set_number })}
            </Text>
          )}
          <SetAttemptsTable set={set} match={match} eventId={eventId} />
        </Box>
      ))}
    </VStack>
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
